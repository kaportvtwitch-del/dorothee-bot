const { SlashCommandBuilder } = require('discord.js');
const db = require('../database/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('db_liste')
    .setDescription('Voir les anniversaires de la semaine'),

  async execute(interaction) {
    try {
      const guildId = interaction.guild.id;
      const data = db.getGuild(guildId);

      if (!data.users || Object.keys(data.users).length === 0) {
        return interaction.reply({
          content: "❌ Aucun anniversaire enregistré",
          flags: 64
        });
      }

      const today = new Date();

      let list = [];

      for (const userId in data.users) {
        const user = data.users[userId];

        if (!user.birthday) continue;

        const [year, month, day] = user.birthday.split('-').map(Number);

        const birthdayThisYear = new Date(today.getFullYear(), month - 1, day);
        const diff = (birthdayThisYear - today) / (1000 * 60 * 60 * 24);

        if (diff >= 0 && diff <= 7) {
          let display = `<@${userId}>`;

          // 🎂 âge seulement si autorisé
          if (user.show_age) {
            const age = today.getFullYear() - year;
            display += ` (${age} ans)`;
          }

          list.push(display);
        }
      }

      if (list.length === 0) {
        return interaction.reply({
          content: "📭 Aucun anniversaire cette semaine",
          flags: 64
        });
      }

      return interaction.reply({
        content:
          `🎉 **Anniversaires de la semaine :**\n\n` +
          list.join('\n'),
        flags: 64
      });

    } catch (err) {
      console.error("💥 ERREUR DB_LISTE:", err);

      return interaction.reply({
        content: "❌ Une erreur est survenue",
        flags: 64
      });
    }
  }
};