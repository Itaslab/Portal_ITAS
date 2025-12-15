
// galeriaEjecuciones_acciones.js
const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("./db");

// 🔥 Función genérica para ejecutar SP
async function ejecutarSP(nombreSP, idTasklist, idUsuario) {
  const pool = await poolPromise;

  const result = await pool.request()
    .input("Id_Tasklist", sql.Int, idTasklist)
    .input("id_usuario", sql.Int, idUsuario)
    .execute(nombreSP);

  return result;
}

// --------------------- ENDPOINTS ----------------------

// CANCELAR
router.post("/cancelar", async (req, res) => {
  const { idTasklist, idUsuario } = req.body;

  console.log("🔥 RECIBIDO:", { idTasklist, idUsuario });


  try {
    await ejecutarSP("a002103.PortalRPABotonCancelarTarea", idTasklist, idUsuario);
    res.json({ success: true, message: "Tarea cancelada correctamente" });
  } catch (err) {
   console.error("Error cancelar tarea:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});



// PAUSAR
router.post("/pausar", async (req, res) => {
  const { idTasklist, idUsuario } = req.body;

  try {
    await ejecutarSP("a002103.PortalRPABotonPausarTarea", idTasklist, idUsuario);
    res.json({ success: true, message: "Tarea pausada correctamente" });
  } catch (err) {
    console.error("Error pausar tarea:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// REANUDAR
router.post("/reanudar", async (req, res) => {
  const { idTasklist, idUsuario } = req.body;

  try {
    await ejecutarSP("a002103.PortalRPABotonReanudarTarea", idTasklist, idUsuario);
    res.json({ success: true, message: "Tarea reanudada correctamente" });
  } catch (err) {
    console.error("Error reanudar tarea:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// REENVIAR TODO
router.post("/reenviar-todo", async (req, res) => {
  const { idTasklist, idUsuario } = req.body;

  try {
    await ejecutarSP("a002103.PortalRPABotonReenviarTodo", idTasklist, idUsuario);
    res.json({ success: true, message: "Reenvío total ejecutado" });
  } catch (err) {
    console.error("Error reenviar todo:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// REENVIAR FALLIDOS
router.post("/reenviar-fallidos", async (req, res) => {
  const { idTasklist, idUsuario } = req.body;

  try {
    await ejecutarSP("a002103.PortalRPABotonReenviarFallidos", idTasklist, idUsuario);
    res.json({ success: true, message: "Reenvío de fallidos ejecutado" });
  } catch (err) {
    console.error("Error reenviar fallidos:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
