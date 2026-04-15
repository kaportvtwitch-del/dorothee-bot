const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = async (interaction) => {

  if (!interaction.member.permissions.has("Administrator")) {
    return interaction.reply({ content: "❌ Admin only", ephemeral: true });
  }

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("edit_title").setLabel("Titre").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("edit_vip").setLabel("VIP").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("edit_nonvip").setLabel("NON VIP").setStyle(ButtonStyle.Primary)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("edit_footer").setLabel("Footer").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("edit_bday_msg").setLabel("Message Anniv").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("edit_vip_msg").setLabel("Message VIP").setStyle(ButtonStyle.Secondary)
  );

  const row3 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("set_channel").setLabel("Salon Anniv").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("send_vip_msg").setLabel("Envoyer Msg VIP").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("set_role").setLabel("Rôle Anniv").setStyle(ButtonStyle.Success)
  );

  const row4 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("edit_vip_button").setLabel("Texte bouton VIP").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("send_week_list").setLabel("Envoyer Liste Semaine").setStyle(ButtonStyle.Primary)
  );

  await interaction.reply({
    content: "⚙️ Menu Admin",
    components: [row1, row2, row3, row4],
    ephemeral: true
  });
};