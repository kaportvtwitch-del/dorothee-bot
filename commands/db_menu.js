const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('db_menu')
    .setDescription('Menu anniversaire'),

  async execute(interaction) {
    await interaction.reply({
      content: "🎛️ Utilise /db_inscription pour configurer ton anniversaire",
      flags: 64
    });
  }
};