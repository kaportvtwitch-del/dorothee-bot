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

// 💾 FICHIER
const DATA_FILE = "/home/u585460519/anniv.json";

// LOAD
function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) return {};
    return JSON.parse(fs.readFileSync(DATA_FILE));
  } catch (e) {
    console.error("Erreur JSON :", e);
    return {};
  }
}

// SAVE
function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// SEMAINE
function getWeek() {
  const now = new Date();
  const year = now.getFullYear();
  const start = new Date(year, 0, 1);
  const week = Math.ceil(((now - start) / 86400000) / 7);
  return `${year}-W${week}`;
}

// BOT
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once("ready", () => {
  console.log("🔥 Dorothée Bot connecté !");
});

// COMMANDES
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const data = loadData();
  const week = getWeek();
  const guildId = message.guild.id;
  const userId = message.author.id;

  if (!data[guildId]) data[guildId] = {};

  if (!data[guildId].settings) {
    data[guildId].settings = {
      title: "🎂 ANNIVERSAIRES DE LA SEMAINE 📺",
      footer: "💜 Kapor_TV",
      roleId: null
    };
  }

  // 🎉 PANEL
  if (message.content === "!db_panel") {
    const button = new ButtonBuilder()
      .setCustomId("join_anniv")
      .setLabel("🎉 Je participe")
      .setStyle(ButtonStyle.Success);

    const row = new ActionRowBuilder().addComponents(button);

    message.channel.send({
      content: "🎂 Clique pour rejoindre les anniversaires !",
      components: [row]
    });
  }

  // 📋 LISTE
  if (message.content === "!db_list") {
    const list = data[guildId][week] || [];

    if (list.length === 0) {
      return message.channel.send("📭 Aucun participant cette semaine");
    }

    list.sort((a, b) => (b.vip || false) - (a.vip || false));

    const formatted = list
      .map(u => {
        let line = u.vip
          ? `✨🎉 <@${u.id}> 🎉✨`
          : `<@${u.id}>`;

        if (u.age) line += ` (${u.age} ans)`;
        if (u.bonus) line += ` ${u.bonus}`;

        return line;
      })
      .join("\n");

    message.channel.send(
      `${data[guildId].settings.title}\n\n${formatted}\n\n${data[guildId].settings.footer}`
    );
  }

  // 🎂 SET DATE
  if (message.content.startsWith("!db_set ")) {
    const input = message.content.replace("!db_set ", "");
    const regex = /^\d{2}\/\d{2}\/\d{4}$/;

    if (!regex.test(input)) {
      return message.reply("❌ Format JJ/MM/AAAA requis");
    }

    const [day, month, year] = input.split("/");

    if (!data[guildId].birthdays) data[guildId].birthdays = {};

    data[guildId].birthdays[userId] = {
      date: `${day}/${month}`,
      year: parseInt(year)
    };

    saveData(data);

    message.reply(`🎉 Date enregistrée : ${input}`);
  }

  // 🏷️ TITRE
  if (message.content.startsWith("!db_titre ")) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply("❌ Permission refusée");
    }

    data[guildId].settings.title = message.content.replace("!db_titre ", "");
    saveData(data);

    message.reply("✅ Titre modifié !");
  }

  // 💬 MESSAGE
  if (message.content.startsWith("!db_message ")) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply("❌ Permission refusée");
    }

    data[guildId].settings.footer = message.content.replace("!db_message ", "");
    saveData(data);

    message.reply("✅ Message modifié !");
  }

  // 🎭 ROLE
  if (message.content.startsWith("!db_role ")) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply("❌ Permission refusée");
    }

    const roleId = message.content.replace("!db_role ", "").replace(/[<@&>]/g, "");
    const role = message.guild.roles.cache.get(roleId);

    if (!role) return message.reply("❌ Rôle invalide");

    data[guildId].settings.roleId = roleId;
    saveData(data);

    message.reply(`✅ Rôle défini : <@&${roleId}>`);
  }

  // 🧹 RESET
  if (message.content === "!db_reset") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply("❌ Permission refusée");
    }

    data[guildId][week] = [];
    saveData(data);

    message.reply("🧹 Reset effectué !");
  }

  // ℹ️ INFO
  if (message.content === "!db_info") {
    message.channel.send(
`📺 **Dorothée Bot - Kapor_TV 💜**

🎂 **Fonctionnalités :**
• Inscription automatique aux anniversaires
• Système VIP via bouton secret ✨
• Gestion des rôles anniversaire 🎭
• Calcul de l’âge automatique 🎉
• Bonus spécial pour les dizaines 😄
• Personnalisation par serveur

📜 **Commandes :**
\`!db_panel\`
\`!db_list\`
\`!db_set JJ/MM/AAAA\`
\`!db_titre\`
\`!db_message\`
\`!db_role\`
\`!db_reset\`
\`!db_info\`

🔗 https://discord.gg/Dyr6D3xnP9

💜 Kapor_TV`
    );
  }
});

// 🎯 BOUTON VIP
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;

  const data = loadData();
  const week = getWeek();
  const guildId = interaction.guild.id;
  const userId = interaction.user.id;

  if (!data[guildId]) data[guildId] = {};
  if (!data[guildId][week]) data[guildId][week] = [];

  let user = data[guildId][week].find(u => u.id === userId);

  if (user) {
    user.vip = true;
  } else {
    data[guildId][week].push({ id: userId, vip: true });
  }

  saveData(data);

  interaction.reply({
    content: "✨ Mode VIP activé !",
    ephemeral: true
  });
});

// ⏱ AUTO ANNIV
setInterval(() => {
  const data = loadData();
  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const todayStr = `${day}/${month}`;
  const week = getWeek();
  const currentYear = today.getFullYear();

  for (const guildId in data) {
    const guildData = data[guildId];
    if (!guildData.birthdays) continue;

    if (!guildData[week]) guildData[week] = [];

    const guild = client.guilds.cache.get(guildId);
    if (!guild) continue;

    for (const userId in guildData.birthdays) {
      const bday = guildData.birthdays[userId];

      if (bday && bday.date === todayStr) {
        if (!guildData[week].find(u => u.id === userId)) {
          const age = currentYear - bday.year;

          let bonus = "";
          if (age % 10 === 0) {
            bonus = "🎉✨ (DIZAINE !) ✨🎉";
          }

          guildData[week].push({
            id: userId,
            vip: false,
            age: age,
            bonus: bonus
          });

          const member = guild.members.cache.get(userId);
          const roleId = guildData.settings?.roleId;

          if (member && roleId) {
            const role = guild.roles.cache.get(roleId);
            if (role) member.roles.add(role).catch(console.error);
          }
        }
      }
    }
  }

  saveData(data);
}, 3600000);

// LOGIN
client.login(process.env.DISCORD_TOKEN);
