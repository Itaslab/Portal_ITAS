// db.js
const sql = require("mssql");

// Configuración de SQL Server
const config = {
    user: "a002103",
    password: "6uaE4aZS9hZf_",
    server: "10.4.48.173",   // Ejemplo: "192.168.1.50"
    database: "OCTOPUSPROD",
    port: 1433,
    options: {
        encrypt: false, // true si usás Azure
        trustServerCertificate: true // necesario si no tenés certificado SSL
    }
};

// Creamos un pool de conexiones
const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log("✅ Conectado a SQL Server");
        return pool;
    })
    .catch(err => {
        console.error("❌ Error al conectar a SQL Server:", err);
        throw err;
    });

module.exports = { sql, poolPromise };