const fs = require("fs");
const { Client, Collection, GatewayIntentBits } = require("discord.js");
const { handleButtons } = require("./services/buttonHandler");

console.log("🔥 INDEX LANCÉ (ENTRY POINT)");
console.log("🧠 PROCESS ID:", process.pid);

// ANTI DOUBLE INSTANCE
if (global.botStarted) {
  console.log("⚠️ BOT déjà lancé -> STOP");
  process.exit(0);
}
global.botStarted = true;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

client.commands = new Collection();

// LOAD COMMANDS
const commandFiles = fs.readdirSync("./commands").filter(f => f.endsWith(".js"));

for (const file of commandFiles) {
  const cmd = require(`./commands/${file}`);
  if (!cmd.data || !cmd.execute) {
    console.log("⚠️ Commande ignorée:", file);
    continue;
  }
  client.commands.set(cmd.data.name, cmd);
  console.log("✅ Commande chargée:", cmd.data.name);
}

// INTERACTIONS
client.on("interactionCreate", async (interaction) => {
  try {
    // SLASH COMMANDS
    if (interaction.isChatInputCommand()) {
      const cmd = client.commands.get(interaction.commandName);
      if (!cmd) return;
      return cmd.execute(interaction, client);
    }

    // BUTTONS + SELECT MENU
    if (interaction.isButton() || interaction.isStringSelectMenu()) {
      return handleButtons(interaction, client);
    }

  } catch (err) {
    console.log("💥 INTERACTION ERROR:", err);
    if (!interaction.replied) {
      await interaction.reply({
        content: "❌ Une erreur est survenue",
        ephemeral: true
      }).catch(() => {});
    }
  }
});

client.once("clientReady", () => {
  console.log("🚀 BOT CONNECTÉ :", client.user.tag);
  console.log("🎂 Birthday system ON");
});

client.login(process.env.TOKEN);
