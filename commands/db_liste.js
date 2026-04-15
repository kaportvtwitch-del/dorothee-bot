const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('db_liste')
    .setDescription('Liste des anniversaires'),

  async execute(interaction, db) {

    const users = db.getUsers(interaction.guildId);

    if (!users || Object.keys(users).length === 0) {
      return interaction.reply({ content: "📭 Aucun anniversaire", flags: 64 });
    }

    let msg = "🎂 Liste :\n\n";

    for (const id in users) {
      const u = users[id];
      msg += `<@${id}> → ${u.day}/${u.month}/${u.year}\n`;
    }

    await interaction.reply(msg);
  }
};