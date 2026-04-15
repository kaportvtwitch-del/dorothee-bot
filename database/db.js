const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "data.json");

function loadDB() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify({ guilds: {} }, null, 2));
    }

    const raw = fs.readFileSync(DB_PATH, "utf8");

    if (!raw || raw.trim() === "") {
      return { guilds: {} };
    }

    return JSON.parse(raw);
  } catch (err) {
    console.log("❌ DB LOAD ERROR:", err);
    return { guilds: {} };
  }
}

function saveDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function getGuild(guildId) {
  const db = loadDB();

  if (!db.guilds[guildId]) {
    db.guilds[guildId] = {
      users: {},
      config: {
        title: "🎂 Anniversaires",
        vipTitle: "⭐ VIP",
        normalTitle: "👤 Membres",
        footer: "Bon anniversaire à tous !",
        ageEnabled: true,
        roleId: null,
        channelId: null
      }
    };
    saveDB(db);
  }

  return db.guilds[guildId];
}

function updateGuild(guildId, data) {
  const db = loadDB();
  db.guilds[guildId] = data;
  saveDB(db);
}

module.exports = {
  loadDB,
  saveDB,
  getGuild,
  updateGuild
};
