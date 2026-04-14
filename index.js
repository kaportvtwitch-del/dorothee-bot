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
  SlashCommandBuilder
} = require("discord.js");

const sqlite3 = require("sqlite3").verbose();

// BOT
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// DB (IMPORTANT : adapte ton user ici)
const db = new sqlite3.Database("/home/u585460519/data/anniv.db");

// TABLE
db.run(`
CREATE TABLE IF NOT EXISTS anniversaires (
  guild TEXT,
  user TEXT,
  date TEXT
)
`);

// =======================
// SLASH COMMANDS AUTO DEPLOY
// =======================

const commands = [
  new SlashCommandBuilder()
    .setName("db_menu")
    .setDescription("🎂 Ouvrir le menu"),

  new SlashCommandBuilder()
    .setName("db_list")
    .setDescription("📺 Voir la liste"),

  new SlashCommandBuilder()
    .setName("db_setdate")
    .setDescription("🎂 Définir ta date")
    .addStringOption(option =>
      option.setName("date")
        .setDescription("Format JJ/MM")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("db_reset")
    .setDescription("🧹 Reset (admin)")
];

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

// =======================
// READY
// =======================

client.once("ready", async () => {
  console.log(`✅ Connecté : ${client.user.tag}`);

  try {
    console.log("🔄 Déploiement des commandes...");
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log("✅ Commandes déployées !");
  } catch (error) {
    console.error(error);
  }
});

// =======================
// COMMANDES
// =======================

client.on(Events.InteractionCreate, async (interaction) => {

  if (interaction.isChatInputCommand()) {

    const guildId = interaction.guild.id;

    // 📺 LISTE
    if (interaction.commandName === "db_list") {
      db.all(
        "SELECT user, date FROM anniversaires WHERE guild=?",
        [guildId],
        (err, rows) => {

          if (!rows || rows.length === 0) {
            return interaction.reply({
              content: "📭 Aucun anniversaire enregistré",
              ephemeral: true
            });
          }

          const list = rows.map(r => `<@${r.user}> → ${r.date}`).join("\n");

          interaction.reply({
            content: `🎂 ANNIVERSAIRES 📺\n\n${list}`,
            ephemeral: true
          });
        }
      );
    }

    // 🎂 SET DATE
    if (interaction.commandName === "db_setdate") {
      const date = interaction.options.getString("date");
      const userId = interaction.user.id;

      db.run(
        "INSERT OR REPLACE INTO anniversaires (guild, user, date) VALUES (?, ?, ?)",
        [guildId, userId, date]
      );

      interaction.reply({
        content: `🎉 Date enregistrée : ${date}`,
        ephemeral: true
      });
    }

    // 🧹 RESET
    if (interaction.commandName === "db_reset") {

      if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return interaction.reply({
          content: "❌ Admin uniquement",
          ephemeral: true
        });
      }

      db.run("DELETE FROM anniversaires WHERE guild=?", [guildId]);

      interaction.reply({
        content: "🧹 Liste réinitialisée",
        ephemeral: true
      });
    }

    // 🎮 MENU
    if (interaction.commandName === "db_menu") {

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("menu_list")
          .setLabel("📺 Liste")
          .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
          .setCustomId("menu_setdate")
          .setLabel("🎂 Ma date")
          .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
          .setCustomId("menu_close")
          .setLabel("❌ Fermer")
          .setStyle(ButtonStyle.Danger)
      );

      interaction.reply({
        content: "🎂 **MENU DOROTHÉE 📺**",
        components: [row],
        ephemeral: true
      });
    }
  }

  // =======================
  // BOUTONS
  // =======================

  if (interaction.isButton()) {

    const guildId = interaction.guild.id;

    if (interaction.customId === "menu_list") {

      db.all(
        "SELECT user, date FROM anniversaires WHERE guild=?",
        [guildId],
        (err, rows) => {

          const list =
            rows?.map(r => `<@${r.user}> → ${r.date}`).join("\n") || "📭 Vide";

          interaction.update({
            content: `📺 LISTE\n\n${list}`,
            components: []
          });
        }
      );
    }

    if (interaction.customId === "menu_setdate") {
      interaction.update({
        content: "👉 Utilise /db_setdate",
        components: []
      });
    }

    if (interaction.customId === "menu_close") {
      interaction.update({
        content: "❌ Menu fermé",
        components: []
      });
    }
  }
});

// LOGIN
client.login(process.env.DISCORD_TOKEN);
