// db.js
const sql = require("mssql");

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    server: process.env.DB_HOST,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT || 1433),
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log(`✅ SQL conectado → ${process.env.DB_NAME}`);
        return pool;
    })
    .catch(err => {
        console.error("❌ Error SQL:", err);
        process.exit(1);
    });

module.exports = { sql, poolPromise };