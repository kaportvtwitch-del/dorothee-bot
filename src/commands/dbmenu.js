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
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("admin_menu")
        .setLabel("Admin")
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({
      content: "🎂 Menu anniversaire",
      components: [row],
      ephemeral: true
    });
  }
};