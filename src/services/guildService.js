// src/services/guildService.js
const db = require("../database/db");

exports.getGuild = async (guildId) => {
  const [[row]] = await db.query(
    "SELECT * FROM guilds WHERE guild_id=?",
    [guildId]
  );
  return row;
};

exports.updateField = async (guildId, field, value) => {
  await db.query(
    `UPDATE guilds SET ${field}=? WHERE guild_id=?`,
    [value, guildId]
  );
};