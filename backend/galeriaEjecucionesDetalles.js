// galeriaEjecucionesDetalles.js 

const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("./db");

// Ruta para el botón OJO
router.get("/detalle/:id", async (req, res) => {
  try {
    const idTasklist = req.params.id;
    const pool = await poolPromise;

    const query = `
        SELECT 
            r.Dato,
            r.Accion,
            r.Resultado,
            rf.Campos,
            rf.Campos_Accion,
            rf.Campos_Resultado,
            r.Ok
        FROM a002103.RPA_RESULTADOS r
        INNER JOIN a002103.RPA_TASKLIST t ON r.Id_Tasklist = t.Id_Tasklist
        INNER JOIN a002103.RPA_FLUJOS rf ON t.Id_Flujo = rf.Id_Flujo
        WHERE t.Id_Tasklist = @idTasklist
    `;

    const result = await pool
      .request()
      .input("idTasklist", sql.Int, idTasklist)
      .query(query);

    res.json(result.recordset);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo datos" });
  }
});

module.exports = router;
