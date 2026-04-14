const fs = require('fs');
const {
  Client,
  GatewayIntentBits,
  Collection
} = require('discord.js');

const db = require('./database/db');
const { handleButtons, temp } = require('./services/buttonHandler');

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

    if (!cmd.data || !cmd.data.name) {
      console.log(`⚠️ Commande ignorée: ${file}`);
      continue;
    }

    client.commands.set(cmd.data.name, cmd);
    console.log(`✅ Commande chargée: ${cmd.data.name}`);
  }

  console.log(`📦 Total commandes chargées: ${client.commands.size}`);

} catch (err) {
  console.error("❌ ERREUR LOAD COMMANDS:", err);
}

/* ===================== READY ===================== */

client.once('ready', () => {
  console.log(`🚀 BOT CONNECTÉ : ${client.user.tag}`);

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

    db.initGuild(interaction.guild.id);

    /* ===== SLASH COMMAND ===== */

    if (interaction.isChatInputCommand()) {

      const cmd = client.commands.get(interaction.commandName);

      if (!cmd) {
        return interaction.reply({
          content: "❌ Commande introuvable",
          flags: 64
        });
      }

      return await cmd.execute(interaction);
    }

    /* ===== BUTTON ===== */

    if (interaction.isButton()) {
      return await handleButtons(interaction);
    }

    /* ===== SELECT MENU (CALENDRIER) ===== */

    if (interaction.isStringSelectMenu()) {

      const userId = interaction.user.id;
      const data = temp[userId];

      if (!data) return;

      if (interaction.customId === 'day') {
        data.day = interaction.values[0];
      }

      if (interaction.customId === 'month') {
        data.month = interaction.values[0];
      }

      if (interaction.customId === 'year') {
        data.year = interaction.values[0];
      }

      return interaction.deferUpdate();
    }

    /* ===== MODAL (SI UTILISÉ PLUS TARD) ===== */

    if (interaction.isModalSubmit()) {

      if (interaction.customId === 'birthday_modal') {

        const value = interaction.fields.getTextInputValue('date_input');

        const [d, m, y] = value.split('/');

        if (!d || !m || !y) {
          return interaction.reply({
            content: "❌ Format invalide",
            flags: 64
          });
        }

        const formatted = `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;

        db.upsertUser(interaction.user.id, interaction.guild.id, {
          birthday: formatted
        });

        return interaction.reply({
          content: "✅ Date enregistrée !",
          flags: 64
        });
      }
    }

  } catch (err) {
    console.error("💥 INTERACTION ERROR:", err);

    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: "❌ Une erreur est survenue.",
          flags: 64
        });
      }
    } catch {}
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

process.on('unhandledRejection', (err) => {
  console.error("⚠️ UNHANDLED REJECTION:", err);
});

process.on('uncaughtException', (err) => {
  console.error("⚠️ UNCAUGHT EXCEPTION:", err);
});
