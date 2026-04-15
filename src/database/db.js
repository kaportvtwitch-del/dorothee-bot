const mysql = require("mysql2/promise");

module.exports = mysql.createPool({
  host: "127.0.0.1", // 🔥 IMPORTANT (force IPv4)
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
});