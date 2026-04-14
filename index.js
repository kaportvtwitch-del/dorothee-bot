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

// DB
const db = new sqlite3.Database("/home/u585460519/data/anniv.db");

// TABLES
db.run(`CREATE TABLE IF NOT EXISTS anniversaires (guild TEXT, user TEXT, date TEXT)`);
db.run(`CREATE TABLE IF NOT EXISTS settings (guild TEXT PRIMARY KEY, titre TEXT, message TEXT, role TEXT)`);

// =======================
// COMMANDES
// =======================

const commands = [
  new SlashCommandBuilder().setName("db_menu").setDescription("🎂 Menu"),
  new SlashCommandBuilder().setName("db_panel").setDescription("📨 Envoyer le panel"),
  new SlashCommandBuilder().setName("db_reset").setDescription("🧹 Reset"),
  new SlashCommandBuilder().setName("db_role").setDescription("🎭 Définir rôle")
];

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

client.once("ready", async () => {
  console.log(`✅ Connecté : ${client.user.tag}`);

  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID),
    { body: commands }
  );

  console.log("✅ Commandes déployées");

  // CHECK ANNIV (toutes les minutes)
  setInterval(checkBirthdays, 60000);
});

// =======================
// MENU
// =======================

client.on(Events.InteractionCreate, async (interaction) => {

  const guildId = interaction.guild?.id;

  // =======================
  // COMMANDES
  // =======================

  if (interaction.isChatInputCommand()) {

    // MENU USER
    if (interaction.commandName === "db_menu") {

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("date").setLabel("🎂 Ma date").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("admin").setLabel("⚙️ Gestion").setStyle(ButtonStyle.Secondary)
      );

      return interaction.reply({
        content: "🎂 **Club Dorothée - Anniversaires 📺**",
        components: [row],
        ephemeral: true
      });
    }

    // PANEL (ADMIN)
    if (interaction.commandName === "db_panel") {

      if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return interaction.reply({ content: "❌ Admin uniquement", ephemeral: true });
      }

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("date").setLabel("🎂 Je m'inscris").setStyle(ButtonStyle.Success)
      );

      return interaction.channel.send({
        content: "🎉 Clique pour participer aux anniversaires !",
        components: [row]
      });
    }

    // RESET
    if (interaction.commandName === "db_reset") {

      if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return interaction.reply({ content: "❌ Admin uniquement", ephemeral: true });
      }

      db.run("DELETE FROM anniversaires WHERE guild=?", [guildId]);

      return interaction.reply({ content: "🧹 Reset OK", ephemeral: true });
    }

    // ROLE
    if (interaction.commandName === "db_role") {

      if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return interaction.reply({ content: "❌ Admin uniquement", ephemeral: true });
      }

      const role = interaction.options.getRole("role");

      db.run(
        "INSERT INTO settings (guild, role) VALUES (?, ?) ON CONFLICT(guild) DO UPDATE SET role=?",
        [guildId, role.id, role.id]
      );

      return interaction.reply({ content: "🎭 Rôle enregistré", ephemeral: true });
    }
  }

  // =======================
  // BOUTONS
  // =======================

  if (interaction.isButton()) {

    // DATE MODAL
    if (interaction.customId === "date") {

      const modal = new ModalBuilder()
        .setCustomId("date_modal")
        .setTitle("🎂 Ta date (JJ/MM/AAAA)");

      const input = new TextInputBuilder()
        .setCustomId("date_input")
        .setLabel("Ex: 15/08/1998")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(input));

      return interaction.showModal(modal);
    }

    // ADMIN MENU
    if (interaction.customId === "admin") {

      if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return interaction.reply({ content: "❌ Admin uniquement", ephemeral: true });
      }

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("title").setLabel("✏️ Titre").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("msg").setLabel("📝 Message").setStyle(ButtonStyle.Secondary)
      );

      return interaction.reply({
        content: "⚙️ Gestion du bot",
        components: [row],
        ephemeral: true
      });
    }

    // TITRE
    if (interaction.customId === "title") {

      const modal = new ModalBuilder().setCustomId("title_modal").setTitle("Modifier titre");

      const input = new TextInputBuilder()
        .setCustomId("title_input")
        .setLabel("Titre")
        .setStyle(TextInputStyle.Short);

      modal.addComponents(new ActionRowBuilder().addComponents(input));

      return interaction.showModal(modal);
    }

    // MESSAGE
    if (interaction.customId === "msg") {

      const modal = new ModalBuilder().setCustomId("msg_modal").setTitle("Modifier message");

      const input = new TextInputBuilder()
        .setCustomId("msg_input")
        .setLabel("Message")
        .setStyle(TextInputStyle.Paragraph);

      modal.addComponents(new ActionRowBuilder().addComponents(input));

      return interaction.showModal(modal);
    }
  }

  // =======================
  // MODALS
  // =======================

  if (interaction.isModalSubmit()) {

    const userId = interaction.user.id;

    // DATE
    if (interaction.customId === "date_modal") {

      const date = interaction.fields.getTextInputValue("date_input");

      db.run(
        "INSERT OR REPLACE INTO anniversaires (guild, user, date) VALUES (?, ?, ?)",
        [guildId, userId, date]
      );

      return interaction.reply({ content: "🎉 Date enregistrée !", ephemeral: true });
    }

    // TITRE
    if (interaction.customId === "title_modal") {

      const titre = interaction.fields.getTextInputValue("title_input");

      db.run(
        "INSERT INTO settings (guild, titre) VALUES (?, ?) ON CONFLICT(guild) DO UPDATE SET titre=?",
        [guildId, titre, titre]
      );

      return interaction.reply({ content: "✅ Titre modifié", ephemeral: true });
    }

    // MESSAGE
    if (interaction.customId === "msg_modal") {

      const msg = interaction.fields.getTextInputValue("msg_input");

      db.run(
        "INSERT INTO settings (guild, message) VALUES (?, ?) ON CONFLICT(guild) DO UPDATE SET message=?",
        [guildId, msg, msg]
      );

      return interaction.reply({ content: "✅ Message modifié", ephemeral: true });
    }
  }
});

// =======================
// CHECK ANNIVERSAIRES
// =======================

async function checkBirthdays() {

  const today = new Date();
  const todayStr = `${today.getDate()}/${today.getMonth() + 1}`;

  db.all("SELECT * FROM anniversaires", async (err, rows) => {

    for (const row of rows) {

      const [d, m, y] = row.date.split("/");

      if (`${d}/${m}` === todayStr) {

        const guild = await client.guilds.fetch(row.guild);
        const member = await guild.members.fetch(row.user);

        db.get("SELECT role FROM settings WHERE guild=?", [row.guild], async (err, config) => {

          if (!config?.role) return;

          const role = guild.roles.cache.get(config.role);
          if (!role) return;

          await member.roles.add(role);

          const age = new Date().getFullYear() - y;

          let bonus = "";
          if (age % 10 === 0) {
            bonus = `🎉 IL PASSE UNE DIZAINE (${age}) !!!`;
          }

          member.send(`🎂 Joyeux anniversaire ! ${bonus}`);
        });
      }
    }
  });
}

client.login(process.env.DISCORD_TOKEN);
