process.on("uncaughtException", console.error);
process.on("unhandledRejection", console.error);

const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events,
  PermissionsBitField,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
  StringSelectMenuBuilder
} = require("discord.js");

const sqlite3 = require("sqlite3").verbose();

// ===================== CLIENT =====================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ===================== DB =====================

const db = new sqlite3.Database("/tmp/anniv.db");

db.serialize(() => {

  db.run(`CREATE TABLE IF NOT EXISTS anniversaires (
    guild TEXT,
    user TEXT,
    date TEXT,
    PRIMARY KEY (guild, user)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS vip (
    guild TEXT,
    user TEXT,
    PRIMARY KEY (guild, user)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS settings (
    guild TEXT PRIMARY KEY,
    role TEXT,
    anniv_channel TEXT,
    anniv_message TEXT,
    vip_message TEXT,
    vip_button TEXT,
    list_title TEXT,
    vip_title TEXT,
    novip_title TEXT,
    list_footer TEXT
  )`);
});

// ===================== COMMANDS =====================

const commands = [
  new SlashCommandBuilder().setName("db_menu").setDescription("🎛️ Menu anniversaire"),
  new SlashCommandBuilder().setName("db_inscription").setDescription("⭐ Panel VIP"),
  new SlashCommandBuilder().setName("db_list").setDescription("📅 Liste semaine")
];

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

// ===================== READY =====================

client.once("ready", async () => {

  console.log(`✅ CONNECTÉ : ${client.user.tag}`);

  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID),
    { body: commands }
  );

  setInterval(checkBirthdays, 60000);
});

// ===================== MAP INLINE INPUT =====================

const waiting = new Map();

// ===================== UTILS =====================

function isThisWeek(dateStr) {
  const [d, m] = dateStr.split("/").map(Number);

  const now = new Date();
  const year = now.getFullYear();

  const date = new Date(year, m - 1, d);

  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());

  const end = new Date(start);
  end.setDate(start.getDate() + 7);

  return date >= start && date <= end;
}

// ===================== INTERACTIONS =====================

client.on(Events.InteractionCreate, async (interaction) => {

  const guildId = interaction.guild?.id;
  if (!guildId) return;

  try {

    // ===================== /db_menu =====================
    if (interaction.isChatInputCommand() && interaction.commandName === "db_menu") {

      const isAdmin = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);

      const embed = new EmbedBuilder()
        .setTitle("🎂 ANNIVERSAIRES PANEL")
        .setDescription("Gestion complète du bot")
        .setColor(0x8e44ad);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("my_date")
          .setLabel("🎂 Ma date")
          .setStyle(ButtonStyle.Success),

        ...(isAdmin ? [
          new ButtonBuilder()
            .setCustomId("admin_panel")
            .setLabel("⚙️ Gestion")
            .setStyle(ButtonStyle.Primary)
        ] : [])
      );

      return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }

    // ===================== /db_inscription =====================
    if (interaction.isChatInputCommand() && interaction.commandName === "db_inscription") {

      if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return interaction.reply({ content: "❌ Admin uniquement", ephemeral: true });
      }

      const cfg = await new Promise(res =>
        db.get("SELECT * FROM settings WHERE guild=?", [guildId], (e, r) => res(r))
      );

      const embed = new EmbedBuilder()
        .setTitle("⭐ VIP INSCRIPTION")
        .setDescription(cfg?.vip_message || "Clique pour devenir VIP")
        .setColor(0xffcc00);

      const btn = new ButtonBuilder()
        .setCustomId("vip_join")
        .setLabel(cfg?.vip_button || "⭐ VIP")
        .setStyle(ButtonStyle.Success);

      return interaction.channel.send({
        embeds: [embed],
        components: [new ActionRowBuilder().addComponents(btn)]
      });
    }

    // ===================== /db_list =====================
    if (interaction.isChatInputCommand() && interaction.commandName === "db_list") {

      if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return interaction.reply({ content: "❌ Admin uniquement", ephemeral: true });
      }

      db.all("SELECT * FROM anniversaires WHERE guild=?", [guildId], (err, rows) => {

        const week = rows.filter(r => isThisWeek(r.date));

        const vip = [];
        const novip = [];

        let done = 0;

        week.forEach(r => {

          db.get("SELECT * FROM vip WHERE guild=? AND user=?", [guildId, r.user], (e, v) => {

            if (v) vip.push(r);
            else novip.push(r);

            done++;

            if (done === week.length) {

              db.get("SELECT * FROM settings WHERE guild=?", [guildId], (e, cfg) => {

                const text =
`📅 **${cfg?.list_title || "LISTE SEMAINE"}**

⭐ **${cfg?.vip_title || "VIP"}**
${vip.map(v => `• <@${v.user}> (${v.date})`).join("\n") || "Aucun"}

👤 **${cfg?.novip_title || "NON VIP"}**
${novip.map(n => `• <@${n.user}> (${n.date})`).join("\n") || "Aucun"}

---

${cfg?.list_footer || "🎂 Bot anniversaires"}`;

                interaction.reply({ content: text });
              });
            }
          });
        });

        if (!week.length) {
          interaction.reply("📭 Aucun anniversaire cette semaine");
        }
      });
    }

    // ===================== BUTTONS =====================
    if (interaction.isButton()) {

      // 🎂 date
      if (interaction.customId === "my_date") {

        return interaction.reply({
          content: "✍️ Écris ta date ici (JJ/MM)",
          ephemeral: true
        });
      }

      // ⭐ VIP JOIN
      if (interaction.customId === "vip_join") {

        db.run("INSERT OR IGNORE INTO vip VALUES (?, ?)", [guildId, interaction.user.id]);

        return interaction.reply({ content: "⭐ VIP ajouté", ephemeral: true });
      }

      // ⚙️ ADMIN PANEL
      if (interaction.customId === "admin_panel") {

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
          return interaction.reply({ content: "❌ Admin uniquement", ephemeral: true });
        }

        const menu = new StringSelectMenuBuilder()
          .setCustomId("admin_menu")
          .setPlaceholder("⚙️ Gestion complète")
          .addOptions(
            { label: "🎭 Rôle jour J (@role)", value: "role" },
            { label: "📢 Salon (#salon)", value: "channel" },
            { label: "📝 Message anniversaire", value: "message" },

            { label: "🏷️ Titre liste", value: "list_title" },
            { label: "⭐ Titre VIP", value: "vip_title" },
            { label: "👤 Titre non VIP", value: "novip_title" },
            { label: "📄 Footer", value: "footer" },

            { label: "⭐ Message VIP", value: "vip_message" },
            { label: "🔘 Bouton VIP", value: "vip_button" }
          );

        return interaction.reply({
          components: [new ActionRowBuilder().addComponents(menu)],
          ephemeral: true
        });
      }
    }

    // ===================== SELECT MENU =====================
    if (interaction.isStringSelectMenu()) {

      if (interaction.customId !== "admin_menu") return;

      const value = interaction.values[0];

      const ask = (key, callback) => {

        interaction.reply({
          content: "✍️ Envoie la valeur dans le chat",
          ephemeral: true
        });

        waiting.set(interaction.user.id, { key, guildId, callback });
      };

      // ROLE
      if (value === "role") {

        ask("role", (msg) => {

          const role = msg.mentions.roles.first();
          if (!role) return msg.reply("❌ Mentionne un rôle");

          db.run(`INSERT INTO settings (guild, role)
          VALUES (?, ?)
          ON CONFLICT(guild) DO UPDATE SET role=?`,
            [guildId, role.id, role.id]
          );

          msg.reply("🎭 Rôle enregistré");
        });
      }

      // CHANNEL
      if (value === "channel") {

        ask("channel", (msg) => {

          const ch = msg.mentions.channels.first();
          if (!ch) return msg.reply("❌ Mentionne un salon");

          db.run(`INSERT INTO settings (guild, anniv_channel)
          VALUES (?, ?)
          ON CONFLICT(guild) DO UPDATE SET anniv_channel=?`,
            [guildId, ch.id, ch.id]
          );

          msg.reply("📢 Salon enregistré");
        });
      }

      // MESSAGE
      if (value === "message") {

        ask("message", (msg) => {

          db.run(`INSERT INTO settings (guild, anniv_message)
          VALUES (?, ?)
          ON CONFLICT(guild) DO UPDATE SET anniv_message=?`,
            [guildId, msg.content, msg.content]
          );

          msg.reply("📝 Message enregistré");
        });
      }

      // TITRES + FOOTER
      const simpleSave = (field) => {
        ask(field, (msg) => {

          db.run(`INSERT INTO settings (guild, ${field})
          VALUES (?, ?)
          ON CONFLICT(guild) DO UPDATE SET ${field}=?`,
            [guildId, msg.content, msg.content]
          );

          msg.reply("✅ Sauvegardé");
        });
      };

      if (value === "list_title") simpleSave("list_title");
      if (value === "vip_title") simpleSave("vip_title");
      if (value === "novip_title") simpleSave("novip_title");
      if (value === "footer") simpleSave("list_footer");
      if (value === "vip_message") simpleSave("vip_message");
      if (value === "vip_button") simpleSave("vip_button");
    }

  } catch (err) {
    console.error(err);
  }
});

// ===================== MESSAGE LISTENER INLINE =====================

client.on("messageCreate", (msg) => {

  if (msg.author.bot) return;

  const wait = waiting.get(msg.author.id);
  if (!wait) return;

  if (msg.guild.id !== wait.guildId) return;

  waiting.delete(msg.author.id);

  wait.callback(msg);
});

// ===================== AUTO ANNIVERSAIRE =====================

async function checkBirthdays() {

  const today = new Date();
  const d = today.getDate();
  const m = today.getMonth() + 1;

  db.all("SELECT * FROM anniversaires", async (err, rows) => {

    for (const r of rows) {

      const [dd, mm] = r.date.split("/").map(Number);

      const guild = await client.guilds.fetch(r.guild).catch(() => null);
      if (!guild) continue;

      const member = await guild.members.fetch(r.user).catch(() => null);
      if (!member) continue;

      db.get("SELECT role FROM settings WHERE guild=?", [r.guild], async (e, cfg) => {

        if (dd === d && mm === m && cfg?.role) {

          const role = guild.roles.cache.get(cfg.role);
          if (role) await member.roles.add(role).catch(() => {});

        } else if (cfg?.role) {

          const role = guild.roles.cache.get(cfg.role);
          if (role) await member.roles.remove(role).catch(() => {});
        }
      });
    }
  });
}

// ===================== LOGIN =====================

client.login(process.env.DISCORD_TOKEN);
