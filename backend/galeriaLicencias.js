//galeriaLicencias.js


const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("./db");
const schema = process.env.DB_SCHEMA;


// --------------------- OBTENER LICENCIAS POR MES ----------------------

router.get("/mes", async (req, res) => {

  const { year, month, grupo } = req.query;

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
          l.Fecha_Desde,
          l.Fecha_Hasta,
          l.TipoLic
      FROM ${schema}.LICENCIAS_SMART l
      INNER JOIN ${schema}.USUARIO u 
          ON u.ID_Usuario = l.ID_Usuario
      WHERE l.Fecha_Desde <= @finMes
      AND l.Fecha_Hasta >= @inicioMes
    `;

    if (grupo) {
      request.input("grupo", sql.VarChar, grupo);
      query += ` AND u.Grupo = @grupo `;
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

module.exports = router;