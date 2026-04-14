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
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// DB (persistant)
const db = new sqlite3.Database("/home/u585460519/data/anniv.db");

// TABLES
db.run(`
CREATE TABLE IF NOT EXISTS anniversaires (
  guild TEXT,
  week TEXT,
  user TEXT
)
`);

db.run(`
CREATE TABLE IF NOT EXISTS settings (
  guild TEXT PRIMARY KEY,
  titre TEXT,
  message TEXT
)
`);

// 📅 semaine
function getWeek() {
  const now = new Date();
  const year = now.getFullYear();
  const start = new Date(year, 0, 1);
  const week = Math.ceil(((now - start) / 86400000) / 7);
  return `${year}-W${week}`;
}

// =======================
// COMMANDES
// =======================

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const guildId = message.guild.id;

  // PANEL
  if (message.content === "!db_panel") {
    const button = new ButtonBuilder()
      .setCustomId("join_anniv")
      .setLabel("🎉 Je participe")
      .setStyle(ButtonStyle.Success);

    const row = new ActionRowBuilder().addComponents(button);

    message.channel.send({
      content: "🎂 **CLUB ANNIV 📺**\nClique pour participer 💜",
      components: [row]
    });
  }

  // LISTE
  if (message.content === "!db_list") {
    const week = getWeek();

    db.all(
      "SELECT user FROM anniversaires WHERE week=? AND guild=?",
      [week, guildId],
      (err, rows) => {
        if (!rows || rows.length === 0) {
          return message.channel.send("📭 Aucun participant cette semaine");
        }

        const list = rows.map(r => `<@${r.user}>`).join("\n");

        db.get(
          "SELECT * FROM settings WHERE guild=?",
          [guildId],
          (err, config) => {
            const titre = config?.titre || "🎂 ANNIVERSAIRES DE LA SEMAINE 📺";
            const msg = config?.message || "💜 Kapor_TV";

            message.channel.send(
              `${titre}\n\n${list}\n\n${msg}`
            );
          }
        );
      }
    );
  }

  // RESET
  if (message.content === "!db_reset") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply("❌ Admin uniquement");
    }

    const week = getWeek();

    db.run(
      "DELETE FROM anniversaires WHERE week=? AND guild=?",
      [week, guildId]
    );

    message.channel.send("🗑️ Liste reset !");
  }

  // TITRE
  if (message.content.startsWith("!db_titre ")) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply("❌ Admin uniquement");
    }

    const titre = message.content.replace("!db_titre ", "");

    db.run(
      "INSERT INTO settings (guild, titre) VALUES (?, ?) ON CONFLICT(guild) DO UPDATE SET titre=?",
      [guildId, titre, titre]
    );

    message.channel.send("✅ Titre modifié !");
  }

  // MESSAGE
  if (message.content.startsWith("!db_message ")) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply("❌ Admin uniquement");
    }

    const msg = message.content.replace("!db_message ", "");

    db.run(
      "INSERT INTO settings (guild, message) VALUES (?, ?) ON CONFLICT(guild) DO UPDATE SET message=?",
      [guildId, msg, msg]
    );

    message.channel.send("✅ Message modifié !");
  }

  // INFO
  if (message.content === "!db_info") {
    message.channel.send(`
🤖 **Dorothée Bot**

📺 Commandes :
!db_panel → bouton inscription
!db_list → voir liste
!db_reset → reset (admin)
!db_titre → changer titre
!db_message → changer message

💜 Support :
https://discord.gg/Dyr6D3xnP9
    `);
  }
});

// =======================
// BOUTON
// =======================

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;

  const guildId = interaction.guild.id;
  const userId = interaction.user.id;
  const week = getWeek();

  if (interaction.customId === "join_anniv") {
    db.get(
      "SELECT * FROM anniversaires WHERE week=? AND user=? AND guild=?",
      [week, userId, guildId],
      (err, row) => {
        if (row) {
          return interaction.reply({
            content: "⚠️ Déjà inscrit !",
            ephemeral: true
          });
        }

        db.run(
          "INSERT INTO anniversaires (week, user, guild) VALUES (?, ?, ?)",
          [week, userId, guildId]
        );

        interaction.reply({
          content: "🎉 Inscrit !",
          ephemeral: true
        });
      }
    );
  }
});

// READY
client.once("ready", () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);
});

// LOGIN
client.login(process.env.DISCORD_TOKEN);
