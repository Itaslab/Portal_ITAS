const { sql, poolPromise } = require("./db");
const schema = process.env.DB_SCHEMA;


module.exports = async (req, res) => {
  try {
    const pool = await poolPromise;

    const query = `
      SELECT 
        Nombre,
        Negocio,
        Script,
        Esquema_JSON,
        Activo
      FROM ${schema}.APP_ORDENES_BAJADA
      ORDER BY Nombre;
    `;

    const result = await pool.request().query(query);

    const bajadas = result.recordset.map(b => ({
      nombre: b.Nombre,
      negocio: b.Negocio,
      script: b.Script,
      esquema: b.Esquema_JSON,
      activo: b.Activo
    }));

    res.json({ success: true, bajadas });
  } catch (err) {
    console.error("Error al obtener bajadas:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};