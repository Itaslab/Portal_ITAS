// logs.js
const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("./db");
 
// Devuelve el log de orquestación por Id_Tasklist
router.get("/:idTasklist", async (req, res) => {
  try {
    const idTasklist = parseInt(req.params.idTasklist, 10);
    if (Number.isNaN(idTasklist)) {
      return res.status(400).json({ success: false, error: "Id_Tasklist inválido" });
    }
 
    const pool = await poolPromise;
    const query = `
      SELECT Fecha_Hora, Detalle
      FROM a002103.RPA_LOG_ORQ_X_TASK
      WHERE Id_Tasklist = @Id_Tasklist
      ORDER BY Id_Log ASC
    `;
    const result = await pool
      .request()
      .input("Id_Tasklist", sql.Int, idTasklist)
      .query(query);
 
    return res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error("Error obteniendo logs:", error);
    return res.status(500).json({ success: false, error: "Error obteniendo logs" });
  }
});
 
module.exports = router;