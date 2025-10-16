// listaEjecuciones.js
const { sql, poolPromise } = require("./db");

module.exports = async (req, res) => {
    try {
        const pool = await poolPromise;

        const query = `
    SELECT
        Titulo AS nombre,        -- dropdown.value = f.nombre
        Descripcion AS detalle,  -- textarea detalle = f.detalle
        Instrucciones AS instrucciones,
        Campos AS campos,
        Tipo_De_Flujo AS flujoTipo,
        Prioridad AS prio,
        SubTipo_De_Flujo AS subTipoFlujo,
        Intentos_Automaticos AS intentos,
        Cant_Por_Lote AS cantidad
    FROM a002103.RPA_FLUJOS;
        `;

        const result = await pool.request().query(query);

        res.json({ success: true, flujos: result.recordset });

    } catch (err) {
        console.error("Error al obtener flujos:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};

