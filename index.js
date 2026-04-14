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

// ================= CLIENT =================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ================= DB =================

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

// ================= COMMANDS =================

const commands = [
  new SlashCommandBuilder().setName("db_menu").setDescription("🎛️ Menu"),
  new SlashCommandBuilder().setName("db_inscription").setDescription("⭐ VIP panel"),
  new SlashCommandBuilder().setName("db_list").setDescription("📅 Liste semaine")
];

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

// ================= READY =================

client.once("ready", async () => {

  console.log(`✅ CONNECTÉ : ${client.user.tag}`);

  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID),
    { body: commands }
  );

  setInterval(checkBirthdays, 60000);
});

// ================= INLINE SYSTEM =================

const waiting = new Map();

// ================= SAFE SAVE (IMPORTANT FIX) =================

function saveSetting(guildId, field, value) {

  const allowed = [
    "role",
    "anniv_channel",
    "anniv_message",
    "vip_message",
    "vip_button",
    "list_title",
    "vip_title",
    "novip_title",
    "list_footer"
  ];

  if (!allowed.includes(field)) return;

  db.run(
    `INSERT INTO settings (guild, ${field})
     VALUES (?, ?)
     ON CONFLICT(guild) DO UPDATE SET ${field}=excluded.${field}`,
    [guildId, value]
  );
}

// ================= UTILS =================

function isThisWeek(dateStr) {
  const [d, m] = dateStr.split("/").map(Number);

  const now = new Date();
  const date = new Date(now.getFullYear(), m - 1, d);

  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());

  const end = new Date(start);
  end.setDate(start.getDate() + 7);

  return date >= start && date <= end;
}

// ================= INTERACTIONS =================

client.on(Events.InteractionCreate, async (interaction) => {

  const guildId = interaction.guild?.id;
  if (!guildId) return;

  try {

    // ================= MENU =================
    if (interaction.isChatInputCommand() && interaction.commandName === "db_menu") {

      const isAdmin = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);

      const embed = new EmbedBuilder()
        .setTitle("🎂 ANNIVERSAIRES SYSTEM")
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

    // ================= VIP PANEL =================
    if (interaction.isChatInputCommand() && interaction.commandName === "db_inscription") {

      if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return interaction.reply({ content: "❌ Admin uniquement", ephemeral: true });
      }

      db.get("SELECT * FROM settings WHERE guild=?", [guildId], (err, cfg) => {

        const embed = new EmbedBuilder()
          .setTitle("⭐ VIP")
          .setDescription(cfg?.vip_message || "Clique pour devenir VIP")
          .setColor(0xffcc00);

        const btn = new ButtonBuilder()
          .setCustomId("vip_join")
          .setLabel(cfg?.vip_button || "⭐ VIP")
          .setStyle(ButtonStyle.Success);

        interaction.channel.send({
          embeds: [embed],
          components: [new ActionRowBuilder().addComponents(btn)]
        });

        interaction.reply({ content: "✅ VIP envoyé", ephemeral: true });
      });
    }

    // ================= LISTE =================
    if (interaction.isChatInputCommand() && interaction.commandName === "db_list") {

      if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return interaction.reply({ content: "❌ Admin uniquement", ephemeral: true });
      }

      db.all("SELECT * FROM anniversaires WHERE guild=?", [guildId], (err, rows) => {

        const week = rows.filter(r => isThisWeek(r.date));

        const vip = [];
        const novip = [];

        let done = 0;

        if (!week.length) {
          return interaction.reply("📭 Aucun anniversaire cette semaine");
        }

        db.get("SELECT * FROM settings WHERE guild=?", [guildId], (e, cfg) => {

          week.forEach(r => {

            db.get("SELECT * FROM vip WHERE guild=? AND user=?", [guildId, r.user], (e, v) => {

              if (v) vip.push(r);
              else novip.push(r);

              done++;

              if (done === week.length) {

                const text =
`🎂 **${cfg?.list_title || "LISTE SEMAINE"}**

⭐ **${cfg?.vip_title || "VIP"}**
${vip.length ? vip.map(x => `🎂 <@${x.user}> → **${x.date}**`).join("\n") : "Aucun"}

👤 **${cfg?.novip_title || "NON VIP"}**
${novip.length ? novip.map(x => `🎂 <@${x.user}> → **${x.date}**`).join("\n") : "Aucun"}

---

${cfg?.list_footer || "🎉 Anniversaires"}`;

                interaction.reply({ content: text });
              }
            });
          });
        });
      });
    }

    // ================= BUTTONS =================
    if (interaction.isButton()) {

      if (interaction.customId === "vip_join") {

        db.run("INSERT OR IGNORE INTO vip VALUES (?, ?)", [guildId, interaction.user.id]);

        return interaction.reply({ content: "⭐ VIP ajouté", ephemeral: true });
      }

      if (interaction.customId === "admin_panel") {

        const menu = new StringSelectMenuBuilder()
          .setCustomId("admin_menu")
          .setPlaceholder("⚙️ Gestion")
          .addOptions(
            { label: "🎭 Rôle (@role)", value: "role" },
            { label: "📢 Salon (#salon)", value: "channel" },
            { label: "📝 Message", value: "message" },
            { label: "🏷️ Titre liste", value: "list_title" },
            { label: "⭐ VIP titre", value: "vip_title" },
            { label: "👤 Non VIP titre", value: "novip_title" },
            { label: "📄 Footer", value: "footer" },
            { label: "⭐ VIP message", value: "vip_message" },
            { label: "🔘 VIP bouton", value: "vip_button" }
          );

        return interaction.reply({
          components: [new ActionRowBuilder().addComponents(menu)],
          ephemeral: true
        });
      }
    }

    // ================= MENU INLINE =================
    if (interaction.isStringSelectMenu()) {

      if (interaction.customId !== "admin_menu") return;

      const value = interaction.values[0];

      const ask = (field) => {

        interaction.reply({ content: "✍️ Envoie dans le chat", ephemeral: true });

        waiting.set(interaction.user.id, { field, guildId });
      };

      if (value === "role") ask("role");
      if (value === "channel") ask("anniv_channel");
      if (value === "message") ask("anniv_message");
      if (value === "list_title") ask("list_title");
      if (value === "vip_title") ask("vip_title");
      if (value === "novip_title") ask("novip_title");
      if (value === "footer") ask("list_footer");
      if (value === "vip_message") ask("vip_message");
      if (value === "vip_button") ask("vip_button");
    }

  } catch (err) {
    console.error(err);
  }
});

// ================= MESSAGE INPUT =================

client.on("messageCreate", (msg) => {

  if (msg.author.bot) return;

  const wait = waiting.get(msg.author.id);
  if (!wait) return;

  waiting.delete(msg.author.id);

  let value = msg.content;

  if (wait.field === "role") {
    const role = msg.mentions.roles.first();
    if (!role) return msg.reply("❌ Mentionne un rôle");
    value = role.id;
  }

  if (wait.field === "anniv_channel") {
    const ch = msg.mentions.channels.first();
    if (!ch) return msg.reply("❌ Mentionne un salon");
    value = ch.id;
  }

  saveSetting(wait.guildId, wait.field, value);

  msg.reply("✅ Sauvegardé !");
});

// ================= AUTO ANNIV =================

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

        const role = cfg?.role ? guild.roles.cache.get(cfg.role) : null;

        if (dd === d && mm === m && role) {
          await member.roles.add(role).catch(() => {});
        } else if (role) {
          await member.roles.remove(role).catch(() => {});
        }
      });
    }
  });
}

// ================= LOGIN =================

client.login(process.env.DISCORD_TOKEN);
