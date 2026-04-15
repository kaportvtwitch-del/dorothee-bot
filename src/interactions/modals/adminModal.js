const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js");

module.exports = (customId, label) => {

  return new ModalBuilder()
    .setCustomId(customId)
    .setTitle(label)
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("value")
          .setLabel(label)
          .setStyle(TextInputStyle.Paragraph)
      )
    );
};