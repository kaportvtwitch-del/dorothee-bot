const { ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");

module.exports = {
  data: {
    name: "db_inscription"
  },

  async execute(interaction) {

    const select = new StringSelectMenuBuilder()
      .setCustomId("birthday_date")
      .setPlaceholder("Choisis ta date")
      .addOptions([
        {
          label: "01/01",
          value: "01/01"
        },
        {
          label: "02/01",
          value: "02/01"
        },
        {
          label: "03/01",
          value: "03/01"
        }
      ]);

    const row = new ActionRowBuilder().addComponents(select);

    return interaction.reply({
      content: "📅 Choisis ta date d'anniversaire",
      components: [row],
      ephemeral: true
    });
  }
};
