const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'database.json');


// =======================
// 🔹 LOAD
// =======================
function load() {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify({}, null, 2));
    }

    const data = fs.readFileSync(filePath, 'utf-8');

    if (!data || data.trim() === "") return {};

    return JSON.parse(data);

  } catch (err) {
    console.error("❌ DB LOAD ERROR:", err);
    return {};
  }
}


// =======================
// 🔹 SAVE
// =======================
function save(data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("❌ DB SAVE ERROR:", err);
  }
}


// =======================
// 🔹 GET GUILD
// =======================
function getGuild(guildId) {
  const data = load();

  if (!data[guildId]) {
    data[guildId] = {
      users: {},
      config: {
        title: "🎂 Anniversaires de la semaine",
        vipTitle: "🌟 VIP",
        normalTitle: "🎉 Membres",
        footer: "Joyeux anniversaire !",
        roleId: null
      }
    };
    save(data);
  }

  return data[guildId];
}


// =======================
// 🔹 SAVE USER
// =======================
function saveUser(guildId, userId, userData) {
  const data = load();

  if (!data[guildId]) {
    data[guildId] = {
      users: {},
      config: {}
    };
  }

  data[guildId].users[userId] = {
    ...userData
  };

  save(data);
}


// =======================
// 🔹 DELETE USER
// =======================
function deleteUser(guildId, userId) {
  const data = load();

  if (data[guildId] && data[guildId].users[userId]) {
    delete data[guildId].users[userId];
    save(data);
  }
}


// =======================
// 🔹 GET ALL USERS
// =======================
function getUsers(guildId) {
  const guild = getGuild(guildId);
  return guild.users;
}


// =======================
// 🔹 UPDATE CONFIG
// =======================
function updateConfig(guildId, newConfig) {
  const data = load();

  if (!data[guildId]) {
    data[guildId] = {
      users: {},
      config: {}
    };
  }

  data[guildId].config = {
    ...data[guildId].config,
    ...newConfig
  };

  save(data);
}


// =======================
// 🔹 EXPORTS
// =======================
module.exports = {
  getGuild,
  saveUser,
  deleteUser,
  getUsers,
  updateConfig
};
