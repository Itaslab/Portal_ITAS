// galeriaEjecuciones.js
const { sql, poolPromise } = require("./db");

module.exports = async (req, res) => {
    try {
        const pool = await poolPromise;

        const query = `
            SELECT * 
            FROM ejecucionesRealizadas
            ORDER BY id DESC
        `;

        const result = await pool.request().query(query);

        // Enviar resultado en el mismo formato que antes
        res.json({ success: true, data: result.recordset });

    } catch (err) {
        console.error("Error al consultar ejecucionesRealizadas:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};

