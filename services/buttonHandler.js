const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const { getGuild, updateGuild } = require("../database/db");

module.exports.handleButtons = async (interaction) => {

  const guildId = interaction.guild.id;
  const userId = interaction.user.id;

  const db = getGuild(guildId);

  await interaction.deferReply({ ephemeral: true }).catch(() => {});

  const id = interaction.customId;

  // ========================
  // 📅 OUVRIR CALENDRIER
  // ========================
  if (id === "set_date") {

    const days = Array.from({ length: 31 }, (_, i) => ({
      label: `${i + 1}`,
      value: `${i + 1}`
    }));

    const months = Array.from({ length: 12 }, (_, i) => ({
      label: `${i + 1}`,
      value: `${i + 1}`
    }));

    const years = Array.from({ length: 80 }, (_, i) => {
      const y = 2025 - i;
      return { label: `${y}`, value: `${y}` };
    });

    const row1 = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("select_day")
        .setPlaceholder("Jour")
        .addOptions(days.slice(0, 25))
    );

    const row2 = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("select_month")
        .setPlaceholder("Mois")
        .addOptions(months)
    );

    const row3 = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("select_year")
        .setPlaceholder("Année")
        .addOptions(years.slice(0, 25))
    );

    return interaction.editReply({
      content: "📅 Choisis ta date de naissance",
      components: [row1, row2, row3]
    });
  }

  // ========================
  // 🎂 TOGGLE AGE
  // ========================
  if (id === "toggle_age") {

    if (!db.users[userId]) db.users[userId] = {};

    db.users[userId].showAge = !db.users[userId].showAge;

    updateGuild(guildId, db);

    return interaction.editReply({
      content: `✔ Affichage âge : ${db.users[userId].showAge}`
    });
  }

  // ========================
  // 🗑 DELETE DATE
  // ========================
  if (id === "delete_date") {

    if (db.users[userId]) {
      delete db.users[userId].birth;
    }

    updateGuild(guildId, db);

    return interaction.editReply({
      content: "🗑 Date supprimée"
    });
  }

  // ========================
  // ❌ CLOSE
  // ========================
  if (id === "close_menu") {
    return interaction.editReply({
      content: "❌ Menu fermé",
      components: []
    });
  }

  // ========================
  // ⚙️ ADMIN MENU
  // ========================
  if (id === "admin_menu") {

    if (!interaction.member.permissions.has("Administrator")) {
      return interaction.editReply({ content: "❌ Admin uniquement" });
    }

    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("admin_select")
        .setPlaceholder("Gestion")
        .addOptions([
          { label: "📜 Liste semaine", value: "list" },
          { label: "🗑 Reset complet", value: "reset" },
          { label: "✏️ Modifier titre", value: "title" },
          { label: "⭐ Modifier titre VIP", value: "vipTitle" },
          { label: "👤 Modifier titre normal", value: "normalTitle" },
          { label: "📩 Modifier footer", value: "footer" },
          { label: "🎭 Rôle anniversaire", value: "role" }
        ])
    );

    return interaction.editReply({
      content: "⚙️ Menu admin",
      components: [row]
    });
  }

  // ========================
  // ⭐ VIP
  // ========================
  if (id === "become_vip") {

    if (!db.users[userId]) db.users[userId] = {};

    db.users[userId].vip = true;

    updateGuild(guildId, db);

    return interaction.editReply({
      content: "🌟 Tu es VIP !"
    });
  }

  return interaction.editReply({
    content: "❌ Action inconnue"
  });
};
