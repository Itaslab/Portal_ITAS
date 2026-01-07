
// galeriaEjecuciones_acciones.js
const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("./db");
const schema = process.env.DB_SCHEMA;


// 🔥 Función genérica para ejecutar SP
async function ejecutarSP(nombreSP, idTasklist, idUsuario) {
  const pool = await poolPromise;

  let mensajes = [];

  const request = pool.request()
    .input("Id_Tasklist", sql.Int, idTasklist)
    .input("id_usuario", sql.Int, idUsuario);

  // 👂 Escuchamos mensajes del SQL (PRINT / RAISERROR < 11)
  request.on("info", info => {
    mensajes.push(info.message);
  });

  const result = await request.execute(nombreSP);

  return {
    result,
    mensajes
  };
}

// --------------------- ENDPOINTS ----------------------

// CANCELAR
router.post("/cancelar", async (req, res) => {
  const { idTasklist, idUsuario } = req.body;

  try {
    const { mensajes } = await ejecutarSP(
      `${schema}.PortalRPABotonCancelarTarea`,
      idTasklist,
      idUsuario
    );

    res.json({
      success: true,
      message: mensajes.length
        ? mensajes.join(" | ")
        : "Tarea cancelada correctamente"
    });

  } catch (err) {
    console.error("Error cancelar tarea:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});



// PAUSAR
router.post("/pausar", async (req, res) => {
  const { idTasklist, idUsuario } = req.body;

  try {
    const { mensajes } = await ejecutarSP(
      `${schema}.PortalRPABotonPausarTarea`,
      idTasklist,
      idUsuario
    );

    res.json({
      success: true,
      message: mensajes.length ? mensajes.join(" | ") : "Tarea pausada correctamente"
    });

  } catch (err) {
    console.error("Error pausar tarea:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// REANUDAR
router.post("/reanudar", async (req, res) => {
  const { idTasklist, idUsuario } = req.body;

  try {
    const { mensajes } = await ejecutarSP(
      `${schema}.PortalRPABotonReanudarTarea`,
      idTasklist,
      idUsuario
    );

    res.json({
      success: true,
      message: mensajes.length
        ? mensajes.join(" | ")
        : "Tarea reanudada correctamente"
    });

  } catch (err) {
    console.error("Error reanudar tarea:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// REENVIAR TODO
router.post("/reenviar-todo", async (req, res) => {
  const { idTasklist, idUsuario } = req.body;

  try {
    const { mensajes } = await ejecutarSP(
      `${schema}.PortalRPABotonReenviarTodo`,
      idTasklist,
      idUsuario
    );

    res.json({
      success: true,
      message: mensajes.length
        ? mensajes.join(" | ")
        : "Reenvío total ejecutado"
    });

  } catch (err) {
    console.error("Error reenviar todo:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// REENVIAR FALLIDOS
router.post("/reenviar-fallidos", async (req, res) => {
  const { idTasklist, idUsuario } = req.body;

  try {
    const { mensajes } = await ejecutarSP(
      `${schema}.PortalRPABotonReenviarFallidos`,
      idTasklist,
      idUsuario
    );

    res.json({
      success: true,
      message: mensajes.length
        ? mensajes.join(" | ")
        : "Reenvío de fallidos ejecutado"
    });

  } catch (err) {
    console.error("Error reenviar fallidos:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

module.exports = router;
