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
    anniv_channel TEXT
  )`);
});

// ================= COMMANDS =================

const commands = [
  new SlashCommandBuilder().setName("db_menu").setDescription("🎛️ Menu principal"),
  new SlashCommandBuilder().setName("db_inscription").setDescription("⭐ Panel VIP"),
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

    // ================= MENU PRINCIPAL =================
    if (interaction.isChatInputCommand() && interaction.commandName === "db_menu") {

      const isAdmin = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);

      const embed = new EmbedBuilder()
        .setTitle("🎂 ANNIVERSAIRES SYSTEM")
        .setColor(0x8e44ad)
        .setDescription("Menu principal");

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
        ] : []),

        new ButtonBuilder()
          .setCustomId("close")
          .setLabel("❌ Fermer")
          .setStyle(ButtonStyle.Danger)
      );

      return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }

    // ================= VIP PANEL =================
    if (interaction.isChatInputCommand() && interaction.commandName === "db_inscription") {

      if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return interaction.reply({ content: "❌ Admin uniquement", ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setTitle("⭐ VIP INSCRIPTION")
        .setDescription("Clique pour devenir VIP")
        .setColor(0xffcc00);

      const btn = new ButtonBuilder()
        .setCustomId("vip_join")
        .setLabel("⭐ Rejoindre VIP")
        .setStyle(ButtonStyle.Success);

      const close = new ButtonBuilder()
        .setCustomId("close")
        .setLabel("❌ Fermer")
        .setStyle(ButtonStyle.Danger);

      return interaction.channel.send({
        embeds: [embed],
        components: [new ActionRowBuilder().addComponents(btn, close)]
      });
    }

    // ================= LISTE =================
    if (interaction.isChatInputCommand() && interaction.commandName === "db_list") {

      if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return interaction.reply({ content: "❌ Admin uniquement", ephemeral: true });
      }

      db.all("SELECT * FROM anniversaires WHERE guild=?", [guildId], (err, rows) => {

        const week = rows.filter(r => isThisWeek(r.date));

        if (!week.length) {
          return interaction.reply("📭 Aucun anniversaire cette semaine");
        }

        const vip = [];
        const novip = [];

        let done = 0;

        week.forEach(r => {

          db.get("SELECT * FROM vip WHERE guild=? AND user=?", [guildId, r.user], (e, v) => {

            if (v) vip.push(r);
            else novip.push(r);

            done++;

            if (done === week.length) {

              const text =
`🎂 **LISTE SEMAINE**

⭐ **VIP**
${vip.length ? vip.map(x => `🎂 <@${x.user}> → **${x.date}**`).join("\n") : "Aucun"}

👤 **NON VIP**
${novip.length ? novip.map(x => `🎂 <@${x.user}> → **${x.date}**`).join("\n") : "Aucun"}

---

🎉 Anniversaires`;

              interaction.reply({ content: text });
            }
          });
        });
      });
    }

    // ================= BUTTONS =================
    if (interaction.isButton()) {

      if (interaction.customId === "close") {
        return interaction.message.delete().catch(() => {});
      }

      if (interaction.customId === "vip_join") {

        db.run("INSERT OR IGNORE INTO vip VALUES (?, ?)", [guildId, interaction.user.id]);

        return interaction.reply({ content: "⭐ VIP ajouté", ephemeral: true });
      }

      if (interaction.customId === "admin_panel") {

        const menu = new StringSelectMenuBuilder()
          .setCustomId("admin_menu")
          .setPlaceholder("⚙️ Gestion")
          .addOptions(
            { label: "🎭 Rôle jour J", value: "role" },
            { label: "📢 Salon anniversaire", value: "channel" }
          );

        const close = new ButtonBuilder()
          .setCustomId("close")
          .setLabel("❌ Fermer")
          .setStyle(ButtonStyle.Danger);

        return interaction.reply({
          components: [
            new ActionRowBuilder().addComponents(menu),
            new ActionRowBuilder().addComponents(close)
          ],
          ephemeral: true
        });
      }
    }

    // ================= SELECT MENU =================
    if (interaction.isStringSelectMenu()) {

      if (interaction.customId !== "admin_menu") return;

      const value = interaction.values[0];

      if (value === "role") {

        interaction.reply({ content: "✍️ Mentionne un rôle", ephemeral: true });

        const filter = m => m.author.id === interaction.user.id;

        const collector = interaction.channel.createMessageCollector({ filter, max: 1, time: 30000 });

        collector.on("collect", msg => {

          const role = msg.mentions.roles.first();
          if (!role) return msg.reply("❌ rôle invalide");

          db.run(`INSERT INTO settings (guild, role)
          VALUES (?, ?)
          ON CONFLICT(guild) DO UPDATE SET role=?`,
            [guildId, role.id, role.id]
          );

          msg.reply("🎭 Rôle enregistré");
        });
      }

      if (value === "channel") {

        interaction.reply({ content: "📢 Mentionne un salon", ephemeral: true });

        const filter = m => m.author.id === interaction.user.id;

        const collector = interaction.channel.createMessageCollector({ filter, max: 1, time: 30000 });

        collector.on("collect", msg => {

          const ch = msg.mentions.channels.first();
          if (!ch) return msg.reply("❌ salon invalide");

          db.run(`INSERT INTO settings (guild, anniv_channel)
          VALUES (?, ?)
          ON CONFLICT(guild) DO UPDATE SET anniv_channel=?`,
            [guildId, ch.id, ch.id]
          );

          msg.reply("📢 Salon enregistré");
        });
      }
    }

  } catch (err) {
    console.error(err);
  }
});

// ================= AUTO ANNIVERSAIRE =================

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
