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

// =======================
// CLIENT
// =======================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

// =======================
// DATABASE
// =======================

const db = new sqlite3.Database("/tmp/anniv.db");

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS anniversaires (guild TEXT, user TEXT, date TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS vip (guild TEXT, user TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS settings (
    guild TEXT PRIMARY KEY,
    titre TEXT,
    message TEXT,
    message_vip TEXT,
    panel TEXT,
    bouton TEXT,
    role TEXT
  )`);
});

// =======================
// COMMANDES
// =======================

const commands = [
  new SlashCommandBuilder().setName("db_menu").setDescription("🎂 Menu anniversaire"),
  new SlashCommandBuilder().setName("db_panel").setDescription("🎛️ Panneau de configuration")
];

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

// =======================
// READY
// =======================

client.once("ready", async () => {
  console.log(`✅ CONNECTÉ : ${client.user.tag}`);

  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID),
    { body: commands }
  );

  console.log("✅ COMMANDES OK");

  setInterval(checkBirthdays, 60000);
});

// =======================
// INTERACTIONS
// =======================

client.on(Events.InteractionCreate, async (interaction) => {

  const guildId = interaction.guild?.id;

  try {

    // =======================
    // SLASH COMMANDS
    // =======================

    if (interaction.isChatInputCommand()) {

      // -----------------------
      // MENU SIMPLE
      // -----------------------
      if (interaction.commandName === "db_menu") {

        return interaction.reply({
          content: "🎂 Menu",
          ephemeral: true,
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId("date")
                .setLabel("🎂 Ma date")
                .setStyle(ButtonStyle.Success),

              new ButtonBuilder()
                .setCustomId("admin")
                .setLabel("⚙️ Gestion")
                .setStyle(ButtonStyle.Secondary)
            )
          ]
        });
      }

      // -----------------------
      // PANEL CONFIG
      // -----------------------
      if (interaction.commandName === "db_panel") {

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
          return interaction.reply({ content: "❌ Admin uniquement", ephemeral: true });
        }

        const embed = new EmbedBuilder()
          .setTitle("🎛️ Panneau de configuration")
          .setDescription("Choisis une action dans le menu ci-dessous.")
          .setColor(0x8e44ad);

        const menu = new StringSelectMenuBuilder()
          .setCustomId("config_menu")
          .setPlaceholder("📌 Sélectionne une option")
          .addOptions(
            {
              label: "📺 Liste des anniversaires",
              value: "list"
            },
            {
              label: "🎭 Définir le rôle",
              value: "role"
            },
            {
              label: "📝 Message anniversaire",
              value: "message"
            },
            {
              label: "📨 Envoyer panel utilisateur",
              value: "send_panel"
            }
          );

        return interaction.reply({
          embeds: [embed],
          components: [new ActionRowBuilder().addComponents(menu)],
          ephemeral: true
        });
      }
    }

    // =======================
    // BUTTONS
    // =======================

    if (interaction.isButton()) {

      if (interaction.customId === "date" || interaction.customId === "vip") {

        if (interaction.customId === "vip") {
          db.run("INSERT OR IGNORE INTO vip VALUES (?, ?)", [guildId, interaction.user.id]);
        }

        const modal = new ModalBuilder()
          .setCustomId("date_modal")
          .setTitle("🎂 Ta date de naissance");

        const input = new TextInputBuilder()
          .setCustomId("input")
          .setLabel("Ex: 15/08/1998")
          .setStyle(TextInputStyle.Short);

        modal.addComponents(
          new ActionRowBuilder().addComponents(input)
        );

        return interaction.showModal(modal);
      }

      if (interaction.customId === "admin") {

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
          return interaction.reply({ content: "❌ Admin uniquement", ephemeral: true });
        }

        return interaction.reply({
          content: "⚙️ Gestion rapide",
          ephemeral: true,
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId("list")
                .setLabel("📺 Liste")
                .setStyle(ButtonStyle.Primary),

              new ButtonBuilder()
                .setCustomId("role")
                .setLabel("🎭 Rôle")
                .setStyle(ButtonStyle.Secondary)
            )
          ]
        });
      }

      if (interaction.customId === "list") {

        await interaction.deferReply({ ephemeral: true });

        db.all("SELECT * FROM anniversaires WHERE guild=?", [guildId], (err, rows) => {

          if (err) return interaction.editReply("❌ DB erreur");
          if (!rows.length) return interaction.editReply("📭 Vide");

          const list = rows.map(r => `<@${r.user}> → ${r.date}`).join("\n");

          interaction.editReply(list);
        });
      }

      if (interaction.customId === "role") {

        const modal = new ModalBuilder()
          .setCustomId("role_modal")
          .setTitle("🎭 ID du rôle");

        const input = new TextInputBuilder()
          .setCustomId("input")
          .setLabel("Colle l'ID du rôle")
          .setStyle(TextInputStyle.Short);

        modal.addComponents(
          new ActionRowBuilder().addComponents(input)
        );

        return interaction.showModal(modal);
      }
    }

    // =======================
    // SELECT MENU
    // =======================

    if (interaction.isStringSelectMenu()) {

      if (interaction.customId === "config_menu") {

        const value = interaction.values[0];

        // LISTE
        if (value === "list") {

          db.all("SELECT * FROM anniversaires WHERE guild=?", [guildId], (err, rows) => {

            if (err) return interaction.reply({ content: "❌ DB erreur", ephemeral: true });
            if (!rows.length) return interaction.reply({ content: "📭 Aucun anniversaire", ephemeral: true });

            const text = rows.map(r => `🎂 <@${r.user}> → **${r.date}**`).join("\n");

            interaction.reply({ content: text, ephemeral: true });
          });
        }

        // ROLE
        if (value === "role") {

          const modal = new ModalBuilder()
            .setCustomId("role_modal")
            .setTitle("🎭 Rôle anniversaire");

          const input = new TextInputBuilder()
            .setCustomId("input")
            .setLabel("ID du rôle")
            .setStyle(TextInputStyle.Short);

          modal.addComponents(
            new ActionRowBuilder().addComponents(input)
          );

          return interaction.showModal(modal);
        }

        // MESSAGE
        if (value === "message") {

          const modal = new ModalBuilder()
            .setCustomId("message_modal")
            .setTitle("📝 Message anniversaire");

          const input = new TextInputBuilder()
            .setCustomId("input")
            .setLabel("Ex: Bon anniversaire {user} 🎉")
            .setStyle(TextInputStyle.Paragraph);

          modal.addComponents(
            new ActionRowBuilder().addComponents(input)
          );

          return interaction.showModal(modal);
        }

        // PANEL USER
        if (value === "send_panel") {

          const embed = new EmbedBuilder()
            .setTitle("🎂 Inscription anniversaire")
            .setDescription("Clique pour enregistrer ta date 🎉")
            .setColor(0xffcc00);

          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("date")
              .setLabel("🎂 Ma date")
              .setStyle(ButtonStyle.Success)
          );

          await interaction.channel.send({
            embeds: [embed],
            components: [row]
          });

          return interaction.reply({ content: "✅ Panel envoyé", ephemeral: true });
        }
      }
    }

    // =======================
    // MODALS
    // =======================

    if (interaction.isModalSubmit()) {

      const value = interaction.fields.getTextInputValue("input");

      await interaction.deferReply({ ephemeral: true });

      if (interaction.customId === "date_modal") {

        db.run(
          "INSERT OR REPLACE INTO anniversaires VALUES (?, ?, ?)",
          [guildId, interaction.user.id, value],
          (err) => {
            if (err) return interaction.editReply("❌ DB erreur");
            interaction.editReply("🎉 Date enregistrée !");
          }
        );
      }

      if (interaction.customId === "role_modal") {

        db.run(
          `INSERT INTO settings (guild, role) VALUES (?, ?) 
           ON CONFLICT(guild) DO UPDATE SET role=?`,
          [guildId, value, value],
          () => interaction.editReply("✅ Rôle enregistré")
        );
      }
    }

  } catch (err) {
    console.error(err);
  }
});

// =======================
// ANNIVERSAIRES AUTO
// =======================

async function checkBirthdays() {

  const today = new Date();
  const d = today.getDate();
  const m = today.getMonth() + 1;

  db.all("SELECT * FROM anniversaires", async (err, rows) => {

    for (const row of rows) {

      try {
        const guild = await client.guilds.fetch(row.guild);
        const member = await guild.members.fetch(row.user);

        db.get("SELECT role FROM settings WHERE guild=?", [row.guild], async (err, config) => {

          if (!config?.role) return;

          const role = guild.roles.cache.get(config.role);
          if (!role) return;

          const [dd, mm] = row.date.split("/");

          if (parseInt(dd) === d && parseInt(mm) === m) {
            await member.roles.add(role);
          } else {
            await member.roles.remove(role).catch(() => {});
          }
        });

      } catch {}
    }
  });
}

client.login(process.env.DISCORD_TOKEN);
