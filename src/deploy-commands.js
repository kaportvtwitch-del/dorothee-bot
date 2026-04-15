const { REST, Routes } = require("discord.js");
const commands = require("./commands-data"); // ou ton loader

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log("🔄 Déploiement GLOBAL...");
    console.log("CLIENT_ID =", process.env.CLIENT_ID);

    await rest.put(
      Routes.applicationCommands("TON_CLIENT_ID_ICI"),
      { body: commands }
    );

    console.log("✅ Commandes globales déployées !");
  } catch (err) {
    console.error(err);
  }
})();