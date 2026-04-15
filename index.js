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
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder
} = require('discord.js');

const db = require('./database/db');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.commands = new Collection();


// =====================
// LOAD COMMANDS
// =====================
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


// =====================
// READY
// =====================
client.once('ready', () => {
  console.log(`🚀 BOT CONNECTÉ : ${client.user.tag}`);
  console.log("🎂 Système anniversaire actif");
});


// =====================
// INTERACTIONS
// =====================
client.on('interactionCreate', async interaction => {
  try {

    // COMMANDES
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      await command.execute(interaction, db);
    }

    // =====================
    // BOUTONS
    // =====================
    if (interaction.isButton()) {

      // OUVRIR MODAL
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

      // SUPPRIMER
      if (interaction.customId === "menu_delete") {
        const data = db.initGuild(interaction.guildId);
        delete data[interaction.guildId].users[interaction.user.id];

        fs.writeFileSync('./database/database.json', JSON.stringify(data, null, 2));

        return interaction.reply({
          content: "❌ Date supprimée",
          flags: 64
        });
      }

      // ADMIN MENU
      if (interaction.customId === "menu_admin") {

        if (!interaction.member.permissions.has("Administrator")) {
          return interaction.reply({ content: "❌ Accès refusé", flags: 64 });
        }

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('set_role').setLabel('🎭 Rôle').setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId('set_channel').setLabel('📢 Salon').setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId('set_message').setLabel('💬 Message').setStyle(ButtonStyle.Primary)
        );

        return interaction.reply({
          content: "⚙️ Configuration admin\nMentionne directement dans le chat 👇",
          components: [row],
          flags: 64
        });
      }

      // ADMIN ACTIONS
      if (interaction.customId === "set_role")
        return interaction.reply({ content: "Mentionne un rôle (@role)", flags: 64 });

      if (interaction.customId === "set_channel")
        return interaction.reply({ content: "Mentionne un salon (#salon)", flags: 64 });

      if (interaction.customId === "set_message")
        return interaction.reply({ content: "Tape le message avec {user}", flags: 64 });
    }

    // =====================
    // MODAL
    // =====================
    if (interaction.type === InteractionType.ModalSubmit) {

      if (interaction.customId === "birthday_modal") {

        const day = interaction.fields.getTextInputValue('day');
        const month = interaction.fields.getTextInputValue('month');
        const year = interaction.fields.getTextInputValue('year');

        db.saveUser(interaction.guildId, interaction.user.id, {
          day: parseInt(day),
          month: parseInt(month),
          year: parseInt(year),
          showAge: false
        });

        const select = new StringSelectMenuBuilder()
          .setCustomId('select_show_age')
          .setPlaceholder('Afficher ton âge ?')
          .addOptions([
            { label: "Oui", value: "yes" },
            { label: "Non", value: "no" }
          ]);

        const row = new ActionRowBuilder().addComponents(select);

        return interaction.reply({
          content: "📅 Date enregistrée !\nAfficher ton âge ?",
          components: [row],
          flags: 64
        });
      }
    }

    // =====================
    // SELECT
    // =====================
    if (interaction.isStringSelectMenu()) {

      if (interaction.customId === "select_show_age") {

        const value = interaction.values[0];
        const showAge = value === "yes";

        const data = db.initGuild(interaction.guildId);
        data[interaction.guildId].users[interaction.user.id].showAge = showAge;

        fs.writeFileSync('./database/database.json', JSON.stringify(data, null, 2));

        return interaction.update({
          content: `✅ Terminé ! Age affiché : ${showAge ? "Oui" : "Non"}`,
          components: []
        });
      }
    }

  } catch (err) {
    console.error("💥 INTERACTION ERROR:", err);
  }
});


// =====================
// MESSAGE ADMIN CONFIG
// =====================
client.on('messageCreate', message => {
  if (message.author.bot) return;
  if (!message.member.permissions.has("Administrator")) return;

  if (message.mentions.roles.first()) {
    db.setConfig(message.guild.id, "birthdayRole", message.mentions.roles.first().id);
    return message.reply("✅ Rôle configuré");
  }

  if (message.mentions.channels.first()) {
    db.setConfig(message.guild.id, "birthdayChannel", message.mentions.channels.first().id);
    return message.reply("✅ Salon configuré");
  }

  if (message.content.includes("{user}")) {
    db.setConfig(message.guild.id, "birthdayMessage", message.content);
    return message.reply("✅ Message configuré");
  }
});


// =====================
// CHECK ANNIVERSAIRES
// =====================
setInterval(async () => {

  const raw = fs.readFileSync('./database/database.json');
  const json = JSON.parse(raw || "{}");

  const today = new Date();
  const day = today.getDate();
  const month = today.getMonth() + 1;

  for (const guildId in json) {

    const guild = await client.guilds.fetch(guildId).catch(() => null);
    if (!guild) continue;

    const config = json[guildId].config;
    const users = json[guildId].users;

    if (!config.birthdayChannel) continue;

    const channel = await guild.channels.fetch(config.birthdayChannel).catch(() => null);
    if (!channel) continue;

    for (const userId in users) {
      const u = users[userId];

      if (u.day === day && u.month === month) {

        const member = await guild.members.fetch(userId).catch(() => null);
        if (!member) continue;

        // ROLE
        if (config.birthdayRole) {
          const role = guild.roles.cache.get(config.birthdayRole);
          if (role && !member.roles.cache.has(role.id)) {
            member.roles.add(role).catch(() => {});
          }
        }

        // MESSAGE
        let msg = config.birthdayMessage.replace("{user}", `<@${userId}>`);

        if (u.showAge) {
          const age = new Date().getFullYear() - u.year;
          msg += ` (${age} ans)`;
        }

        channel.send(msg);
      }
    }
  }

}, 60000);


// LOGIN
client.login(process.env.TOKEN);