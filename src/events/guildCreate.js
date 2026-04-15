// src/events/guildCreate.js
const db = require("../database/db");

module.exports = (client) => {
  client.on("guildCreate", async (guild) => {
    await db.query(
      "INSERT IGNORE INTO guilds (guild_id) VALUES (?)",
      [guild.id]
    );
  });
};