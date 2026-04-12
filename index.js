const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events,
  PermissionsBitField
} = require("discord.js");

const fs = require("fs");

// 📁 FICHIER PERSISTANT
const DATA_FILE = "/home/u585460519/anniv.json";

// 📦 LOAD DATA
function loadData() {
  if (!fs.existsSync(DATA_FILE)) return {};
  return JSON.parse(fs.readFileSync(DATA_FILE));
}

// 💾 SAVE DATA
function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// 🧠 SEMAINE
function getWeek() {
  const now = new Date();
  const year = now.getFullYear();
  const start = new Date(year, 0, 1);
  const week = Math.ceil(((now - start) / 86400000) / 7);
  return `${year}-W${week}`;
}

// 🚀 INIT BOT
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ✅ READY
client.once("ready", () => {
  console.log("🔥 BOT CONNECTÉ (VERSION FINALE)");
});

// 📺 COMMANDES
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const data = loadData();
  const week = getWeek();
  const guildId = message.guild.id;

  // INIT SERVEUR
  if (!data[guildId]) data[guildId] = {};

  // INIT SETTINGS
  if (!data[guildId].settings) {
    data[guildId].settings = {
      title: "🎂 **ANNIVERSAIRES DE LA SEMAINE 📺**",
      footer: "💜 Kapor_TV"
    };
  }

  // 🎉 PANEL
  if (message.content === "!anniv_panel") {
    const button = new ButtonBuilder()
      .setCustomId("join_anniv")
      .setLabel("🎉 Je participe")
      .setStyle(ButtonStyle.Success);

    const row = new ActionRowBuilder().addComponents(button);

    message.channel.send({
      content:
        "🎂 **CLUB ANNIV DE LA SEMAINE 📺**\nClique pour rejoindre les anniversaires 💜🍆",
      components: [row]
    });
  }

  // 📋 LISTE
  if (message.content === "!anniv_list") {
    const list = data[guildId][week] || [];

    if (list.length === 0) {
      return message.channel.send("📭 Aucun participant cette semaine");
    }

    const formatted = list.map(id => `<@${id}>`).join("\n");

    message.channel.send(
      `${data[guildId].settings.title}\n\n${formatted}\n\n${data[guildId].settings.footer}`
    );
  }

  // 🏷️ CHANGER TITRE
  if (message.content.startsWith("!anniv_titre ")) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply("❌ Permission refusée");
    }

    const newTitle = message.content.replace("!anniv_titre ", "");

    data[guildId].settings.title = newTitle;
    saveData(data);

    message.reply("✅ Titre mis à jour !");
  }

  // 💬 CHANGER MESSAGE BAS
  if (message.content.startsWith("!anniv_message ")) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply("❌ Permission refusée");
    }

    const newFooter = message.content.replace("!anniv_message ", "");

    data[guildId].settings.footer = newFooter;
    saveData(data);

    message.reply("✅ Message mis à jour !");
  }

  // 🧹 RESET
  if (message.content === "!anniv_reset") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply("❌ Tu n'as pas la permission !");
    }

    data[guildId][week] = [];
    saveData(data);

    message.channel.send("🧹 Liste réinitialisée !");
  }
});

// 🎯 BOUTON
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;

  const data = loadData();
  const week = getWeek();
  const guildId = interaction.guild.id;
  const userId = interaction.user.id;

  // INIT
  if (!data[guildId]) data[guildId] = {};
  if (!data[guildId][week]) data[guildId][week] = [];

  // INIT SETTINGS (sécurité)
  if (!data[guildId].settings) {
    data[guildId].settings = {
      title: "🎂 **ANNIVERSAIRES DE LA SEMAINE 📺**",
      footer: "💜 Kapor_TV"
    };
  }

  // CHECK DOUBLON
  if (data[guildId][week].includes(userId)) {
    return interaction.reply({
      content: "⚠️ Déjà inscrit !",
      ephemeral: true
    });
  }

  // AJOUT
  data[guildId][week].push(userId);
  saveData(data);

  interaction.reply({
    content: "🎉 Inscrit au Club Anniv !",
    ephemeral: true
  });
});

// 🔐 LOGIN
client.login(process.env.DISCORD_TOKEN);