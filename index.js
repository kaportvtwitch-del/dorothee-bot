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
  ActionRowBuilder,
  StringSelectMenuBuilder
} = require('discord.js');

const db = require('./database/db');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.commands = new Collection();


// 📦 LOAD COMMANDS
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


// 🚀 READY
client.once('ready', () => {
  console.log(`🚀 BOT CONNECTÉ : ${client.user.tag}`);
  console.log("🎂 Système anniversaire actif");
});


// 🎯 INTERACTIONS
client.on('interactionCreate', async interaction => {
  try {

    // =====================
    // COMMANDES
    // =====================
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      await command.execute(interaction, db);
    }


    // =====================
    // BOUTONS
    // =====================
    if (interaction.isButton()) {

      // 🎂 OUVRIR MODAL
      if (interaction.customId === "open_birthday_modal" || interaction.customId === "menu_add") {

        const modal = new ModalBuilder()
          .setCustomId('birthday_modal')
          .setTitle('🎂 Ton anniversaire');

        const day = new TextInputBuilder()
          .setCustomId('day')
          .setLabel('Jour (1-31)')
          .setStyle(TextInputStyle.Short);

        const month = new TextInputBuilder()
          .setCustomId('month')
          .setLabel('Mois (1-12)')
          .setStyle(TextInputStyle.Short);

        const year = new TextInputBuilder()
          .setCustomId('year')
          .setLabel('Année (ex: 1990)')
          .setStyle(TextInputStyle.Short);

        modal.addComponents(
          new ActionRowBuilder().addComponents(day),
          new ActionRowBuilder().addComponents(month),
          new ActionRowBuilder().addComponents(year)
        );

        return interaction.showModal(modal);
      }


      // ❌ SUPPRIMER DATE
      if (interaction.customId === "menu_delete") {
        const data = db.initGuild(interaction.guildId);

        delete data[interaction.guildId].users[interaction.user.id];
        fs.writeFileSync('./database/database.json', JSON.stringify(data, null, 2));

        return interaction.reply({
          content: "❌ Date supprimée",
          flags: 64
        });
      }


      // ⚙️ ADMIN
      if (interaction.customId === "menu_admin") {

        if (!interaction.member.permissions.has("Administrator")) {
          return interaction.reply({
            content: "❌ Accès refusé",
            flags: 64
          });
        }

        return interaction.reply({
          content: "⚙️ Menu admin bientôt dispo",
          flags: 64
        });
      }
    }


    // =====================
    // MODAL (FORMULAIRE)
    // =====================
    if (interaction.type === InteractionType.ModalSubmit) {

      if (interaction.customId === "birthday_modal") {

        const day = interaction.fields.getTextInputValue('day');
        const month = interaction.fields.getTextInputValue('month');
        const year = interaction.fields.getTextInputValue('year');

        // 💾 sauvegarde temporaire sans showAge
        db.saveUser(interaction.guildId, interaction.user.id, {
          day: parseInt(day),
          month: parseInt(month),
          year: parseInt(year),
          showAge: false
        });

        // 📋 SELECT MENU POUR AGE
        const select = new StringSelectMenuBuilder()
          .setCustomId('select_show_age')
          .setPlaceholder('Afficher ton âge ?')
          .addOptions([
            {
              label: "Oui",
              value: "yes"
            },
            {
              label: "Non",
              value: "no"
            }
          ]);

        const row = new ActionRowBuilder().addComponents(select);

        return interaction.reply({
          content: "📅 Date enregistrée !\n\n👉 Veux-tu afficher ton âge ?",
          components: [row],
          flags: 64
        });
      }
    }


    // =====================
    // SELECT MENU
    // =====================
    if (interaction.isStringSelectMenu()) {

      if (interaction.customId === "select_show_age") {

        const value = interaction.values[0];
        const showAge = value === "yes";

        const data = db.initGuild(interaction.guildId);

        if (!data[interaction.guildId].users[interaction.user.id]) {
          return interaction.reply({
            content: "❌ Donnée introuvable",
            flags: 64
          });
        }

        data[interaction.guildId].users[interaction.user.id].showAge = showAge;

        fs.writeFileSync('./database/database.json', JSON.stringify(data, null, 2));

        return interaction.update({
          content: `✅ Configuration terminée !\nAfficher âge : ${showAge ? "Oui" : "Non"}`,
          components: []
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


// 🔐 LOGIN
client.login(process.env.TOKEN);