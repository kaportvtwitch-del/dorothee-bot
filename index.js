process.on("uncaughtException", console.error);
process.on("unhandledRejection", console.error);

const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events,
  PermissionsBitField
} = require("discord.js");

const sqlite3 = require("sqlite3").verbose();

// BOT
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// DB
const db = new sqlite3.Database("/home/uXXXXX/data/anniv.db");

// TABLE
db.run(`
CREATE TABLE IF NOT EXISTS anniversaires (
  guild TEXT,
  user TEXT,
  date TEXT
)
`);

// READY
client.once("ready", () => {
  console.log(`✅ Connecté : ${client.user.tag}`);
});

// INTERACTIONS
client.on(Events.InteractionCreate, async (interaction) => {

  if (!interaction.isChatInputCommand()) return;

  const guildId = interaction.guild.id;

  // LISTE
  if (interaction.commandName === "db_list") {
    db.all(
      "SELECT user, date FROM anniversaires WHERE guild=?",
      [guildId],
      (err, rows) => {

        if (!rows.length) {
          return interaction.reply({
            content: "📭 Aucun anniversaire",
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

  // SET DATE
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

  // RESET
  if (interaction.commandName === "db_reset") {

    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({
        content: "❌ Admin uniquement",
        ephemeral: true
      });
    }

    db.run("DELETE FROM anniversaires WHERE guild=?", [guildId]);

    interaction.reply({
      content: "🧹 Liste reset",
      ephemeral: true
    });
  }

  // MENU
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
});

// BOUTONS
client.on(Events.InteractionCreate, async (interaction) => {

  if (!interaction.isButton()) return;

  const guildId = interaction.guild.id;

  if (interaction.customId === "menu_list") {

    db.all(
      "SELECT user, date FROM anniversaires WHERE guild=?",
      [guildId],
      (err, rows) => {

        const list = rows.map(r => `<@${r.user}> → ${r.date}`).join("\n") || "📭 Vide";

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
});

// LOGIN
client.login(process.env.DISCORD_TOKEN);
