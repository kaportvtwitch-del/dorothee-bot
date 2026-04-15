const fs = require("fs");
const { Client, Collection, GatewayIntentBits } = require("discord.js");
const { handleButtons } = require("./services/buttonHandler");

console.log("🔥 INDEX LANCÉ");
console.log("PID:", process.pid);

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.commands = new Collection();

// LOAD COMMANDS
const files = fs.readdirSync("./commands").filter(f => f.endsWith(".js"));

for (const file of files) {
  const cmd = require(`./commands/${file}`);
  if (cmd.data && cmd.execute) {
    client.commands.set(cmd.data.name, cmd);
    console.log("✅ Commande chargée:", cmd.data.name);
  }
}

// INTERACTIONS
client.on("interactionCreate", async (interaction) => {

  try {

    if (interaction.isChatInputCommand()) {
      const cmd = client.commands.get(interaction.commandName);
      if (cmd) await cmd.execute(interaction);
    }

    if (interaction.isButton()) {
      await handleButtons(interaction);
    }

  } catch (err) {
    console.log("💥 ERROR:", err);
  }
});

client.once("clientReady", () => {
  console.log("🚀 CONNECTÉ :", client.user.tag);
});

client.login(process.env.TOKEN);
