require('dotenv').config();

console.log("🔥 INDEX LANCÉ");
console.log("🧠 PID:", process.pid);

const fs = require('fs');
const path = require('path');

const {
  Client,
  GatewayIntentBits,
  Collection,
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


// =======================
// 🔹 LOAD COMMANDS
// =======================
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  try {
    const command = require(`./commands/${file}`);

    if (!command.data || !command.execute) {
      console.log(`⚠️ Commande ignorée: ${file}`);
      continue;
    }

    client.commands.set(command.data.name, command);
    console.log(`✅ Commande chargée: ${command.data.name}`);

  } catch (err) {
    console.log(`❌ ERREUR LOAD CMD ${file}:`, err);
  }
}


// =======================
// 🔹 READY
// =======================
client.once('ready', () => {
  console.log(`🚀 BOT CONNECTÉ : ${client.user.tag}`);
  console.log("🎂 Système anniversaire actif");
});


// =======================
// 🔹 INTERACTIONS
// =======================
client.on('interactionCreate', async interaction => {

  try {

    // =======================
    // 🔸 COMMANDES
    // =======================
    if (interaction.isChatInputCommand()) {

      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      await command.execute(interaction);
    }


    // =======================
    // 🔸 BOUTONS
    // =======================
    if (interaction.isButton()) {

      // 🎂 OUVRIR FORMULAIRE
      if (interaction.customId === 'open_birthday_modal') {

        const modal = new ModalBuilder()
          .setCustomId('birthday_modal')
          .setTitle('🎂 Ton anniversaire');

        const dayInput = new TextInputBuilder()
          .setCustomId('day')
          .setLabel('Jour (1-31)')
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const monthInput = new TextInputBuilder()
          .setCustomId('month')
          .setLabel('Mois (1-12)')
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const yearInput = new TextInputBuilder()
          .setCustomId('year')
          .setLabel('Année (1950-2025)')
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const ageInput = new TextInputBuilder()
          .setCustomId('showAge')
          .setLabel('Afficher ton âge ? (oui/non)')
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        modal.addComponents(
          new ActionRowBuilder().addComponents(dayInput),
          new ActionRowBuilder().addComponents(monthInput),
          new ActionRowBuilder().addComponents(yearInput),
          new ActionRowBuilder().addComponents(ageInput)
        );

        return interaction.showModal(modal);
      }


      // 🗑️ SUPPRIMER DATE
      if (interaction.customId === 'delete_date') {

        db.deleteUser(interaction.guild.id, interaction.user.id);

        return interaction.reply({
          content: "🗑️ Date supprimée !",
          ephemeral: true
        });
      }
    }


    // =======================
    // 🔸 MODAL SUBMIT
    // =======================
    if (interaction.isModalSubmit()) {

      if (interaction.customId === 'birthday_modal') {

        const day = parseInt(interaction.fields.getTextInputValue('day'));
        const month = parseInt(interaction.fields.getTextInputValue('month'));
        const year = parseInt(interaction.fields.getTextInputValue('year'));
        const showAgeInput = interaction.fields.getTextInputValue('showAge');

        const showAge = showAgeInput.toLowerCase() === 'oui';

        // ✅ VALIDATION
        if (
          isNaN(day) || isNaN(month) || isNaN(year) ||
          day < 1 || day > 31 ||
          month < 1 || month > 12 ||
          year < 1950 || year > new Date().getFullYear()
        ) {
          return interaction.reply({
            content: "❌ Date invalide",
            ephemeral: true
          });
        }

        db.saveUser(interaction.guild.id, interaction.user.id, {
          day,
          month,
          year,
          showAge,
          vip: false
        });

        return interaction.reply({
          content: "✅ Anniversaire enregistré !",
          ephemeral: true
        });
      }
    }

  } catch (err) {
    console.error("💥 INTERACTION ERROR:", err);

    if (!interaction.replied && !interaction.deferred) {
      interaction.reply({
        content: "❌ Une erreur est survenue",
        ephemeral: true
      });
    }
  }

});


// =======================
// 🔹 LOGIN
// =======================
client.login(process.env.TOKEN);
