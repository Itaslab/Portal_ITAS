// Endpoint para traer usuarios base (de a002103.USUARIO)
router.get('/usuarios_base', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT Legajo, Nombre, Apellido, Email FROM a002103.USUARIO ORDER BY Apellido, Nombre
    `);
    res.json({ success: true, usuarios: result.recordset });
  } catch (error) {
    console.error('Error al obtener usuarios base:', error);
    res.status(500).json({ success: false, mensaje: 'Error interno', error: error.message });
  }
});
// Ejemplo: appOrdenesSF_AltaUsuario.js
const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("./db");

router.post("/usuariosordenes", async (req, res) => {
  const { Nombre, Apellido, Grupo, Grupo_BKP, Modo, MaxPorTrabajar, HoraDe, HoraA } = req.body;

  try {
    const pool = await poolPromise;
    await pool.request()
      .input("Nombre", sql.VarChar, Nombre)
      .input("Apellido", sql.VarChar, Apellido)
      .input("Grupo", sql.VarChar, Grupo)
      .input("Grupo_BKP", sql.VarChar, Grupo_BKP)
      .input("Modo", sql.VarChar, Modo)
      .input("MaxPorTrabajar", sql.Int, MaxPorTrabajar)
      .input("HoraDe", sql.Time, HoraDe)
      .input("HoraA", sql.Time, HoraA)
      .query(`
        INSERT INTO a002103.APP_ORDENES_USR
        (Nombre, Apellido, Grupo, Grupo2, Modo, Max_Por_Trabajar, Hora_De, Hora_A)
        VALUES (@Nombre, @Apellido, @Grupo, @Grupo_BKP, @Modo, @MaxPorTrabajar, @HoraDe, @HoraA)
      `);

    res.json({ mensaje: "Usuario de orden creado correctamente." });
  } catch (error) {
    console.error("Error al crear usuario de orden:", error);
    res.status(500).json({ mensaje: "Error interno del servidor." });
  }
});

module.exports = router;
