const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const db = require('../database/db');

/* ================= TEMP STORAGE ================= */

const temp = {};

/* ================= CREATE SELECT ================= */

function createSelect(id, placeholder, options) {
  return new StringSelectMenuBuilder()
    .setCustomId(id)
    .setPlaceholder(placeholder)
    .addOptions(options);
}

/* ================= HANDLER ================= */

async function handleButtons(interaction) {

  const id = interaction.customId;
  const userId = interaction.user.id;
  const guildId = interaction.guild.id;

  /* ================= START CALENDAR ================= */

  if (id === 'birthday_choice') {

    temp[userId] = {
      day: null,
      month: null,
      year: null,
      show_age: true
    };

    const days = Array.from({ length: 31 }, (_, i) => ({
      label: `${i + 1}`,
      value: `${i + 1}`
    }));

    const months = [
      "Janvier","Février","Mars","Avril","Mai","Juin",
      "Juillet","Août","Septembre","Octobre","Novembre","Décembre"
    ].map((m, i) => ({
      label: m,
      value: `${i + 1}`
    }));

    const years = Array.from({ length: 80 }, (_, i) => {
      const y = new Date().getFullYear() - i;
      return { label: `${y}`, value: `${y}` };
    });

    return interaction.reply({
      content: "🎂 **Choisis ta date**",
      components: [
        new ActionRowBuilder().addComponents(createSelect('day', 'Jour', days)),
        new ActionRowBuilder().addComponents(createSelect('month', 'Mois', months)),
        new ActionRowBuilder().addComponents(createSelect('year', 'Année', years)),
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('toggle_age')
            .setLabel('👁️ Afficher mon âge : OUI')
            .setStyle(ButtonStyle.Success)
        ),
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('validate_date')
            .setLabel('✅ Valider')
            .setStyle(ButtonStyle.Primary)
        )
      ],
      flags: 64
    });
  }

  /* ================= TOGGLE AGE ================= */

  if (id === 'toggle_age') {

    const data = temp[userId];
    if (!data) return;

    data.show_age = !data.show_age;

    return interaction.update({
      content: "🎂 **Choisis ta date**",
      components: interaction.message.components.map(row =>
        new ActionRowBuilder().addComponents(
          row.components.map(comp => {
            if (comp.data.custom_id === 'toggle_age') {
              return ButtonBuilder.from(comp)
                .setLabel(`👁️ Afficher mon âge : ${data.show_age ? 'OUI' : 'NON'}`)
                .setStyle(data.show_age ? ButtonStyle.Success : ButtonStyle.Secondary);
            }
            return comp;
          })
        )
      )
    });
  }

  /* ================= VALIDATE ================= */

  if (id === 'validate_date') {

    const data = temp[userId];

    if (!data || !data.day || !data.month || !data.year) {
      return interaction.reply({
        content: "❌ Date incomplète",
        flags: 64
      });
    }

    const formatted = `${data.year}-${data.month.padStart(2,'0')}-${data.day.padStart(2,'0')}`;

    db.upsertUser(userId, guildId, {
      birthday: formatted,
      show_age: data.show_age ? 1 : 0
    });

    delete temp[userId];

    return interaction.reply({
      content: "✅ Date enregistrée avec succès !",
      flags: 64
    });
  }

  /* ================= DELETE ================= */

  if (id === 'delete_birthday') {

    db.upsertUser(userId, guildId, {
      birthday: null
    });

    return interaction.reply({
      content: "🗑️ Date supprimée",
      flags: 64
    });
  }

  /* ================= GESTION ================= */

  if (id === 'gestion') {
    return interaction.reply({
      content: "⚙️ Menu admin bientôt dispo",
      flags: 64
    });
  }
}

/* ✅ EXPORT OBLIGATOIRE (FIX CRASH) */
module.exports = { handleButtons, temp };
