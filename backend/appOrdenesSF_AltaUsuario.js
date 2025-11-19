const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("./db");

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

router.post("/usuariosordenes", async (req, res) => {
  const { Nombre, Apellido, Grupo, Grupo_BKP, Modo, MaxPorTrabajar, HoraDe, HoraA, SF_UserID, Asc_desc, Script } = req.body;

  // Validación básica de entrada para evitar 500 por datos inválidos
  const faltantes = [];
  if (!Nombre) faltantes.push('Nombre');
  if (!Apellido) faltantes.push('Apellido');
  if (!Grupo) faltantes.push('Grupo');
  if (!Grupo_BKP) faltantes.push('Grupo_BKP');
  if (!Modo) faltantes.push('Modo');
  if (typeof MaxPorTrabajar === 'undefined' || MaxPorTrabajar === null) faltantes.push('MaxPorTrabajar');
  if (!HoraDe) faltantes.push('HoraDe');
  if (!HoraA) faltantes.push('HoraA');

  if (faltantes.length > 0) {
    return res.status(400).json({ mensaje: `Faltan campos: ${faltantes.join(', ')}` });
  }

  // Si Modo = 'SCRIPT', Script es obligatorio
  if (String(Modo).toUpperCase() === 'SCRIPT') {
    if (!Script || String(Script).trim() === '') {
      return res.status(400).json({ mensaje: 'Modo SCRIPT requiere campo Script.' });
    }
  }

  const maxInt = parseInt(MaxPorTrabajar, 10);
  if (isNaN(maxInt)) {
    return res.status(400).json({ mensaje: 'MaxPorTrabajar debe ser un número entero.' });
  }

  // Normalizar formato de hora: aceptar HH:MM y convertir a HH:MM:00
  function normalizeTime(t) {
    if (typeof t !== 'string') return null;
    const m1 = t.match(/^\d{2}:\d{2}$/);
    const m2 = t.match(/^\d{2}:\d{2}:\d{2}$/);
    if (m2) return t;
    if (m1) return t + ':00';
    return null;
  }

  const horaDeNorm = normalizeTime(HoraDe);
  const horaANorm = normalizeTime(HoraA);

  if (!horaDeNorm || !horaANorm) {
    return res.status(400).json({ mensaje: 'Formato de HoraDe/HoraA inválido. Use HH:MM o HH:MM:SS.' });
  }

  try {
    const pool = await poolPromise;
    // Verificar si ya existe un usuario con el mismo apellido
    const existente = await pool.request()
      .input("Apellido", sql.VarChar, Apellido.trim())
      .query(`SELECT COUNT(1) AS cnt FROM a002103.APP_ORDENES_USR WHERE Apellido = @Apellido`);

    if (existente && existente.recordset && existente.recordset[0] && existente.recordset[0].cnt > 0) {
      return res.status(409).json({ mensaje: 'Ya existe un usuario con ese apellido.' });
    }

    await pool.request()
      .input("Nombre", sql.VarChar, Nombre)
      .input("Apellido", sql.VarChar, Apellido)
      .input("Grupo", sql.VarChar, Grupo)
      .input("Grupo_BKP", sql.VarChar, Grupo_BKP)
      .input("Modo", sql.VarChar, Modo)
      .input("MaxPorTrabajar", sql.Int, maxInt)
      .input("HoraDe", sql.Time, horaDeNorm)
      .input("HoraA", sql.Time, horaANorm)
      .input("SF_UserID", sql.VarChar, SF_UserID || null)
      .input("Asc_desc", sql.VarChar, Asc_desc || null)
      .input("Script", sql.NVarChar(sql.MAX), Script || null)
      .query(`
        INSERT INTO a002103.APP_ORDENES_USR
        (Nombre, Apellido, Grupo, Grupo2, Modo, Max_Por_Trabajar, Hora_De, Hora_A, SF_UserID, Asc_desc, Script)
        VALUES (@Nombre, @Apellido, @Grupo, @Grupo_BKP, @Modo, @MaxPorTrabajar, @HoraDe, @HoraA, @SF_UserID, @Asc_desc, @Script)
      `);

    res.status(201).json({ mensaje: "Usuario de orden creado correctamente." });
  } catch (error) {
    console.error("Error al crear usuario de orden:", error);
    // devolver mensaje de error para depuración (no sensible)
    res.status(500).json({ mensaje: "Error interno del servidor.", error: error.message });
  }
});

module.exports = router;
