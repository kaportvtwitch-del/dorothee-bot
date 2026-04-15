const { REST, Routes } = require("discord.js");
const fs = require("fs");
const path = require("path");

const commands = [];
const commandFiles = fs.readdirSync(path.join(__dirname, "commands"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  commands.push(command.data.toJSON());
}

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log("🔄 Déploiement GLOBAL...");

    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, 1270838316152918189), // ✅ GLOBAL
      { body: commands }
    );

    console.log("✅ Commandes globales déployées !");
  } catch (err) {
    console.error(err);
  }
})();