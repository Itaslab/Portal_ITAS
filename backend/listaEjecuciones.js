// listaEjecuciones.js
const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("../Portal_Itas.db", sqlite3.OPEN_READWRITE, (err) => {
    if (err) console.error("Error al abrir la DB:", err.message);
    else console.log("Conectado a la base de datos Flujos");
});

module.exports = (req, res) => {
    const sql = `
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
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, error: "Error al obtener flujos" });
        }
        res.json({ success: true, flujos: rows });
    });
};
