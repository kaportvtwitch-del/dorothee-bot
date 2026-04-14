const fs = require('fs');
const {
  Client,
  GatewayIntentBits,
  Collection
} = require('discord.js');

const db = require('./database/db');

/* ================= SAFE IMPORT ================= */

let handleButtons;
let temp = {};

try {
  const handler = require('./services/buttonHandler');
  handleButtons = handler.handleButtons;
  temp = handler.temp || {};
} catch (err) {
  console.error("❌ ERREUR buttonHandler:", err);
}

/* ================= TOKEN ================= */

const TOKEN = process.env.TOKEN;

if (!TOKEN) {
  console.error("❌ TOKEN MANQUANT");
  process.exit(1);
}

/* ================= CLIENT ================= */

console.log("🔥 INDEX LANCÉ");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

client.commands = new Collection();

/* ================= LOAD COMMANDS ================= */

const commandFiles = fs.readdirSync('./commands');

for (const file of commandFiles) {
  if (!file.endsWith('.js')) continue;

  const cmd = require(`./commands/${file}`);

  if (!cmd.data || !cmd.data.name) continue;

  client.commands.set(cmd.data.name, cmd);
  console.log(`✅ Commande chargée: ${cmd.data.name}`);
}

/* ================= READY ================= */

client.once('ready', () => {
  console.log(`🚀 BOT CONNECTÉ : ${client.user.tag}`);
});

/* ================= INTERACTIONS ================= */

client.on('interactionCreate', async (interaction) => {

  try {

    if (!interaction.guild) return;

    db.initGuild(interaction.guild.id);

    /* ===== COMMAND ===== */

    if (interaction.isChatInputCommand()) {
      const cmd = client.commands.get(interaction.commandName);
      if (cmd) return await cmd.execute(interaction);
    }

    /* ===== BUTTON ===== */

    if (interaction.isButton()) {
      if (handleButtons) return await handleButtons(interaction);
    }

    /* ===== SELECT ===== */

    if (interaction.isStringSelectMenu()) {

      const userId = interaction.user.id;
      const data = temp[userId];

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
