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

// 🚀 INIT BOT
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// 💾 DB PERSISTANTE (Hostinger)
const db = new sqlite3.Database("/home/u585460519/anniv.db");

// 📦 TABLE
db.run(`
CREATE TABLE IF NOT EXISTS anniversaires (
  week TEXT,
  user TEXT,
  guild TEXT
)
`);

// 🧠 SEMAINE ACTUELLE
function getWeek() {
  const now = new Date();
  const year = now.getFullYear();
  const start = new Date(year, 0, 1);
  const week = Math.ceil(((now - start) / 86400000) / 7);
  return `${year}-W${week}`;
}

// ✅ BOT READY
client.once("ready", () => {
  console.log("🔥 BOT CONNECTÉ (INSTANCE UNIQUE)");
});

// 📺 COMMANDES
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // 🎉 PANEL
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

  // 📋 LISTE
  if (message.content === "!anniv_list") {
    const week = getWeek();
    const guildId = message.guild.id;

    db.all(
      "SELECT user FROM anniversaires WHERE week=? AND guild=?",
      [week, guildId],
      (err, rows) => {
        if (!rows || rows.length === 0) {
          return message.channel.send(
            "📭 Aucun participant cette semaine"
          );
        }

        const list = rows.map(r => `<@${r.user}>`).join("\n");

        message.channel.send(
          `🎂 **ANNIVERSAIRES DE LA SEMAINE 📺**\n\n${list}\n\n💜 Kapor_TV`
        );
      }
    );
  }

  // 🧹 RESET (ADMIN)
  if (message.content === "!anniv_reset") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply("❌ Tu n'as pas la permission !");
    }

    const week = getWeek();
    const guildId = message.guild.id;

    db.run(
      "DELETE FROM anniversaires WHERE week=? AND guild=?",
      [week, guildId],
      function (err) {
        if (err) {
          return message.channel.send("❌ Erreur lors du reset");
        }

        message.channel.send(
          "🧹 Liste des anniversaires réinitialisée pour cette semaine !"
        );
      }
    );
  }
});

// 🎯 BOUTON INSCRIPTION
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId === "join_anniv") {
    const week = getWeek();
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;

    db.get(
      "SELECT * FROM anniversaires WHERE week=? AND user=? AND guild=?",
      [week, userId, guildId],
      (err, row) => {
        if (row) {
          return interaction.reply({
            content: "⚠️ Déjà inscrit cette semaine !",
            ephemeral: true
          });
        }

        db.run(
          "INSERT INTO anniversaires (week, user, guild) VALUES (?, ?, ?)",
          [week, userId, guildId]
        );

        interaction.reply({
          content: "🎉 Inscrit au Club Anniv de la semaine !",
          ephemeral: true
        });
      }
    );
  }
});

// 🔐 LOGIN
client.login(process.env.DISCORD_TOKEN);