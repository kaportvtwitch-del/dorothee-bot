const dbmenu = require("../commands/dbmenu");
const birthdayModal = require("../interactions/modals/birthdayModal");
const adminModal = require("../interactions/modals/adminModal");

const vipButton = require("../interactions/buttons/vipButton");
const adminMenu = require("../interactions/buttons/adminMenu");

const guildService = require("../services/guildService");
const weekList = require("../utils/weekList");

const db = require("../database/db");

const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = (client) => {
  client.on("interactionCreate", async (interaction) => {

    // COMMANDES
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === "dbmenu") {
        return dbmenu.execute(interaction);
      }
    }

    // BOUTONS
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

      // MESSAGE VIP
      if (interaction.customId === "send_vip_msg") {

        const config = await guildService.getGuild(interaction.guild.id);

        const button = new ButtonBuilder()
          .setCustomId("vip")
          .setLabel(config?.vip_button || "Devenir VIP")
          .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(button);

        await interaction.channel.send({
          content: config?.vip_message || "🎉 Clique pour devenir VIP",
          components: [row]
        });

        return interaction.reply({
          content: "✅ Message VIP envoyé",
          ephemeral: true
        });
      }

      // LISTE SEMAINE
      if (interaction.customId === "send_week_list") {

        const config = await guildService.getGuild(interaction.guild.id);
        const list = await weekList(interaction.guild.id);

        let vip = [];
        let nonvip = [];

        for (const u of list) {
          let age = "";

          if (u.show_age && u.year) {
            age = ` - ${new Date().getFullYear() - u.year} ans`;
          }

          const line = `<@${u.user_id}>${age}`;

          if (u.is_vip) vip.push(line);
          else nonvip.push(line);
        }

        let message = "";

        message += `**${config?.title || "🎂 Anniversaires"}**\n\n`;

        message += `__${config?.vip_subtitle || "VIP"}__\n`;
        message += vip.length ? vip.join("\n") : "Aucun\n";

        message += `\n\n__${config?.nonvip_subtitle || "Membres"}__\n`;
        message += nonvip.length ? nonvip.join("\n") : "Aucun\n";

        if (config?.footer) {
          message += `\n\n${config.footer}`;
        }

        await interaction.channel.send(message);

        return interaction.reply({
          content: "✅ Liste envoyée",
          ephemeral: true
        });
      }

      // EDIT TEXT
      const map = {
        edit_title: "title",
        edit_vip: "vip_subtitle",
        edit_nonvip: "nonvip_subtitle",
        edit_footer: "footer",
        edit_bday_msg: "birthday_message",
        edit_vip_msg: "vip_message",
        edit_vip_button: "vip_button"
      };

      if (map[interaction.customId]) {
        return interaction.showModal(
          adminModal(interaction.customId, "Modifier")
        );
      }

      // SET CHANNEL
      if (interaction.customId === "set_channel") {
        await guildService.updateField(interaction.guild.id, "channel_id", interaction.channel.id);
        return interaction.reply({ content: "✅ Salon défini", ephemeral: true });
      }

      // SET ROLE
      if (interaction.customId === "set_role") {
        const role = interaction.member.roles.highest;
        await guildService.updateField(interaction.guild.id, "role_id", role.id);
        return interaction.reply({ content: "✅ Rôle défini", ephemeral: true });
      }

    }

    // MODALS
    if (interaction.isModalSubmit()) {

      if (interaction.customId === "birthdayModal") {

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

      const map = {
        edit_title: "title",
        edit_vip: "vip_subtitle",
        edit_nonvip: "nonvip_subtitle",
        edit_footer: "footer",
        edit_bday_msg: "birthday_message",
        edit_vip_msg: "vip_message",
        edit_vip_button: "vip_button"
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