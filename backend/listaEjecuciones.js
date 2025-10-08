// listaEjecuciones.js
const { sql, poolPromise } = require("./db");

module.exports = async (req, res) => {
    try {
        const pool = await poolPromise;

        const query = `
            SELECT
                nombreFlujo AS nombre,
                descripcion AS detalle,
                instrucciones AS instrucciones,
                campos AS campos,
                tipoFlujo AS flujoTipo,
                prioridad AS prio,
                subTipoFlujo AS subTipoFlujo,
                intentosAutomaticos AS intentos,
                cantPorLote AS cantidad
            FROM flujos
        `;

        const result = await pool.request().query(query);

        res.json({ success: true, flujos: result.recordset });

    } catch (err) {
        console.error("Error al obtener flujos:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};

