const db = require("../../database/db");

module.exports = async (interaction) => {

  await db.query(
    "UPDATE birthdays SET is_vip = true WHERE user_id=? AND guild_id=?",
    [interaction.user.id, interaction.guild.id]
  );

  return interaction.reply({
    content: "🌟 Tu es marqué comme VIP pour cette semaine !",
    ephemeral: true
  });
};