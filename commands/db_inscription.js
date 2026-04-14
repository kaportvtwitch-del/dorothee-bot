const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType
} = require("discord.js");

module.exports = {
  data: {
    name: "db_inscription"
  },

  async execute(interaction) {

    const jours = Array.from({ length: 31 }, (_, i) => ({
      label: `${i + 1}`,
      value: `${i + 1}`
    }));

    const mois = [
      { label: "Janvier", value: "01" },
      { label: "Février", value: "02" },
      { label: "Mars", value: "03" },
      { label: "Avril", value: "04" },
      { label: "Mai", value: "05" },
      { label: "Juin", value: "06" },
      { label: "Juillet", value: "07" },
      { label: "Août", value: "08" },
      { label: "Septembre", value: "09" },
      { label: "Octobre", value: "10" },
      { label: "Novembre", value: "11" },
      { label: "Décembre", value: "12" }
    ];

    const annees = Array.from({ length: 60 }, (_, i) => {
      const year = new Date().getFullYear() - i;
      return { label: `${year}`, value: `${year}` };
    });

    const rowJour = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("birth_day")
        .setPlaceholder("Jour")
        .addOptions(jours)
    );

    const rowMois = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("birth_month")
        .setPlaceholder("Mois")
        .addOptions(mois)
    );

    const rowAnnee = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("birth_year")
        .setPlaceholder("Année")
        .addOptions(annees)
    );

    const rowAge = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("toggle_age")
        .setLabel("Afficher mon âge : ON/OFF")
        .setStyle(ButtonStyle.Secondary)
    );

    const rowSave = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("save_birth")
        .setLabel("Enregistrer")
        .setStyle(ButtonStyle.Success)
    );

    return interaction.reply({
      content: "📅 Choisis ta date d'anniversaire :",
      components: [rowJour, rowMois, rowAnnee, rowAge, rowSave],
      ephemeral: true
    });
  }
};
