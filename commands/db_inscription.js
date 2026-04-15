const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('db_inscription')
    .setDescription('Poster le message VIP'),

  async execute(interaction) {

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('open_birthday_modal')
        .setLabel('🎂 S’inscrire pour son anniversaire')
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({
      content: "🎉 **Chasse au trésor VIP !**\n\nTrouve ce message et clique pour participer 👇",
      components: [row]
    });
  }
};