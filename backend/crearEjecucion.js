const path = require("path");

// Esta es la ruta que se va a usar
const dbPath = path.join(__dirname, "../Portal_Itas.db");
console.log("DB path que se está usando:", dbPath);

const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
    if(err) console.error("Error al abrir DB:", err.message);
    else {
        console.log("DB abierta correctamente");

        // DEBUG: mostrar tablas visibles en la DB
        db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
            if(err) console.error(err);
            else console.log("Tablas visibles en la DB:", tables);
        });
    }
});

module.exports = (req, res) => {
    const { flujoSeleccionado, datos, tipoFlujo, prioridad, solicitante, identificador, estado, FHInicio } = req.body;

    const FlujoEjecutado = `${flujoSeleccionado}_${Date.now()}`; // nombre + timestamp

    const sql = `
    INSERT INTO ejecucionesRealizadas 
    (FlujoEjecutado, Solicitante, Identificador, FlujoSeleccionado, Estado, FHInicio, Prioridad, Datos) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(sql, [FlujoEjecutado, solicitante, identificador, flujoSeleccionado, estado, FHInicio, prioridad, datos], function(err){
        if(err){
            console.error(err);
            res.status(500).json({ success: false, error: err.message });
        } else {
            res.json({ success: true, id: this.lastID });
        }
    });
};

