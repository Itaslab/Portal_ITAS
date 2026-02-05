// galeriaEjecuciones_FiltroDato.js
const { sql, poolPromise } = require("./db");
const schema = process.env.DB_SCHEMA;

module.exports = async (req, res) => {
  try {
    const { texto } = req.query;

    // Validación básica
    if (!texto || texto.trim().length < 3) {
      return res.json({ success: true, data: [] });
    }

    const pool = await poolPromise;

    const query = `
      SELECT DISTINCT
        r.Id_Tasklist
      FROM ${schema}.RPA_RESULTADOS r
      WHERE r.Dato LIKE @texto
    `;

    const result = await pool
      .request()
      .input("texto", sql.VarChar, `%${texto}%`)
      .query(query);

    // Devolvemos solo un array de IDs
    const ids = result.recordset.map(row => row.Id_Tasklist);

    res.json({ success: true, data: ids });
  } catch (err) {
    console.error("Error al filtrar tasklist por dato:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};
