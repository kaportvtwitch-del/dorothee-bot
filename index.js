const fs = require("fs");
const { Client, Collection, GatewayIntentBits } = require("discord.js");
const { handleButtons } = require("./services/buttonHandler");
const { getGuild, updateGuild } = require("./database/db");

console.log("🔥 INDEX LANCÉ");
console.log("🧠 PID:", process.pid);

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.commands = new Collection();


// ========================
// 📦 LOAD COMMANDS
// ========================
const commandFiles = fs.readdirSync("./commands").filter(f => f.endsWith(".js"));

for (const file of commandFiles) {
  try {
    const cmd = require(`./commands/${file}`);

    if (!cmd.data || !cmd.execute) {
      console.log("⚠️ Commande ignorée:", file);
      continue;
    }

    client.commands.set(cmd.data.name, cmd);
    console.log("✅ Commande chargée:", cmd.data.name);

  } catch (err) {
    console.log("❌ ERREUR LOAD:", file, err);
  }
}


// ========================
// 🎮 INTERACTIONS
// ========================
client.on("interactionCreate", async (interaction) => {

  try {

    // ========================
    // 💬 COMMANDES SLASH
    // ========================
    if (interaction.isChatInputCommand()) {

      const cmd = client.commands.get(interaction.commandName);
      if (!cmd) return;

      return await cmd.execute(interaction, client);
    }


    // ========================
    // 🔘 BOUTONS
    // ========================
    if (interaction.isButton()) {
      return await handleButtons(interaction, client);
    }


    // ========================
    // 📅 SELECT MENU (CALENDRIER)
    // ========================
    if (interaction.isStringSelectMenu()) {

      const guildId = interaction.guild.id;
      const userId = interaction.user.id;

      const db = getGuild(guildId);

      if (!db.users[userId]) {
        db.users[userId] = {};
      }

      const user = db.users[userId];

      // STOCKAGE TEMPORAIRE
      if (interaction.customId === "select_day") {
        user.day = interaction.values[0];
      }

      if (interaction.customId === "select_month") {
        user.month = interaction.values[0];
      }

      if (interaction.customId === "select_year") {
        user.year = interaction.values[0];
      }

      // SI DATE COMPLÈTE
      if (user.day && user.month && user.year) {
        user.birth = `${user.year}-${user.month}-${user.day}`;
      }

      updateGuild(guildId, db);

      return interaction.reply({
        content: "✅ Date enregistrée !",
        ephemeral: true
      });
    }

  } catch (err) {

    console.log("💥 INTERACTION ERROR:", err);

    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: "❌ Une erreur est survenue",
          ephemeral: true
        });
      }
    } catch {}
  }
});


// ========================
// 🚀 READY
// ========================
client.once("clientReady", () => {
  console.log("🚀 BOT CONNECTÉ :", client.user.tag);
  console.log("🎂 Système anniversaire actif");
});


// ========================
// 🔐 LOGIN
// ========================
client.login(process.env.TOKEN);
