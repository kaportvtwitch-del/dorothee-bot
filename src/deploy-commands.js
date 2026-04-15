const { REST, Routes } = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = async () => {

  const commands = [];

  const commandsPath = path.join(__dirname, "commands");
  const commandFiles = fs.readdirSync(commandsPath);

  for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.push(command.data.toJSON());
  }

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  try {
    console.log("🔄 Déploiement GLOBAL...");

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log("✅ Commandes globales déployées !");
  } catch (err) {
    console.error("❌ DEPLOY ERROR:", err);
  }
};