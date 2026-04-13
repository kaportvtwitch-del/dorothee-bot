require("dotenv").config();
const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const commands = [
  new SlashCommandBuilder()
    .setName("db_menu")
    .setDescription("🎂 Ouvrir le menu Dorothée"),

  new SlashCommandBuilder()
    .setName("db_list")
    .setDescription("📺 Voir les anniversaires de la semaine"),

  new SlashCommandBuilder()
    .setName("db_setdate")
    .setDescription("🎂 Définir ta date d'anniversaire")
    .addStringOption(option =>
      option.setName("date")
        .setDescription("Format: JJ/MM")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("db_reset")
    .setDescription("🧹 Reset la semaine (admin)")
];

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID),
    { body: commands }
  );
  console.log("✅ Commandes déployées !");
})();
