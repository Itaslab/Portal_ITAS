const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Ajustá la ruta a donde está tu archivo .db
const dbPath = path.join(__dirname, "../Portal_Itas.db");

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
    if (err) return console.error("Error al abrir DB:", err.message);
    console.log("DB abierta correctamente");

    // Listar todas las tablas
    db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
        if (err) console.error(err);
        else console.log("Tablas visibles en la DB:", tables);
    });

    // Verificar si existe ejecucionesRealizadas
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='ejecucionesRealizadas'", [], (err, row) => {
        if (err) console.error(err);
        else if (row) console.log("La tabla 'ejecucionesRealizadas' existe ✅");
        else console.log("La tabla 'ejecucionesRealizadas' NO se encuentra ❌");
    });
});