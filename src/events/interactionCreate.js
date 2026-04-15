// src/events/interactionCreate.js
const dbmenu = require("../commands/dbmenu");
const birthdayModal = require("../interactions/modals/birthdayModal");
const vipButton = require("../interactions/buttons/vipButton");

module.exports = (client) => {
  client.on("interactionCreate", async (interaction) => {

    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === "dbmenu") {
        return dbmenu.execute(interaction);
      }
    }

    if (interaction.isButton()) {
      if (interaction.customId === "add_birthday") {
        return interaction.showModal(birthdayModal());
      }

      if (interaction.customId === "vip") {
        return vipButton(interaction);
      }
    }

    if (interaction.isModalSubmit()) {
      if (interaction.customId === "birthdayModal") {
        const db = require("../database/db");

        const day = interaction.fields.getTextInputValue("day");
        const month = interaction.fields.getTextInputValue("month");
        const year = interaction.fields.getTextInputValue("year");

        await db.query(
          `INSERT INTO birthdays 
          (user_id, guild_id, day, month, year) 
          VALUES (?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE 
          day=?, month=?, year=?`,
          [
            interaction.user.id,
            interaction.guild.id,
            day, month, year,
            day, month, year
          ]
        );

        interaction.reply({ content: "✅ Enregistré", ephemeral: true });
      }
    }

  });
};