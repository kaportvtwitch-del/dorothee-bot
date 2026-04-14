const db = require("../database/db");

module.exports = {
  async handleButton(interaction, client) {
    const guildData = db.initGuild(interaction.guildId);

    if (interaction.customId === "db_menu") {
      return interaction.reply({
        content: "📊 Menu ouvert",
        ephemeral: true
      });
    }

    if (interaction.customId === "add_birthday") {
      return interaction.reply({
        content: "📅 Utilise le menu déroulant pour ta date",
        ephemeral: true
      });
    }
  },

  async handleSelect(interaction) {
    const guildData = db.initGuild(interaction.guildId);

    if (interaction.customId === "birthday_date") {
      const value = interaction.values[0];

      guildData.users[interaction.user.id] = {
        date: value,
        show_age: true
      };

      db.save(db.load());

      return interaction.reply({
        content: "✅ Date enregistrée : " + value,
        ephemeral: true
      });
    }
  },

  async handleModal(interaction) {
    return interaction.reply({
      content: "🧠 Modal reçu",
      ephemeral: true
    });
  }
};
