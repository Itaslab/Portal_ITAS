const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("./db");
const schema = process.env.DB_SCHEMA;

// =============================
// OBTENER LICENCIAS POR MES
// =============================
router.get("/mes", async (req, res) => {

  const { year, month, grupo, subgrupo } = req.query;

  if (!year || !month) {
    return res.status(400).json({
      success: false,
      error: "Debe enviar year y month"
    });
  }

  try {

    const inicioMes = new Date(year, month - 1, 1);
    const finMes = new Date(year, month, 0);

    const pool = await poolPromise;

    const request = pool.request()
      .input("inicioMes", sql.Date, inicioMes)
      .input("finMes", sql.Date, finMes);

    let query = `
SELECT 
    l.ID_Usuario,
    u.Nombre,
    u.Apellido,
    CONVERT(varchar(10), l.Fecha_Desde, 23) AS Fecha_Desde,
    CONVERT(varchar(10), l.Fecha_Hasta, 23) AS Fecha_Hasta,
    l.TipoLic
      FROM ${schema}.LICENCIAS_SMART l
      INNER JOIN ${schema}.USUARIO u 
          ON u.ID_Usuario = l.ID_Usuario
    `;

    // JOIN grupo solo si viene grupo
    if (grupo) {
      request.input("grupo", sql.VarChar, grupo);

      query += `
        INNER JOIN ${schema}.USUARIO_GRUPO ug
          ON ug.ID_Usuario = u.ID_Usuario
        INNER JOIN ${schema}.GRUPO g
          ON g.ID_Grupo = ug.ID_Grupo
      `;
    }

    query += `
      WHERE l.Fecha_Desde <= @finMes
      AND l.Fecha_Hasta >= @inicioMes
    `;

    if (grupo) {
      query += ` AND g.Grupo = @grupo `;
    }

    if (grupo && subgrupo) {
      request.input("subgrupo", sql.VarChar, subgrupo);
      query += ` AND g.Subgrupo = @subgrupo `;
    }

    query += ` ORDER BY u.Apellido, u.Nombre`;

    const result = await request.query(query);

    res.json({
      success: true,
      data: result.recordset
    });

  } catch (err) {
    console.error("Error obteniendo licencias:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }

});

// =============================
// OBTENER SUBGRUPOS POR GRUPO
// =============================
router.get("/subgrupos", async (req, res) => {

  const { grupo } = req.query;

  if (!grupo) {
    return res.status(400).json({
      success: false,
      error: "Debe enviar grupo"
    });
  }

  try {

    const pool = await poolPromise;

    const result = await pool.request()
      .input("grupo", sql.VarChar, grupo)
      .query(`
        SELECT DISTINCT Subgrupo
        FROM ${schema}.GRUPO
        WHERE Grupo = @grupo
        ORDER BY Subgrupo
      `);

    res.json({
      success: true,
      data: result.recordset
    });

  } catch (err) {
    console.error("Error obteniendo subgrupos:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }

});

module.exports = router;