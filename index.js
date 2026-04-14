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
  TextInputStyle
} = require("discord.js");

const sqlite3 = require("sqlite3").verbose();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

// DB
const db = new sqlite3.Database("/home/u585460519/data/anniv.db");

// TABLES
db.run(`CREATE TABLE IF NOT EXISTS anniversaires (guild TEXT, user TEXT, date TEXT)`);
db.run(`CREATE TABLE IF NOT EXISTS settings (guild TEXT PRIMARY KEY, titre TEXT, message TEXT, role TEXT)`);

// COMMANDES
const commands = [
  new SlashCommandBuilder().setName("db_menu").setDescription("🎂 Menu"),
  new SlashCommandBuilder().setName("db_panel").setDescription("📨 Envoyer panel"),
  new SlashCommandBuilder().setName("db_reset").setDescription("🧹 Reset"),
  new SlashCommandBuilder().setName("db_role")
    .setDescription("🎭 Définir rôle")
    .addRoleOption(option =>
      option.setName("role")
        .setDescription("Rôle anniversaire")
        .setRequired(true)
    )
];

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

// READY
client.once("ready", async () => {
  console.log(`✅ Connecté : ${client.user.tag}`);

  try {
    console.log("🔄 Deploy commandes...");
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log("✅ Commandes OK");
  } catch (err) {
    console.error(err);
  }

  setInterval(checkBirthdays, 60000);
});

// =======================
// INTERACTIONS
// =======================

client.on(Events.InteractionCreate, async (interaction) => {

  const guildId = interaction.guild?.id;

  try {

    // =======================
    // COMMANDES
    // =======================

    if (interaction.isChatInputCommand()) {

      // MENU
      if (interaction.commandName === "db_menu") {

        await interaction.deferReply({ ephemeral: true });

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("date").setLabel("🎂 Ma date").setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId("admin").setLabel("⚙️ Gestion").setStyle(ButtonStyle.Secondary)
        );

        return interaction.editReply({
          content: "🎂 **Club Dorothée - Anniversaires 📺**",
          components: [row]
        });
      }

      // PANEL
      if (interaction.commandName === "db_panel") {

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
          return interaction.reply({ content: "❌ Admin uniquement", ephemeral: true });
        }

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("date").setLabel("🎂 Je participe").setStyle(ButtonStyle.Success)
        );

        return interaction.reply({
          content: "✅ Panel envoyé",
          ephemeral: true
        }).then(() => {
          interaction.channel.send({
            content: "🎉 Clique pour t'inscrire !",
            components: [row]
          });
        });
      }

      // RESET
      if (interaction.commandName === "db_reset") {

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
          return interaction.reply({ content: "❌ Admin uniquement", ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        db.run("DELETE FROM anniversaires WHERE guild=?", [guildId], () => {
          interaction.editReply("🧹 Reset OK");
        });
      }

      // ROLE
      if (interaction.commandName === "db_role") {

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
          return interaction.reply({ content: "❌ Admin uniquement", ephemeral: true });
        }

        const role = interaction.options.getRole("role");

        db.run(
          "INSERT INTO settings (guild, role) VALUES (?, ?) ON CONFLICT(guild) DO UPDATE SET role=?",
          [guildId, role.id, role.id]
        );

        return interaction.reply({ content: "🎭 Rôle enregistré", ephemeral: true });
      }
    }

    // =======================
    // BOUTONS
    // =======================

    if (interaction.isButton()) {

      // DATE
      if (interaction.customId === "date") {

        const modal = new ModalBuilder()
          .setCustomId("date_modal")
          .setTitle("🎂 Date JJ/MM/AAAA");

        const input = new TextInputBuilder()
          .setCustomId("date_input")
          .setLabel("Ex: 15/08/1998")
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(input));

        return interaction.showModal(modal);
      }

      // ADMIN MENU
      if (interaction.customId === "admin") {

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
          return interaction.reply({ content: "❌ Admin uniquement", ephemeral: true });
        }

        return interaction.reply({
          content: "⚙️ Gestion",
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder().setCustomId("title").setLabel("✏️ Titre").setStyle(ButtonStyle.Secondary),
              new ButtonBuilder().setCustomId("msg").setLabel("📝 Message").setStyle(ButtonStyle.Secondary)
            )
          ],
          ephemeral: true
        });
      }

      // TITRE
      if (interaction.customId === "title") {

        const modal = new ModalBuilder().setCustomId("title_modal").setTitle("Titre");

        const input = new TextInputBuilder()
          .setCustomId("title_input")
          .setLabel("Titre")
          .setStyle(TextInputStyle.Short);

        modal.addComponents(new ActionRowBuilder().addComponents(input));

        return interaction.showModal(modal);
      }

      // MESSAGE
      if (interaction.customId === "msg") {

        const modal = new ModalBuilder().setCustomId("msg_modal").setTitle("Message");

        const input = new TextInputBuilder()
          .setCustomId("msg_input")
          .setLabel("Message")
          .setStyle(TextInputStyle.Paragraph);

        modal.addComponents(new ActionRowBuilder().addComponents(input));

        return interaction.showModal(modal);
      }
    }

    // =======================
    // MODALS
    // =======================

    if (interaction.isModalSubmit()) {

      const userId = interaction.user.id;

      // DATE
      if (interaction.customId === "date_modal") {

        const date = interaction.fields.getTextInputValue("date_input");

        db.run(
          "INSERT OR REPLACE INTO anniversaires (guild, user, date) VALUES (?, ?, ?)",
          [guildId, userId, date]
        );

        return interaction.reply({
          content: `🎉 Date enregistrée : ${date}`,
          ephemeral: true
        });
      }

      // TITRE
      if (interaction.customId === "title_modal") {

        const titre = interaction.fields.getTextInputValue("title_input");

        db.run(
          "INSERT INTO settings (guild, titre) VALUES (?, ?) ON CONFLICT(guild) DO UPDATE SET titre=?",
          [guildId, titre, titre]
        );

        return interaction.reply({ content: "✅ Titre modifié", ephemeral: true });
      }

      // MESSAGE
      if (interaction.customId === "msg_modal") {

        const msg = interaction.fields.getTextInputValue("msg_input");

        db.run(
          "INSERT INTO settings (guild, message) VALUES (?, ?) ON CONFLICT(guild) DO UPDATE SET message=?",
          [guildId, msg, msg]
        );

        return interaction.reply({ content: "✅ Message modifié", ephemeral: true });
      }
    }

  } catch (err) {
    console.error(err);

    if (!interaction.replied) {
      interaction.reply({
        content: "❌ Une erreur est survenue",
        ephemeral: true
      });
    }
  }
});

// =======================
// CHECK ANNIVERSAIRES
// =======================

async function checkBirthdays() {

  const today = new Date();
  const d = today.getDate();
  const m = today.getMonth() + 1;

  db.all("SELECT * FROM anniversaires", async (err, rows) => {

    for (const row of rows) {

      const [dd, mm, yy] = row.date.split("/");

      if (parseInt(dd) === d && parseInt(mm) === m) {

        try {
          const guild = await client.guilds.fetch(row.guild);
          const member = await guild.members.fetch(row.user);

          db.get("SELECT role FROM settings WHERE guild=?", [row.guild], async (err, config) => {

            if (!config?.role) return;

            const role = guild.roles.cache.get(config.role);
            if (!role) return;

            await member.roles.add(role);

            const age = new Date().getFullYear() - yy;

            if (age % 10 === 0) {
              member.send(`🎉 Tu passes une dizaine (${age}) !!!`);
            }

          });

        } catch (e) {}
      }
    }
  });
}

client.login(process.env.DISCORD_TOKEN);
