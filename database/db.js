const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'database.json');

/* ================= INIT ================= */

function init() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({
      users: [],
      guild_config: []
    }, null, 2));
  }
}

/* ================= LOAD SAFE ================= */

function load() {
  init();

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');

    if (!raw || raw.trim() === "") {
      throw new Error("EMPTY JSON");
    }

    return JSON.parse(raw);

  } catch (err) {
    console.error("⚠️ JSON CORRUPTED → RESET");

    const clean = {
      users: [],
      guild_config: []
    };

    fs.writeFileSync(DB_FILE, JSON.stringify(clean, null, 2));
    return clean;
  }
}

/* ================= SAVE ================= */

function save(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

/* ================= GUILD INIT ================= */

function initGuild(guildId) {
  const data = load();

  let guild = data.guild_config.find(g => g.guild_id === guildId);

  if (!guild) {
    data.guild_config.push({
      guild_id: guildId,
      title: "🎉 Anniversaires de la semaine",
      vip_title: "⭐ VIP",
      nonvip_title: "🎈 Membres",
      footer: "Bon anniversaire !",
      role_id: null,
      channel_id: null
    });

    save(data);
  }
}

/* ================= USER UPSERT ================= */

function upsertUser(userId, guildId, newData) {
  const data = load();

  let user = data.users.find(
    u => u.user_id === userId && u.guild_id === guildId
  );

  if (!user) {
    user = {
      user_id: userId,
      guild_id: guildId,
      birthday: null,
      is_vip: 0,
      show_age: 1
    };

    data.users.push(user);
  }

  Object.assign(user, newData);

  save(data);
}

/* ================= EXPORT ================= */

module.exports = {
  initGuild,
  upsertUser,
  load
};
