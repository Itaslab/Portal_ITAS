const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("./db");

const schema = process.env.DB_SCHEMA;

router.get("/", async (req, res) => {

  try {

    const idUsuario = req.session.user.ID_Usuario;

    const pool = await poolPromise;

    const result = await pool.request()
      .input("idUsuario", sql.Int, idUsuario)
      .query(`
        SELECT 
          TipoLic,
          Fecha_Desde,
          Fecha_Hasta,
          Estado
        FROM ${schema}.LICENCIAS_SMART
        WHERE ID_Usuario = @idUsuario
        ORDER BY Fecha_Desde DESC
      `);

    res.json(result.recordset);

  } catch (error) {

    console.error("Error obteniendo licencias:", error);

    res.status(500).json({
      success:false,
      error:"Error obteniendo licencias"
    });

  }

});

module.exports = router;