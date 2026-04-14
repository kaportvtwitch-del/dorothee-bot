const fs = require('fs');
const { Client, GatewayIntentBits, Collection } = require('discord.js');

const db = require('./database/db');

const TOKEN = process.env.TOKEN;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

client.commands = new Collection();

/* ================= LOAD COMMANDS ================= */

for (const file of fs.readdirSync('./commands')) {
  if (!file.endsWith('.js')) continue;

  const cmd = require(`./commands/${file}`);
  client.commands.set(cmd.data.name, cmd);
}

/* ================= READY ================= */

client.once('ready', () => {
  console.log(`✅ Connecté : ${client.user.tag}`);

  const { startBirthdayJob } = require('./services/birthdayService');
  startBirthdayJob(client);
});

/* ================= INTERACTIONS ================= */

client.on('interactionCreate', async (interaction) => {

  if (!interaction.guild) return;

  // init guild auto
  db.initGuild(interaction.guild.id);

  if (interaction.isChatInputCommand()) {
    const cmd = client.commands.get(interaction.commandName);
    if (cmd) return cmd.execute(interaction);
  }

  if (interaction.isButton()) {
    const { handleButtons } = require('./services/buttonHandler');
    return handleButtons(interaction);
  }
});

client.login(TOKEN);
