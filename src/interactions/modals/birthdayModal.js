// src/interactions/modals/birthdayModal.js
const { ModalBuilder, TextInputBuilder, ActionRowBuilder, TextInputStyle } = require("discord.js");

module.exports = () => {

  return new ModalBuilder()
    .setCustomId("birthdayModal")
    .setTitle("Anniversaire")
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("day")
          .setLabel("Jour")
          .setStyle(TextInputStyle.Short)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("month")
          .setLabel("Mois")
          .setStyle(TextInputStyle.Short)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("year")
          .setLabel("Année")
          .setStyle(TextInputStyle.Short)
      )
    );
};