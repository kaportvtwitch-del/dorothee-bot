const { REST, Routes } = require('discord.js');

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const commands = [
  {
    name: "db_menu",
    description: "Menu anniversaires"
  },
  {
    name: "db_liste",
    description: "Afficher le générique"
  },
  {
    name: "db_inscription",
    description: "Envoyer message VIP"
  }
];

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log("🚀 Déploiement commandes...");

    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands }
    );

    console.log("✅ Commandes déployées !");
  } catch (err) {
    console.error(err);
  }
})();
