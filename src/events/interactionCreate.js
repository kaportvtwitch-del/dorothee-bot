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

  // INTERACTIONS
  client.on("interactionCreate", async (interaction) => {

    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === "dbmenu") {
        return dbmenu.execute(interaction);
      }
    }

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

        return interaction.reply({ content: "✅ Message VIP envoyé", ephemeral: true });
      }

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

        let message = `**${config?.title || "🎂 Anniversaires"}**\n\n`;

        message += `__${config?.vip_subtitle || "VIP"}__\n`;
        message += vip.length ? vip.join("\n") : "Aucun\n";

        message += `\n\n__${config?.nonvip_subtitle || "Membres"}__\n`;
        message += nonvip.length ? nonvip.join("\n") : "Aucun\n";

        if (config?.footer) message += `\n\n${config.footer}`;

        await interaction.channel.send(message);

        return interaction.reply({ content: "✅ Liste envoyée", ephemeral: true });
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
        return interaction.showModal(adminModal(interaction.customId, "Modifier"));
      }
    }

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
          [interaction.user.id, interaction.guild.id, day, month, year, day, month, year]
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

        await guildService.updateField(interaction.guild.id, map[interaction.customId], value);

        return interaction.reply({ content: "✅ Modifié", ephemeral: true });
      }
    }

  });

  // 💬 COMMANDES TEXTE ADMIN
  client.on("messageCreate", async (message) => {

    if (!message.guild) return;
    if (!message.member.permissions.has("Administrator")) return;

    const content = message.content;

    // ROLE
    if (content.startsWith("role ")) {

      const role = message.mentions.roles.first();

      if (!role) return message.reply("❌ Mentionne un rôle");

      await guildService.updateField(message.guild.id, "role_id", role.id);

      return message.reply("✅ Rôle anniversaire défini");
    }

    // CHANNEL
    if (content.startsWith("channel ")) {

      const channel = message.mentions.channels.first();

      if (!channel) return message.reply("❌ Mentionne un salon");

      await guildService.updateField(message.guild.id, "channel_id", channel.id);

      return message.reply("✅ Salon défini");
    }

  });

};