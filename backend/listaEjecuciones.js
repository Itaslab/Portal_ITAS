// listaEjecuciones.js
const { sql, poolPromise } = require("./db");

module.exports = async (req, res) => {
    try {
        const pool = await poolPromise;

        const query = `
            SELECT
                Titulo AS nombreFlujo,  
                Descripcion AS descripcion,
                Instrucciones AS instrucciones,
                Campos AS campos,
                Tipo_De_Flujo AS  tipoFlujo,
                Prioridad AS prioridad,
                SubTipo_De_Flujo AS subTipoFlujo,
                Intentos_Automaticos AS intentosAutomaticos,
                Cant_Por_Lote AS cantPorLote
            FROM a002103.RPA_FLUJOS;
        `;

        const result = await pool.request().query(query);

        res.json({ success: true, flujos: result.recordset });

    } catch (err) {
        console.error("Error al obtener flujos:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};

