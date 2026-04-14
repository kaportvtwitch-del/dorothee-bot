console.log("🔥 INDEX LANCÉ (ENTRY POINT)");

if (global.__BOT_RUNNING__) {
  console.log("⛔ BOT DÉJÀ LANCÉ -> STOP");
  process.exit(0);
}
global.__BOT_RUNNING__ = true;

const fs = require("fs");
const path = require("path");
const {
  Client,
  Collection,
  GatewayIntentBits,
  Partials
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages
  ],
  partials: [Partials.Channel]
});

client.commands = new Collection();

/* LOAD COMMANDS */
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

/* INTERACTIONS */
client.on("interactionCreate", async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      const cmd = client.commands.get(interaction.commandName);
      if (!cmd) return;

      await cmd.execute(interaction, client);
    }

    if (interaction.isButton()) {
      const handler = require("./services/interactions");
      await handler.handleButton(interaction, client);
    }

    if (interaction.isStringSelectMenu()) {
      const handler = require("./services/interactions");
      await handler.handleSelect(interaction, client);
    }

    if (interaction.isModalSubmit()) {
      const handler = require("./services/interactions");
      await handler.handleModal(interaction, client);
    }

  } catch (err) {
    console.error("💥 INTERACTION ERROR:", err);
    if (!interaction.replied) {
      interaction.reply({
        content: "❌ Erreur interaction",
        ephemeral: true
      });
    }
  }
});

/* LOGIN */
client.once("ready", () => {
  console.log("🚀 BOT CONNECTÉ :", client.user.tag);
  console.log("🎂 Birthday system ON");
});

client.login(process.env.TOKEN);
