const fs = require('fs');

const DB_FILE = './database.json';

// INIT FILE
function init() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({
      users: [],
      guild_config: []
    }, null, 2));
  }
}

function load() {
  init();
  return JSON.parse(fs.readFileSync(DB_FILE));
}

function save(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

/* ===================== USERS ===================== */

function getUsers(guildId) {
  const db = load();
  return db.users.filter(u => u.guild_id === guildId);
}

function upsertUser(userId, guildId, data = {}) {
  const db = load();

  let user = db.users.find(
    u => u.user_id === userId && u.guild_id === guildId
  );

  if (!user) {
    user = {
      user_id: userId,
      guild_id: guildId,
      birthday: null,
      show_age: 0,
      is_vip: 0,
      ...data
    };
    db.users.push(user);
  } else {
    Object.assign(user, data);
  }

  save(db);
}

/* ===================== CONFIG ===================== */

function initGuild(guildId) {
  const db = load();

  const exists = db.guild_config.find(g => g.guild_id === guildId);
  if (exists) return;

  db.guild_config.push({
    guild_id: guildId,

    gen_title: "GÉNÉRIQUE ANNIVERSAIRES",
    gen_vip_title: "VIP",
    gen_nonvip_title: "NON VIP",
    gen_footer: "🎉 Bon anniversaire !",

    vip_message: "⭐ Clique pour devenir VIP",
    vip_button_label: "Devenir VIP"
  });

  save(db);
}

function getConfig(guildId) {
  const db = load();
  return db.guild_config.find(g => g.guild_id === guildId);
}

module.exports = {
  getUsers,
  upsertUser,
  initGuild,
  getConfig
};
