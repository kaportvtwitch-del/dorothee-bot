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

const Database = require("better-sqlite3");

// INIT BOT
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// DB (persistante)
const db = new Database("./anniv.db");

// TABLES
db.prepare(`
CREATE TABLE IF NOT EXISTS anniversaires (
  guild TEXT,
  week TEXT,
  user TEXT,
  bonus INTEGER DEFAULT 0
)
`).run();

db.prepare(`
CREATE TABLE IF NOT EXISTS settings (
  guild TEXT PRIMARY KEY,
  titre TEXT,
  message TEXT,
  role TEXT
)
`).run();

// SEMAINE
function getWeek() {
  const now = new Date();
  const year = now.getFullYear();
  const start = new Date(year, 0, 1);
  const week = Math.ceil(((now - start) / 86400000) / 7);
  return `${year}-W${week}`;
}

// EVENT READY
client.once("ready", () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);
});

// COMMANDES
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  const guildId = message.guild.id;

  // PANEL
  if (message.content === "!db_panel") {
    const button = new ButtonBuilder()
      .setCustomId("join_anniv")
      .setLabel("🎉 Je participe")
      .setStyle(ButtonStyle.Success);

    const row = new ActionRowBuilder().addComponents(button);

    message.channel.send({
      content:
        "🎂 **CLUB ANNIV DE LA SEMAINE 📺**\nClique pour rejoindre 💜",
      components: [row]
    });
  }

  // LISTE
  if (message.content === "!db_list") {
    const week = getWeek();

    const rows = db
      .prepare("SELECT * FROM anniversaires WHERE guild=? AND week=? ORDER BY bonus DESC")
      .all(guildId, week);

    if (!rows.length) {
      return message.channel.send("📭 Aucun participant cette semaine");
    }

    const settings = db
      .prepare("SELECT * FROM settings WHERE guild=?")
      .get(guildId);

    const titre =
      settings?.titre || "🎂 ANNIVERSAIRES DE LA SEMAINE 📺";

    const bas =
      settings?.message || "💜 Kapor_TV";

    const list = rows
      .map(r => `<@${r.user}>`)
      .join("\n");

    message.channel.send(`${titre}\n\n${list}\n\n${bas}`);
  }

  // RESET
  if (message.content === "!db_reset") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply("❌ Admin uniquement");
    }

    const week = getWeek();

    db.prepare("DELETE FROM anniversaires WHERE guild=? AND week=?")
      .run(guildId, week);

    message.channel.send("🧹 Liste reset !");
  }

  // TITRE
  if (message.content.startsWith("!db_titre ")) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply("❌ Admin uniquement");
    }

    const titre = message.content.replace("!db_titre ", "");

    db.prepare(`
      INSERT INTO settings (guild, titre)
      VALUES (?, ?)
      ON CONFLICT(guild) DO UPDATE SET titre=excluded.titre
    `).run(guildId, titre);

    message.channel.send("✅ Titre mis à jour !");
  }

  // MESSAGE BAS
  if (message.content.startsWith("!db_message ")) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply("❌ Admin uniquement");
    }

    const msg = message.content.replace("!db_message ", "");

    db.prepare(`
      INSERT INTO settings (guild, message)
      VALUES (?, ?)
      ON CONFLICT(guild) DO UPDATE SET message=excluded.message
    `).run(guildId, msg);

    message.channel.send("✅ Message mis à jour !");
  }

  // INFO
  if (message.content === "!db_info") {
    message.channel.send(`
📺 **Dorothée Bot**

🎉 Gestion des anniversaires de la semaine

Commandes :
!db_panel → afficher bouton
!db_list → voir la liste
!db_reset → reset (admin)
!db_titre → changer titre
!db_message → changer message

💜 https://discord.gg/Dyr6D3xnP9
    `);
  }
});

// BOUTON
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;

  const guildId = interaction.guild.id;
  const userId = interaction.user.id;
  const week = getWeek();

  if (interaction.customId === "join_anniv") {
    const exists = db
      .prepare("SELECT * FROM anniversaires WHERE guild=? AND week=? AND user=?")
      .get(guildId, week, userId);

    if (exists) {
      return interaction.reply({
        content: "⚠️ Déjà inscrit !",
        ephemeral: true
      });
    }

    db.prepare(`
      INSERT INTO anniversaires (guild, week, user, bonus)
      VALUES (?, ?, ?, 1)
    `).run(guildId, week, userId);

    interaction.reply({
      content: "🎉 Inscrit avec bonus !",
      ephemeral: true
    });
  }
});

// LOGIN
client.login(process.env.DISCORD_TOKEN);
