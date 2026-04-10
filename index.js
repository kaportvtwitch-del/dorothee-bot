const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events
} = require("discord.js");

const sqlite3 = require("sqlite3").verbose();

// BOT INIT
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// DB
const db = new sqlite3.Database("./anniv.db");

db.run(`
CREATE TABLE IF NOT EXISTS anniversaires (
  week TEXT,
  user TEXT
)
`);

// 🧠 semaine actuelle
function getWeek() {
  const now = new Date();
  const year = now.getFullYear();
  const start = new Date(year, 0, 1);
  const week = Math.ceil(((now - start) / 86400000) / 7);
  return `${year}-W${week}`;
}

// 📺 COMMANDES TEXT
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // PANEL BOUTON
  if (message.content === "!anniv_panel") {
    const button = new ButtonBuilder()
      .setCustomId("join_anniv")
      .setLabel("🎉 Je participe")
      .setStyle(ButtonStyle.Success);

    const row = new ActionRowBuilder().addComponents(button);

    message.channel.send({
      content:
        "🎂 **CLUB ANNIV DE LA SEMAINE 📺**\nClique pour rejoindre les anniversaires 💜🍆",
      components: [row]
    });
  }

  // LISTE
  if (message.content === "!anniv_list") {
    const week = getWeek();

    db.all(
      "SELECT user FROM anniversaires WHERE week=?",
      [week],
      (err, rows) => {
        if (!rows.length)
          return message.channel.send("📭 Aucun participant cette semaine");

        const list = rows.map(r => `<@${r.user}>`).join("\n");

        message.channel.send(
          `🎂 **ANNIVERSAIRES DE LA SEMAINE 📺**\n\n${list}\n\n💜 Kapor_TV`
        );
      }
    );
  }
});

// 🎯 INTERACTIONS BOUTON
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId === "join_anniv") {
    const week = getWeek();
    const userId = interaction.user.id;

    db.get(
      "SELECT * FROM anniversaires WHERE week=? AND user=?",
      [week, userId],
      (err, row) => {
        if (row) {
          return interaction.reply({
            content: "⚠️ Déjà inscrit cette semaine !",
            ephemeral: true
          });
        }

        db.run(
          "INSERT INTO anniversaires (week, user) VALUES (?, ?)",
          [week, userId]
        );

        interaction.reply({
          content: "🎉 Inscrit au Club Anniv de la semaine !",
          ephemeral: true
        });
      }
    );
  }
});

// 🚀 LOGIN
client.login(process.env.DISCORD_TOKEN);