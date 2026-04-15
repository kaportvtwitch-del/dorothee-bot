const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'database.json');

function load() {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({}));
    return {};
  }
  return JSON.parse(fs.readFileSync(filePath));
}

function save(data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function initGuild(guildId) {
  const data = load();

  if (!data[guildId]) {
    data[guildId] = {
      users: {},
      config: {
        birthdayRole: null,
        birthdayChannel: null,
        birthdayMessage: "🎉 Joyeux anniversaire {user} !"
      }
    };
    save(data);
  }

  return data;
}

function saveUser(guildId, userId, payload) {
  const data = initGuild(guildId);
  data[guildId].users[userId] = payload;
  save(data);
}

function getUsers(guildId) {
  return initGuild(guildId)[guildId].users;
}

function setConfig(guildId, key, value) {
  const data = initGuild(guildId);
  data[guildId].config[key] = value;
  save(data);
}

module.exports = { initGuild, saveUser, getUsers, setConfig };