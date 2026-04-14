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
// DB
// =======================

db.run(`CREATE TABLE IF NOT EXISTS anniversaires (guild TEXT, user TEXT, date TEXT)`);
db.run(`CREATE TABLE IF NOT EXISTS vip (guild TEXT, user TEXT)`);
db.run(`CREATE TABLE IF NOT EXISTS settings (
  guild TEXT PRIMARY KEY,
  titre TEXT,
  message TEXT,
  message_vip TEXT,
  panel TEXT,
  bouton TEXT,
  role TEXT
)`);

// =======================
// COMMANDES
// =======================

const commands = [
  new SlashCommandBuilder().setName("db_menu").setDescription("🎂 Menu anniversaire"),
  new SlashCommandBuilder().setName("db_panel").setDescription("📨 Envoyer panel")
];

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

client.once("ready", async () => {
  console.log(`✅ ${client.user.tag}`);

  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID),
    { body: commands }
  );

  setInterval(checkBirthdays, 60000);
});

// =======================
// INTERACTIONS
// =======================

client.on(Events.InteractionCreate, async (interaction) => {

  const guildId = interaction.guild?.id;

  try {

    // =======================
    // COMMANDES
    // =======================

    if (interaction.isChatInputCommand()) {

      if (interaction.commandName === "db_menu") {
        return interaction.reply({
          content: "🎂 Menu",
          ephemeral: true,
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder().setCustomId("date").setLabel("🎂 Ma date").setStyle(ButtonStyle.Success),
              new ButtonBuilder().setCustomId("admin").setLabel("⚙️ Gestion").setStyle(ButtonStyle.Secondary)
            )
          ]
        });
      }

      if (interaction.commandName === "db_panel") {

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
          return interaction.reply({ content: "❌ Admin uniquement", ephemeral: true });
        }

        db.get("SELECT * FROM settings WHERE guild=?", [guildId], (err, config) => {

          const text = config?.panel || "🎉 Clique pour t'inscrire";
          const btn = config?.bouton || "🎂 Participer";

          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("vip").setLabel(btn).setStyle(ButtonStyle.Success)
          );

          interaction.reply({ content: "✅ Panel envoyé", ephemeral: true });

          interaction.channel.send({
            content: text,
            components: [row]
          });
        });
      }
    }

    // =======================
    // BOUTONS
    // =======================

    if (interaction.isButton()) {

      // DATE
      if (interaction.customId === "date" || interaction.customId === "vip") {

        if (interaction.customId === "vip") {
          db.run("INSERT OR IGNORE INTO vip VALUES (?, ?)", [guildId, interaction.user.id]);
        }

        const modal = new ModalBuilder()
          .setCustomId("date_modal")
          .setTitle("🎂 Date JJ/MM/AAAA");

        const input = new TextInputBuilder()
          .setCustomId("input")
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
          ephemeral: true,
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder().setCustomId("list").setLabel("📺 Liste").setStyle(ButtonStyle.Primary),
              new ButtonBuilder().setCustomId("title").setLabel("✏️ Titre"),
              new ButtonBuilder().setCustomId("msg").setLabel("📝 Message"),
              new ButtonBuilder().setCustomId("vipmsg").setLabel("💎 VIP"),
              new ButtonBuilder().setCustomId("panel").setLabel("🧾 Panel"),
              new ButtonBuilder().setCustomId("btn").setLabel("🔘 Bouton"),
              new ButtonBuilder().setCustomId("role").setLabel("🎭 Rôle")
            )
          ]
        });
      }

      // LISTE
      if (interaction.customId === "list") {

        return interaction.reply({ content: "⏳ Chargement...", ephemeral: true }).then(() => {

          db.all("SELECT * FROM anniversaires WHERE guild=?", [guildId], (err, rows) => {

            db.all("SELECT user FROM vip WHERE guild=?", [guildId], (err, vips) => {

              const vipIds = vips.map(v => v.user);

              let vipList = [];
              let normal = [];

              rows.forEach(r => {
                const line = `<@${r.user}> → ${r.date}`;

                if (vipIds.includes(r.user)) {
                  vipList.push(`✨ ${line} ✨`);
                } else {
                  normal.push(line);
                }
              });

              db.get("SELECT message_vip FROM settings WHERE guild=?", [guildId], (err, config) => {

                const vipMsg = config?.message_vip || "💎 VIP 💎";

                const final =
                  (vipList.length ? `${vipMsg}\n\n${vipList.join("\n")}\n\n` : "") +
                  (normal.length ? normal.join("\n") : "📭 Vide");

                interaction.editReply(final);
              });
            });
          });
        });
      }

      // MODALS ADMIN
      const modals = ["title", "msg", "vipmsg", "panel", "btn", "role"];

      if (modals.includes(interaction.customId)) {

        const modal = new ModalBuilder()
          .setCustomId(interaction.customId + "_modal")
          .setTitle("Modifier");

        const input = new TextInputBuilder()
          .setCustomId("input")
          .setLabel("Valeur")
          .setStyle(TextInputStyle.Paragraph);

        modal.addComponents(new ActionRowBuilder().addComponents(input));

        return interaction.showModal(modal);
      }
    }

    // =======================
    // MODALS
    // =======================

    if (interaction.isModalSubmit()) {

      const value = interaction.fields.getTextInputValue("input");

      await interaction.deferReply({ ephemeral: true });

      if (interaction.customId === "date_modal") {

        db.run(
          "INSERT OR REPLACE INTO anniversaires VALUES (?, ?, ?)",
          [guildId, interaction.user.id, value],
          () => interaction.editReply("🎉 Enregistré !")
        );

        return;
      }

      const map = {
        title_modal: "titre",
        msg_modal: "message",
        vipmsg_modal: "message_vip",
        panel_modal: "panel",
        btn_modal: "bouton",
        role_modal: "role"
      };

      const field = map[interaction.customId];

      if (field) {
        db.run(
          `INSERT INTO settings (guild, ${field}) VALUES (?, ?) 
           ON CONFLICT(guild) DO UPDATE SET ${field}=?`,
          [guildId, value, value],
          () => interaction.editReply("✅ Modifié")
        );
      }
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
            await member.roles.add(role);
          } else {
            await member.roles.remove(role).catch(() => {});
          }

        });

      } catch {}
    }
  });
}

client.login(process.env.DISCORD_TOKEN);
