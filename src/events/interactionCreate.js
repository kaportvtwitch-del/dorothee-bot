const dbmenu = require("../commands/dbmenu");
const birthdayModal = require("../interactions/modals/birthdayModal");
const adminModal = require("../interactions/modals/adminModal");

const vipButton = require("../interactions/buttons/vipButton");
const adminMenu = require("../interactions/buttons/adminMenu");

const guildService = require("../services/guildService");

module.exports = (client) => {
  client.on("interactionCreate", async (interaction) => {

    // COMMAND
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === "dbmenu") {
        return dbmenu.execute(interaction);
      }
    }

    // BUTTONS
    if (interaction.isButton()) {

      if (interaction.customId === "add_birthday") {
        return interaction.showModal(birthdayModal());
      }

      if (interaction.customId === "vip") {
        return vipButton(interaction);
      }

      if (interaction.customId === "admin_menu") {
        return adminMenu(interaction);
      }

      // EDIT TEXT
      const map = {
        edit_title: "title",
        edit_vip: "vip_subtitle",
        edit_nonvip: "nonvip_subtitle",
        edit_footer: "footer",
        edit_bday_msg: "birthday_message",
        edit_vip_msg: "vip_message"
      };

      if (map[interaction.customId]) {
        return interaction.showModal(
          adminModal(interaction.customId, "Modifier")
        );
      }

      // SET ROLE / CHANNEL
      if (interaction.customId === "set_channel") {
        await guildService.updateField(interaction.guild.id, "channel_id", interaction.channel.id);
        return interaction.reply({ content: "✅ Salon défini", ephemeral: true });
      }

      if (interaction.customId === "set_role") {
        const role = interaction.member.roles.highest;
        await guildService.updateField(interaction.guild.id, "role_id", role.id);
        return interaction.reply({ content: "✅ Rôle anniversaire défini", ephemeral: true });
      }

      if (interaction.customId === "set_vip_role") {
        const role = interaction.member.roles.highest;
        await guildService.updateField(interaction.guild.id, "vip_role_id", role.id);
        return interaction.reply({ content: "✅ Rôle VIP défini", ephemeral: true });
      }

    }

    // MODAL
    if (interaction.isModalSubmit()) {

      if (interaction.customId === "birthdayModal") {
        const db = require("../database/db");

        const day = interaction.fields.getTextInputValue("day");
        const month = interaction.fields.getTextInputValue("month");
        const year = interaction.fields.getTextInputValue("year");

        await db.query(
          `INSERT INTO birthdays 
          (user_id, guild_id, day, month, year) 
          VALUES (?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE day=?, month=?, year=?`,
          [
            interaction.user.id,
            interaction.guild.id,
            day, month, year,
            day, month, year
          ]
        );

        return interaction.reply({ content: "✅ Enregistré", ephemeral: true });
      }

      // ADMIN MODAL SAVE
      const map = {
        edit_title: "title",
        edit_vip: "vip_subtitle",
        edit_nonvip: "nonvip_subtitle",
        edit_footer: "footer",
        edit_bday_msg: "birthday_message",
        edit_vip_msg: "vip_message"
      };

      if (map[interaction.customId]) {
        const value = interaction.fields.getTextInputValue("value");

        await guildService.updateField(
          interaction.guild.id,
          map[interaction.customId],
          value
        );

        return interaction.reply({ content: "✅ Modifié", ephemeral: true });
      }

    }

  });
};