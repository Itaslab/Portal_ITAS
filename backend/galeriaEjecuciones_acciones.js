const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("./db");

// Ruta para cancelar tarea
router.post("/cancelar", async (req, res) => {
  try {
    const { idTasklist, mail } = req.body;

    if (!idTasklist || !mail) {
      return res.status(400).json({ success: false, error: "Faltan parámetros" });
    }

    const pool = await poolPromise;

    await pool
      .request()
      .input("Id_Tasklist", sql.Int, idTasklist)
      .input("mail", sql.VarChar, mail)
      .execute("a002103.PortalRPABotonCancelarTarea");

    res.json({ success: true, message: "Tarea cancelada correctamente" });

  } catch (error) {
    console.error("Error ejecutando SP:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
