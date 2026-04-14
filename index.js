const fs = require('fs');
const { Client, GatewayIntentBits, Collection } = require('discord.js');

const db = require('./database/db');

const TOKEN = process.env.TOKEN;

/* ===================== CLIENT ===================== */

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

client.commands = new Collection();

/* ===================== LOAD COMMANDS ===================== */

try {
  const commandFiles = fs.readdirSync('./commands');

  for (const file of commandFiles) {
    if (!file.endsWith('.js')) continue;

    const cmd = require(`./commands/${file}`);
    client.commands.set(cmd.data.name, cmd);
  }

  console.log(`📦 ${client.commands.size} commandes chargées`);
} catch (err) {
  console.error("❌ ERREUR LOAD COMMANDS:", err);
}

/* ===================== READY ===================== */

client.once('ready', () => {
  console.log(`🚀 BOT CONNECTÉ : ${client.user.tag}`);

  // Lancement système anniversaire
  try {
    const { startBirthdayJob } = require('./services/birthdayService');
    startBirthdayJob(client);
    console.log("🎂 Birthday system ON");
  } catch (err) {
    console.error("❌ Birthday system error:", err);
  }
});

/* ===================== INTERACTIONS ===================== */

client.on('interactionCreate', async (interaction) => {

  try {

    if (!interaction.guild) return;

    // init guild auto (multi-serveur safe)
    db.initGuild(interaction.guild.id);

    /* ================= SLASH COMMANDS ================= */

    if (interaction.isChatInputCommand()) {

      const cmd = client.commands.get(interaction.commandName);

      if (!cmd) {
        return interaction.reply({
          content: "❌ Commande introuvable",
          ephemeral: true
        });
      }

      return await cmd.execute(interaction);
    }

    /* ================= BUTTONS ================= */

    if (interaction.isButton()) {

      const { handleButtons } = require('./services/buttonHandler');
      return await handleButtons(interaction);
    }

  } catch (err) {
    console.error("💥 INTERACTION ERROR:", err);

    if (interaction.replied || interaction.deferred) return;

    return interaction.reply({
      content: "❌ Une erreur est survenue.",
      ephemeral: true
    }).catch(() => {});
  }
});

/* ===================== LOGIN ===================== */

client.login(TOKEN)
  .then(() => {
    console.log("🔐 Login Discord OK");
  })
  .catch(err => {
    console.error("❌ LOGIN FAILED:", err);
  });

/* ===================== GLOBAL SAFETY ===================== */

// sécurité crash non catché
process.on('unhandledRejection', (err) => {
  console.error("⚠️ UNHANDLED REJECTION:", err);
});

process.on('uncaughtException', (err) => {
  console.error("⚠️ UNCAUGHT EXCEPTION:", err);
});
