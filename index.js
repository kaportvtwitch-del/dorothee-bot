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
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
  StringSelectMenuBuilder
} = require("discord.js");

const sqlite3 = require("sqlite3").verbose();

// =====================
// CLIENT
// =====================

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

// =====================
// DB
// =====================

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
    vip_button TEXT
  )`);
});

// =====================
// COMMANDES
// =====================

const commands = [
  new SlashCommandBuilder().setName("db_menu").setDescription("🎛️ Menu anniversaire"),
  new SlashCommandBuilder().setName("db_inscription").setDescription("⭐ Panel VIP"),
  new SlashCommandBuilder().setName("db_list").setDescription("📅 Liste semaine")
];

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

// =====================
// READY
// =====================

client.once("ready", async () => {

  console.log(`✅ CONNECTÉ : ${client.user.tag}`);

  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID),
    { body: commands }
  );

  setInterval(checkBirthdays, 60000);
});

// =====================
// UTILS
// =====================

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

// =====================
// INTERACTIONS
// =====================

client.on(Events.InteractionCreate, async (interaction) => {

  const guildId = interaction.guild?.id;
  if (!guildId) return;

  try {

    // =====================
    // /db_menu
    // =====================
    if (interaction.isChatInputCommand() && interaction.commandName === "db_menu") {

      const isAdmin = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);

      const embed = new EmbedBuilder()
        .setTitle("🎂 ANNIVERSAIRES MENU")
        .setDescription("Gestion du système")
        .setColor(0x8e44ad);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("my_date")
          .setLabel("🎂 Ma date")
          .setStyle(ButtonStyle.Success),

        ...(isAdmin ? [
          new ButtonBuilder()
            .setCustomId("admin_panel")
            .setLabel("⚙️ Admin")
            .setStyle(ButtonStyle.Primary)
        ] : [])
      );

      return interaction.reply({
        embeds: [embed],
        components: [row],
        ephemeral: true
      });
    }

    // =====================
    // /db_inscription
    // =====================
    if (interaction.isChatInputCommand() && interaction.commandName === "db_inscription") {

      if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return interaction.reply({ content: "❌ Admin uniquement", ephemeral: true });
      }

      const cfg = await new Promise(res =>
        db.get("SELECT * FROM settings WHERE guild=?", [guildId], (e, r) => res(r))
      );

      const embed = new EmbedBuilder()
        .setTitle("⭐ VIP")
        .setDescription(cfg?.vip_message || "Clique pour rejoindre VIP")
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

    // =====================
    // /db_list (SEMAINE)
    // =====================
    if (interaction.isChatInputCommand() && interaction.commandName === "db_list") {

      if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return interaction.reply({ content: "❌ Admin uniquement", ephemeral: true });
      }

      db.all("SELECT * FROM anniversaires WHERE guild=?", [guildId], (err, rows) => {

        if (!rows) return interaction.reply("📭 Vide");

        const week = rows.filter(r => isThisWeek(r.date));

        if (!week.length) {
          return interaction.reply("📭 Aucun anniversaire cette semaine");
        }

        const text = week.map(r =>
          `🎂 <@${r.user}> → **${r.date}**`
        ).join("\n");

        return interaction.reply({ content: text });
      });
    }

    // =====================
    // BUTTONS
    // =====================

    if (interaction.isButton()) {

      // 🎂 date
      if (interaction.customId === "my_date") {

        const modal = new ModalBuilder()
          .setCustomId("date_modal")
          .setTitle("🎂 Date anniversaire");

        const input = new TextInputBuilder()
          .setCustomId("input")
          .setLabel("JJ/MM")
          .setStyle(TextInputStyle.Short);

        modal.addComponents(new ActionRowBuilder().addComponents(input));

        return interaction.showModal(modal);
      }

      // ⭐ VIP
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
          .setPlaceholder("⚙️ Configuration")
          .addOptions(
            { label: "🎭 Rôle jour J", value: "role" },
            { label: "📢 Salon anniversaire", value: "channel" },
            { label: "📝 Message anniversaire", value: "message" }
          );

        return interaction.reply({
          components: [new ActionRowBuilder().addComponents(menu)],
          ephemeral: true
        });
      }
    }

    // =====================
    // SELECT MENU
    // =====================

    if (interaction.isStringSelectMenu()) {

      if (interaction.customId === "admin_menu") {

        const value = interaction.values[0];

        if (value === "role") {

          const modal = new ModalBuilder()
            .setCustomId("role_modal")
            .setTitle("🎭 Rôle jour J");

          const input = new TextInputBuilder()
            .setCustomId("input")
            .setLabel("ID rôle")
            .setStyle(TextInputStyle.Short);

          modal.addComponents(new ActionRowBuilder().addComponents(input));

          return interaction.showModal(modal);
        }

        if (value === "channel") {

          const modal = new ModalBuilder()
            .setCustomId("channel_modal")
            .setTitle("📢 Salon anniversaire");

          const input = new TextInputBuilder()
            .setCustomId("input")
            .setLabel("ID salon")
            .setStyle(TextInputStyle.Short);

          modal.addComponents(new ActionRowBuilder().addComponents(input));

          return interaction.showModal(modal);
        }

        if (value === "message") {

          const modal = new ModalBuilder()
            .setCustomId("message_modal")
            .setTitle("📝 Message anniversaire");

          const input = new TextInputBuilder()
            .setCustomId("input")
            .setLabel("Message {user}")
            .setStyle(TextInputStyle.Paragraph);

          modal.addComponents(new ActionRowBuilder().addComponents(input));

          return interaction.showModal(modal);
        }
      }
    }

    // =====================
    // MODALS
    // =====================

    if (interaction.isModalSubmit()) {

      const value = interaction.fields.getTextInputValue("input");

      if (interaction.customId === "date_modal") {

        db.run("INSERT OR REPLACE INTO anniversaires VALUES (?, ?, ?)", [
          guildId,
          interaction.user.id,
          value
        ]);

        return interaction.reply({ content: "🎉 Date enregistrée", ephemeral: true });
      }

      if (interaction.customId === "role_modal") {

        db.run(`INSERT INTO settings (guild, role)
          VALUES (?, ?)
          ON CONFLICT(guild) DO UPDATE SET role=?`,
          [guildId, value, value]
        );

        return interaction.reply({ content: "🎭 Rôle enregistré", ephemeral: true });
      }

      if (interaction.customId === "channel_modal") {

        db.run(`INSERT INTO settings (guild, anniv_channel)
          VALUES (?, ?)
          ON CONFLICT(guild) DO UPDATE SET anniv_channel=?`,
          [guildId, value, value]
        );

        return interaction.reply({ content: "📢 Salon enregistré", ephemeral: true });
      }

      if (interaction.customId === "message_modal") {

        db.run(`INSERT INTO settings (guild, anniv_message)
          VALUES (?, ?)
          ON CONFLICT(guild) DO UPDATE SET anniv_message=?`,
          [guildId, value, value]
        );

        return interaction.reply({ content: "📝 Message enregistré", ephemeral: true });
      }
    }

  } catch (err) {
    console.error(err);
  }
});

// =====================
// AUTO ANNIVERSAIRE
// =====================

async function checkBirthdays() {

  const today = new Date();
  const d = today.getDate();
  const m = today.getMonth() + 1;

  db.all("SELECT * FROM anniversaires", async (err, rows) => {

    for (const row of rows) {

      const [dd, mm] = row.date.split("/").map(Number);

      if (dd !== d || mm !== m) continue;

      const guild = await client.guilds.fetch(row.guild).catch(() => null);
      if (!guild) continue;

      const member = await guild.members.fetch(row.user).catch(() => null);
      if (!member) continue;

      db.get("SELECT role FROM settings WHERE guild=?", [row.guild], async (err, cfg) => {

        if (!cfg?.role) return;

        const role = guild.roles.cache.get(cfg.role);
        if (!role) return;

        await member.roles.add(role).catch(() => {});
      });
    }
  });
}

// =====================
// LOGIN
// =====================

client.login(process.env.DISCORD_TOKEN);
