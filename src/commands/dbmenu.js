// src/commands/dbmenu.js
const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("dbmenu")
    .setDescription("Menu anniversaire"),

  async execute(interaction) {

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("add_birthday")
        .setLabel("Ajouter / Modifier")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("vip")
        .setLabel("Devenir VIP")
        .setStyle(ButtonStyle.Success)
    );

    await interaction.reply({
      content: "🎂 Menu",
      components: [row],
      ephemeral: true
    });
  }
};