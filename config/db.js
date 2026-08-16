const mysql = require("mysql2");

const db = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,

    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// Test connection
db.getConnection((err, connection) => {

    if (err) {
        console.error("MySQL Connection Error:", err);
        return;
    }

    console.log("MySQL Connected Successfully");

    connection.release();
});

module.exports = db;