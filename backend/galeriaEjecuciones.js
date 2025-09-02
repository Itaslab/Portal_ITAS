// galeriaEjecuciones.js
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const dbPath = path.join(__dirname, "../Portal_Itas.db");

module.exports = (req, res) => {
  console.log("DB path que se está usando:", dbPath);

  const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
      console.error("Error al abrir DB:", err.message);
      return res.status(500).json({ success: false, error: "Error al abrir DB" });
    }
  });

  const sql = "SELECT * FROM ejecucionesRealizadas ORDER BY id DESC";

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("Error al consultar:", err.message);
      res.status(500).json({ success: false, error: err.message }); // 🔹 cambio aquí
    } else {
      // 🔹 Cambiado de res.json(rows) a res.json({ success: true, data: rows })
      res.json({ success: true, data: rows });
    }
  });

  db.close();
};
