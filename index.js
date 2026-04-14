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
  intents: [GatewayIntentBits.Guilds]
});

// DB
const db = new sqlite3.Database("/home/u585460519/data/anniv.db");

// TABLES
db.run(`
CREATE TABLE IF NOT EXISTS anniversaires (
  guild TEXT,
  user TEXT,
  date TEXT
)
`);

db.run(`
CREATE TABLE IF NOT EXISTS settings (
  guild TEXT PRIMARY KEY,
  titre TEXT,
  message TEXT
)
`);

// =======================
// COMMANDES
// =======================

const commands = [
  new SlashCommandBuilder().setName("db_menu").setDescription("🎂 Menu"),
  new SlashCommandBuilder().setName("db_list").setDescription("📺 Liste"),
  new SlashCommandBuilder().setName("db_reset").setDescription("🧹 Reset")
];

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

// READY + DEPLOY
client.once("ready", async () => {
  console.log(`✅ Connecté : ${client.user.tag}`);

  try {
    console.log("🔄 Déploiement...");
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log("✅ Commandes OK");
  } catch (err) {
    console.error(err);
  }
});

// =======================
// INTERACTIONS
// =======================

client.on(Events.InteractionCreate, async (interaction) => {

  const guildId = interaction.guild?.id;

  // =======================
  // COMMANDES
  // =======================

  if (interaction.isChatInputCommand()) {

    // MENU
    if (interaction.commandName === "db_menu") {

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("menu_list").setLabel("📺 Liste").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("menu_date").setLabel("🎂 Ma date").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("menu_title").setLabel("✏️ Titre").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("menu_msg").setLabel("📝 Message").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("menu_close").setLabel("❌").setStyle(ButtonStyle.Danger)
      );

      interaction.reply({
        content: "🎂 **MENU DOROTHÉE 📺**",
        components: [row],
        ephemeral: true
      });
    }

    // LISTE
    if (interaction.commandName === "db_list") {

      db.all("SELECT user, date FROM anniversaires WHERE guild=?", [guildId], (err, rows) => {

        if (!rows?.length) {
          return interaction.reply({ content: "📭 Vide", ephemeral: true });
        }

        db.get("SELECT * FROM settings WHERE guild=?", [guildId], (err, config) => {

          const titre = config?.titre || "🎂 ANNIVERSAIRES 📺";
          const msg = config?.message || "💜 Kapor_TV";

          const list = rows.map(r => `<@${r.user}> → ${r.date}`).join("\n");

          interaction.reply({
            content: `${titre}\n\n${list}\n\n${msg}`,
            ephemeral: true
          });
        });
      });
    }

    // RESET
    if (interaction.commandName === "db_reset") {

      if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return interaction.reply({ content: "❌ Admin only", ephemeral: true });
      }

      db.run("DELETE FROM anniversaires WHERE guild=?", [guildId]);

      interaction.reply({ content: "🧹 Reset OK", ephemeral: true });
    }
  }

  // =======================
  // BOUTONS
  // =======================

  if (interaction.isButton()) {

    // LISTE
    if (interaction.customId === "menu_list") {

      await interaction.deferReply({ ephemeral: true });

      db.all("SELECT user, date FROM anniversaires WHERE guild=?", [guildId], (err, rows) => {

        const list = rows?.map(r => `<@${r.user}> → ${r.date}`).join("\n") || "📭 Vide";

        interaction.editReply({ content: `📺 LISTE\n\n${list}` });
      });
    }

    // MODAL DATE
    if (interaction.customId === "menu_date") {

      const modal = new ModalBuilder()
        .setCustomId("modal_date")
        .setTitle("🎂 Ta date");

      const input = new TextInputBuilder()
        .setCustomId("date_input")
        .setLabel("JJ/MM")
        .setStyle(TextInputStyle.Short);

      modal.addComponents(new ActionRowBuilder().addComponents(input));

      return interaction.showModal(modal);
    }

    // MODAL TITRE (ADMIN)
    if (interaction.customId === "menu_title") {

      if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return interaction.reply({ content: "❌ Admin uniquement", ephemeral: true });
      }

      const modal = new ModalBuilder()
        .setCustomId("modal_title")
        .setTitle("Modifier le titre");

      const input = new TextInputBuilder()
        .setCustomId("title_input")
        .setLabel("Titre")
        .setStyle(TextInputStyle.Short);

      modal.addComponents(new ActionRowBuilder().addComponents(input));

      return interaction.showModal(modal);
    }

    // MODAL MESSAGE (ADMIN)
    if (interaction.customId === "menu_msg") {

      if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return interaction.reply({ content: "❌ Admin uniquement", ephemeral: true });
      }

      const modal = new ModalBuilder()
        .setCustomId("modal_msg")
        .setTitle("Modifier le message");

      const input = new TextInputBuilder()
        .setCustomId("msg_input")
        .setLabel("Message")
        .setStyle(TextInputStyle.Paragraph);

      modal.addComponents(new ActionRowBuilder().addComponents(input));

      return interaction.showModal(modal);
    }

    // CLOSE
    if (interaction.customId === "menu_close") {
      return interaction.update({ content: "❌ Fermé", components: [] });
    }
  }

  // =======================
  // MODALS
  // =======================

  if (interaction.isModalSubmit()) {

    // DATE
    if (interaction.customId === "modal_date") {

      const date = interaction.fields.getTextInputValue("date_input");

      db.run(
        "INSERT OR REPLACE INTO anniversaires (guild, user, date) VALUES (?, ?, ?)",
        [guildId, interaction.user.id, date]
      );

      return interaction.reply({
        content: `🎉 Date enregistrée : ${date}`,
        ephemeral: true
      });
    }

    // TITRE
    if (interaction.customId === "modal_title") {

      const titre = interaction.fields.getTextInputValue("title_input");

      db.run(
        "INSERT INTO settings (guild, titre) VALUES (?, ?) ON CONFLICT(guild) DO UPDATE SET titre=?",
        [guildId, titre, titre]
      );

      return interaction.reply({
        content: "✅ Titre mis à jour",
        ephemeral: true
      });
    }

    // MESSAGE
    if (interaction.customId === "modal_msg") {

      const msg = interaction.fields.getTextInputValue("msg_input");

      db.run(
        "INSERT INTO settings (guild, message) VALUES (?, ?) ON CONFLICT(guild) DO UPDATE SET message=?",
        [guildId, msg, msg]
      );

      return interaction.reply({
        content: "✅ Message mis à jour",
        ephemeral: true
      });
    }
  }
});

// LOGIN
client.login(process.env.DISCORD_TOKEN);
