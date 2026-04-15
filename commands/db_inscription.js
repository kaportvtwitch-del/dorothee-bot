const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('db_inscription')
    .setDescription('Poster le message VIP'),

  async execute(interaction) {

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('open_birthday_modal')
        .setLabel('🎂 Participer')
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({
      content: "🎉 Clique pour t’inscrire !",
      components: [row]
    });
  }
};