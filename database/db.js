const Database = require('better-sqlite3');

const db = new Database('birthday.sqlite');

// USERS (multi-guild)
db.prepare(`
CREATE TABLE IF NOT EXISTS users (
  user_id TEXT,
  guild_id TEXT,
  birthday TEXT,
  show_age INTEGER DEFAULT 0,
  is_vip INTEGER DEFAULT 0,
  PRIMARY KEY(user_id, guild_id)
)
`).run();

// CONFIG SERVEUR
db.prepare(`
CREATE TABLE IF NOT EXISTS guild_config (
  guild_id TEXT PRIMARY KEY,

  gen_title TEXT DEFAULT 'GÉNÉRIQUE ANNIVERSAIRES',
  gen_vip_title TEXT DEFAULT 'VIP',
  gen_nonvip_title TEXT DEFAULT 'NON VIP',
  gen_footer TEXT DEFAULT '🎉 Bon anniversaire !',

  birthday_channel_id TEXT,
  vip_role_id TEXT,

  birthday_message TEXT DEFAULT '🎂 Joyeux anniversaire !',
  vip_message TEXT DEFAULT '⭐ Clique pour devenir VIP',
  vip_button_label TEXT DEFAULT 'Devenir VIP'
)
`).run();

module.exports = db;