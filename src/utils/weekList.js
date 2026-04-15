const db = require("../database/db");

module.exports = async (guildId) => {

  const today = new Date();

  const [rows] = await db.query(
    "SELECT * FROM birthdays WHERE guild_id=?",
    [guildId]
  );

  const week = [];

  for (const u of rows) {

    const date = new Date(today.getFullYear(), u.month - 1, u.day);

    const diff = Math.ceil((date - today) / (1000 * 60 * 60 * 24));

    if (diff >= 0 && diff <= 7) {
      week.push(u);
    }
  }

  return week;
};