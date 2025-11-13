// appOrdenesSF_galeriaBajadas.js
const { sql, poolPromise } = require("./db");

module.exports = async (req, res) => {
  try {
    const pool = await poolPromise;

    const query = `
      SELECT 
        ID,
        Nombre,
        Descripcion,
        Negocio,
        Delay,
        Esquema_JSON,
        Script,
        ISNULL(CONVERT(VARCHAR(10), Vigencia_Desde, 120), '') AS Vigencia_Desde,
        ISNULL(CONVERT(VARCHAR(10), Vigencia_Hasta, 120), '') AS Vigencia_Hasta,
        Activo
      FROM a002103.APP_ORDENES_BAJADA
      ORDER BY Nombre;
    `;

    const result = await pool.request().query(query);

    const bajadas = result.recordset.map(b => ({
      id: b.ID,
      nombre: b.Nombre,
      descripcion: b.Descripcion,
      negocio: b.Negocio,
      delay: b.Delay,
      esquema: b.Esquema_JSON,
      script: b.Script,
      vigencia_desde: b.Vigencia_Desde,
      vigencia_hasta: b.Vigencia_Hasta,
      activo: b.Activo
    }));

    res.json({ success: true, bajadas });
  } catch (err) {
    console.error("Error al obtener bajadas:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};