const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const db = require('../database/db');

module.exports = {
  data: { name: "db_inscription" },

  async execute(interaction) {

    const guildId = interaction.guild.id;
    const config = db.getConfig(guildId);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('vip_join')
        .setLabel(config.vip_button_label)
        .setStyle(ButtonStyle.Success)
    );

    await interaction.channel.send({
      content: config.vip_message,
      components: [row]
    });

    await interaction.reply({
      content: "✅ Message VIP envoyé",
      ephemeral: true
    });
  }
};
