require('dotenv').config();
const fs = require('fs');
const { Client, GatewayIntentBits, Collection } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

client.commands = new Collection();

// LOAD COMMANDS
for (const file of fs.readdirSync('./commands')) {
  if (!file.endsWith('.js')) continue;
  const cmd = require(`./commands/${file}`);
  client.commands.set(cmd.data.name, cmd);
}

// READY
client.once('ready', () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);

  const { startBirthdayJob } = require('./services/birthdayService');
  startBirthdayJob(client);
});

// INTERACTIONS
client.on('interactionCreate', async (interaction) => {

  if (interaction.isChatInputCommand()) {
    const cmd = client.commands.get(interaction.commandName);
    if (cmd) return cmd.execute(interaction);
  }

  if (interaction.isButton()) {
    const { handleButtons } = require('./services/buttonHandler');
    return handleButtons(interaction);
  }
});

client.login(process.env.TOKEN);