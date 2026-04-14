const db = require("../database/db");

module.exports = {
  data: {
    name: "db_liste"
  },

  async execute(interaction) {
    const data = db.initGuild(interaction.guildId);

    const users = data.users;

    let list = "🎂 ANNIVERSAIRES :\n\n";

    for (const userId in users) {
      const u = users[userId];
      list += `- <@${userId}> (${u.date})\n`;
    }

    return interaction.reply({
      content: list,
      ephemeral: false
    });
  }
};
