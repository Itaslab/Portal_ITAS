const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "Portal_Itas.db");
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Crear tabla de ejemplo
  db.run(`CREATE TABLE IF NOT EXISTS ejecucionesRealizadas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    Solicitante TEXT,
    FHInicio TEXT,
    FlujoEjecutado TEXT,
    Estado TEXT
  )`);

  // Insertar datos de prueba
  db.run(`INSERT INTO ejecucionesRealizadas (Solicitante, FHInicio, FlujoEjecutado, Estado)
          VALUES
          ('Juan', '2025-08-21', 'SF_Cancelar_xMQ', 'Completada'),
          ('Maria', '2025-08-21', 'SF_Cancelar_xMQ', 'En proceso')`);
});

db.close(() => {
  console.log("Base de datos creada con datos de prueba ✅");
});