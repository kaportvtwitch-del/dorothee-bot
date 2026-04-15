console.log("🔥 INDEX LANCÉ");
console.log("🧠 PID:", process.pid);

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const {
  Client,
  GatewayIntentBits,
  Collection,
  InteractionType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
} = require('discord.js');

const db = require('./database/db');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const files = fs.readdirSync(commandsPath);

for (const file of files) {
  if (!file.endsWith('.js')) continue;

  const command = require(`./commands/${file}`);

  if (!command.data || !command.execute) {
    console.log(`⚠️ Commande ignorée: ${file}`);
    continue;
  }

  client.commands.set(command.data.name, command);
  console.log(`✅ Commande chargée: ${command.data.name}`);
}

client.once('ready', () => {
  console.log(`🚀 BOT CONNECTÉ : ${client.user.tag}`);
  console.log("🎂 Système anniversaire actif");
});

client.on('interactionCreate', async interaction => {
  try {
    // COMMANDES
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      await command.execute(interaction, db);
    }

    // MODAL (formulaire propre)
    if (interaction.type === InteractionType.ModalSubmit) {
      if (interaction.customId === "birthday_modal") {

        const day = interaction.fields.getTextInputValue('day');
        const month = interaction.fields.getTextInputValue('month');
        const year = interaction.fields.getTextInputValue('year');
        const showAge = interaction.fields.getTextInputValue('show_age') === "oui";

        db.saveUser(interaction.guildId, interaction.user.id, {
          day: parseInt(day),
          month: parseInt(month),
          year: parseInt(year),
          showAge
        });

        await interaction.reply({
          content: "✅ Anniversaire enregistré !",
          flags: 64
        });
      }
    }

  } catch (err) {
    console.error("💥 INTERACTION ERROR:", err);

    if (!interaction.replied) {
      await interaction.reply({
        content: "❌ Une erreur est survenue",
        flags: 64
      });
    }
  }
});

client.login(process.env.TOKEN);