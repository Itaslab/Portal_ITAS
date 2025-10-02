const sql = require("mssql");

const config = {
    user: "a002103",
    password: "6uaE4aZS9hZf_",
    server: "10.4.48.173",   // ejemplo "192.168.0.105"
    port:1433,
    database: "OCTOPUSPROD",
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function testConnection() {
    try {
        const pool = await sql.connect(config);
        console.log("✅ Conexión exitosa a SQL Server");

        // probamos una query simple
        const result = await pool.request().query("SELECT 1 AS number");
        console.log("Resultado:", result.recordset);

        await pool.close();
    } catch (err) {
        console.error("❌ Error al conectar:", err);
    }
}

testConnection();