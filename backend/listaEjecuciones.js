// listaEjecuciones.js
const { sql, poolPromise } = require("./db");

module.exports = async (req, res) => {
    try {
        const pool = await poolPromise;

        const query = `
            SELECT
                Id_Flujo,                -- ahora traemos el ID
                Titulo AS nombre,
                Descripcion AS detalle,
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

        const flujosLimpios = result.recordset.map(f => ({
            ...f,
            detalle: f.detalle ? f.detalle.replace(/<br\s*\/?>/gi, '\n') : '',
            instrucciones: f.instrucciones ? f.instrucciones.replace(/<br\s*\/?>/gi, '\n') : '',
            campos: f.campos ? f.campos.replace(/<br\s*\/?>/gi, '\n') : ''
        }));

        res.json({ success: true, flujos: flujosLimpios });

    } catch (err) {
        console.error("Error al obtener flujos:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};
