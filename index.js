console.log("🔥 INDEX LANCÉ (ENTRY POINT)");

const fs = require('fs');
const { Client, GatewayIntentBits, Collection } = require('discord.js');

/* ================= SAFE REQUIRE ================= */

let db = null;
let handleButtons = null;
let temp = {};

try {
  db = require('./database/db');
} catch (e) {
  console.error("❌ DB ERROR:", e);
}

try {
  const handler = require('./services/buttonHandler');
  handleButtons = handler.handleButtons;
  temp = handler.temp || {};
} catch (e) {
  console.error("❌ BUTTON HANDLER ERROR:", e);
}

/* ================= TOKEN ================= */

const TOKEN = process.env.TOKEN;

if (!TOKEN) {
  console.error("❌ TOKEN MANQUANT");
  process.exit(1);
}

/* ================= CLIENT ================= */

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

client.commands = new Collection();

/* ================= SAFE LOAD COMMANDS ================= */

try {
  const commandFiles = fs.readdirSync('./commands');

  for (const file of commandFiles) {
    if (!file.endsWith('.js')) continue;

    try {
      const cmd = require(`./commands/${file}`);

      if (!cmd.data || !cmd.data.name) {
        console.warn(`⚠️ Commande ignorée: ${file}`);
        continue;
      }

      client.commands.set(cmd.data.name, cmd);
      console.log(`✅ Commande chargée: ${cmd.data.name}`);

    } catch (err) {
      console.error(`❌ ERREUR CMD ${file}:`, err);
    }
  }

} catch (err) {
  console.error("❌ COMMAND FOLDER ERROR:", err);
}

/* ================= READY ================= */

client.once('ready', () => {
  console.log(`🚀 BOT CONNECTÉ : ${client.user.tag}`);
  console.log("🎂 Birthday system ON");
});

/* ================= INTERACTIONS ================= */

client.on('interactionCreate', async (interaction) => {
  try {

    if (!interaction.guild) return;

    if (db?.initGuild) {
      db.initGuild(interaction.guild.id);
    }

    if (interaction.isChatInputCommand()) {
      const cmd = client.commands.get(interaction.commandName);
      if (cmd) return await cmd.execute(interaction);
    }

    if (interaction.isButton()) {
      if (handleButtons) return await handleButtons(interaction);
    }

    if (interaction.isStringSelectMenu()) {

      const data = temp[interaction.user.id];
      if (!data) return interaction.deferUpdate();

      if (interaction.customId === 'day') data.day = interaction.values[0];
      if (interaction.customId === 'month') data.month = interaction.values[0];
      if (interaction.customId === 'year') data.year = interaction.values[0];

      return interaction.deferUpdate();
    }

  } catch (err) {
    console.error("💥 INTERACTION ERROR:", err);
  }
});

/* ================= LOGIN ================= */

client.login(TOKEN)
  .then(() => console.log("🔐 Login Discord OK"))
  .catch(err => console.error("❌ LOGIN ERROR:", err));
