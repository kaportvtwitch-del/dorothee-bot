process.on("uncaughtException", console.error);
process.on("unhandledRejection", console.error);

const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events,
  PermissionsBitField,
  REST,
  Routes,
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require("discord.js");

const sqlite3 = require("sqlite3").verbose();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

const db = new sqlite3.Database("./anniv.db");

// =======================
// DATABASE
// =======================

db.run(`CREATE TABLE IF NOT EXISTS anniversaires (guild TEXT, user TEXT, date TEXT)`);
db.run(`CREATE TABLE IF NOT EXISTS vip (guild TEXT, user TEXT)`);
db.run(`CREATE TABLE IF NOT EXISTS settings (
  guild TEXT PRIMARY KEY,
  titre TEXT,
  message TEXT,
  message_vip TEXT,
  bouton TEXT,
  panel TEXT,
  role TEXT
)`);

// =======================
// COMMANDES
// =======================

const commands = [
  new SlashCommandBuilder().setName("db_menu").setDescription("🎂 Menu"),
  new SlashCommandBuilder().setName("db_panel").setDescription("📨 Envoyer panel")
];

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

// =======================
// READY
// =======================

client.once("ready", async () => {
  console.log(`✅ Connecté : ${client.user.tag}`);

  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID),
    { body: commands }
  );

  console.log("✅ Commandes OK");

  setInterval(checkBirthdays, 60000);
});

// =======================
// INTERACTIONS
// =======================

client.on(Events.InteractionCreate, async (interaction) => {

  const guildId = interaction.guild?.id;

  try {

    if (interaction.isChatInputCommand()) {

      if (interaction.commandName === "db_menu") {

        await interaction.deferReply({ ephemeral: true });

        return interaction.editReply({
          content: "🎂 Menu Anniversaire",
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder().setCustomId("date").setLabel("🎂 Ma date").setStyle(ButtonStyle.Success),
              new ButtonBuilder().setCustomId("admin").setLabel("⚙️ Gestion").setStyle(ButtonStyle.Secondary),
              new ButtonBuilder().setCustomId("close").setLabel("❌").setStyle(ButtonStyle.Danger)
            )
          ]
        });
      }

      if (interaction.commandName === "db_panel") {

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
          return interaction.reply({ content: "❌ Admin uniquement", ephemeral: true });
        }

        db.get("SELECT * FROM settings WHERE guild=?", [guildId], (err, config) => {

          const bouton = config?.bouton || "🎂 Je participe";
          const panel = config?.panel || "🎉 Clique pour t'inscrire !";

          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("vip_date").setLabel(bouton).setStyle(ButtonStyle.Success)
          );

          interaction.reply({ content: "✅ Panel envoyé", ephemeral: true });

          interaction.channel.send({
            content: panel,
            components: [row]
          });
        });
      }
    }

    // =======================
    // BOUTONS
    // =======================

    if (interaction.isButton()) {

      if (interaction.customId === "close") {
        return interaction.update({ content: "❌ Fermé", components: [] });
      }

      // VIP CLICK
      if (interaction.customId === "vip_date") {

        db.run("INSERT OR IGNORE INTO vip VALUES (?, ?)", [guildId, interaction.user.id]);

        const modal = new ModalBuilder()
          .setCustomId("date_modal")
          .setTitle("🎂 Date JJ/MM/AAAA");

        const input = new TextInputBuilder()
          .setCustomId("date_input")
          .setLabel("Ex: 15/08/1998")
          .setStyle(TextInputStyle.Short);

        modal.addComponents(new ActionRowBuilder().addComponents(input));

        return interaction.showModal(modal);
      }

      if (interaction.customId === "date") {

        const modal = new ModalBuilder()
          .setCustomId("date_modal")
          .setTitle("🎂 Date JJ/MM/AAAA");

        const input = new TextInputBuilder()
          .setCustomId("date_input")
          .setLabel("Ex: 15/08/1998")
          .setStyle(TextInputStyle.Short);

        modal.addComponents(new ActionRowBuilder().addComponents(input));

        return interaction.showModal(modal);
      }

      // ADMIN
      if (interaction.customId === "admin") {

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
          return interaction.reply({ content: "❌ Admin uniquement", ephemeral: true });
        }

        return interaction.reply({
          content: "⚙️ Gestion",
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder().setCustomId("list").setLabel("📺 Liste").setStyle(ButtonStyle.Primary),
              new ButtonBuilder().setCustomId("title").setLabel("✏️ Titre").setStyle(ButtonStyle.Secondary),
              new ButtonBuilder().setCustomId("msg").setLabel("📝 Message").setStyle(ButtonStyle.Secondary),
              new ButtonBuilder().setCustomId("vipmsg").setLabel("💎 Message VIP").setStyle(ButtonStyle.Secondary),
              new ButtonBuilder().setCustomId("panel").setLabel("🧾 Panel").setStyle(ButtonStyle.Secondary),
              new ButtonBuilder().setCustomId("btn").setLabel("🔘 Bouton").setStyle(ButtonStyle.Secondary),
              new ButtonBuilder().setCustomId("role").setLabel("🎭 Rôle").setStyle(ButtonStyle.Secondary),
              new ButtonBuilder().setCustomId("close").setLabel("❌").setStyle(ButtonStyle.Danger)
            )
          ],
          ephemeral: true
        });
      }

      // LISTE
      if (interaction.customId === "list") {

        await interaction.deferReply({ ephemeral: true });

        db.all("SELECT * FROM anniversaires WHERE guild=?", [guildId], async (err, rows) => {

          db.all("SELECT user FROM vip WHERE guild=?", [guildId], async (err, vips) => {

            const vipIds = vips.map(v => v.user);

            let vipList = [];
            let normalList = [];

            for (const r of rows) {
              const line = `<@${r.user}> → ${r.date}`;

              if (vipIds.includes(r.user)) {
                vipList.push(`✨ ${line} ✨`);
              } else {
                normalList.push(line);
              }
            }

            db.get("SELECT message_vip FROM settings WHERE guild=?", [guildId], (err, config) => {

              const vipMsg = config?.message_vip || "💎 VIP DU JOUR 💎";

              const final =
                (vipList.length ? `${vipMsg}\n\n${vipList.join("\n")}\n\n` : "") +
                (normalList.length ? normalList.join("\n") : "📭 Vide");

              interaction.editReply(final);
            });
          });
        });
      }

      // MODALS
      const modalMap = {
        title: "Titre",
        msg: "Message",
        vipmsg: "Message VIP",
        panel: "Texte panel",
        btn: "Texte bouton",
        role: "ID rôle"
      };

      if (modalMap[interaction.customId]) {
        const modal = new ModalBuilder()
          .setCustomId(interaction.customId + "_modal")
          .setTitle(modalMap[interaction.customId]);

        const input = new TextInputBuilder()
          .setCustomId("input")
          .setLabel(modalMap[interaction.customId])
          .setStyle(TextInputStyle.Paragraph);

        modal.addComponents(new ActionRowBuilder().addComponents(input));

        return interaction.showModal(modal);
      }
    }

    // =======================
    // MODALS SAVE
    // =======================

    if (interaction.isModalSubmit()) {

      const value = interaction.fields.getTextInputValue("input");

      const map = {
        title_modal: "titre",
        msg_modal: "message",
        vipmsg_modal: "message_vip",
        panel_modal: "panel",
        btn_modal: "bouton",
        role_modal: "role"
      };

      if (interaction.customId === "date_modal") {
        db.run("INSERT OR REPLACE INTO anniversaires VALUES (?, ?, ?)", [guildId, interaction.user.id, value]);
        return interaction.reply({ content: "🎉 Date enregistrée", ephemeral: true });
      }

      const field = map[interaction.customId];

      if (field) {
        db.run(
          `INSERT INTO settings (guild, ${field}) VALUES (?, ?) 
           ON CONFLICT(guild) DO UPDATE SET ${field}=?`,
          [guildId, value, value]
        );
      }

      return interaction.reply({ content: "✅ Modifié", ephemeral: true });
    }

  } catch (err) {
    console.error(err);
  }
});

// =======================
// ANNIV AUTO
// =======================

async function checkBirthdays() {

  const today = new Date();
  const d = today.getDate();
  const m = today.getMonth() + 1;

  db.all("SELECT * FROM anniversaires", async (err, rows) => {

    for (const row of rows) {

      try {
        const guild = await client.guilds.fetch(row.guild);
        const member = await guild.members.fetch(row.user);

        db.get("SELECT role FROM settings WHERE guild=?", [row.guild], async (err, config) => {

          if (!config?.role) return;

          const role = guild.roles.cache.get(config.role);
          if (!role) return;

          const [dd, mm] = row.date.split("/");

          const isBirthday = parseInt(dd) === d && parseInt(mm) === m;

          if (isBirthday) {
            if (!member.roles.cache.has(role.id)) {
              await member.roles.add(role);
            }
          } else {
            if (member.roles.cache.has(role.id)) {
              await member.roles.remove(role);
            }
          }

        });

      } catch {}
    }
  });
}

client.login(process.env.DISCORD_TOKEN);
