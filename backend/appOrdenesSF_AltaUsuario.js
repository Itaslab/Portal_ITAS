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

  // Obtener pool temprano para poder inspeccionar la tabla y validar campos condicionalmente
  const pool = await poolPromise;

  // Validación básica de entrada para evitar 500 por datos inválidos
  // Nota: si la tabla APP_ORDENES_USR utiliza ID_Usuario en lugar de Nombre/Apellido,
  // validaremos la presencia de UsuarioBase (legajo) más abajo.
  const faltantes = [];
  if (!Grupo) faltantes.push('Grupo');
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
    // Aceptar HH:MM, HH:MM:SS, HH:MM:SS.ffffff (fracciones)
    const m1 = t.match(/^\d{2}:\d{2}$/);
    const m2 = t.match(/^\d{2}:\d{2}:\d{2}(?:\.\d+)?$/);
    if (m2) {
      // Normalizar a formato con 7 decimales de subsegundos: HH:MM:SS.fffffff
      if (t.indexOf('.') === -1) return t + '.0000000';
      // Si ya tiene fracciones, pad o recortar a 7
      const parts = t.split('.');
      const frac = (parts[1] || '').padEnd(7, '0').slice(0,7);
      return parts[0] + '.' + frac;
    }
    if (m1) return t + ':00.0000000';
    return null;
  }

  const horaDeNorm = normalizeTime(HoraDe);
  const horaANorm = normalizeTime(HoraA);

  if (!horaDeNorm || !horaANorm) {
    return res.status(400).json({ mensaje: 'Formato de HoraDe/HoraA inválido. Use HH:MM o HH:MM:SS.' });
  }

  try {
    // pool ya inicializado arriba
    // Comprobar si la tabla APP_ORDENES_USR contiene columna ID_Usuario
    const cols = await pool.request().query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'a002103' AND TABLE_NAME = 'APP_ORDENES_USR' AND COLUMN_NAME = 'ID_Usuario'`
    );

    const hasIdUsuario = cols && cols.recordset && cols.recordset.length > 0;

    if (hasIdUsuario) {
      // Debemos recibir UsuarioBase (legajo) para resolver ID_Usuario
      const usuarioBase = req.body && req.body.UsuarioBase ? String(req.body.UsuarioBase).trim() : null;
      if (!usuarioBase) {
        return res.status(400).json({ mensaje: 'Se requiere UsuarioBase (legajo) cuando la tabla usa ID_Usuario.' });
      }

      // Buscar ID_Usuario en tabla a002103.USUARIO por Legajo
      const r = await pool.request()
        .input('Legajo', sql.VarChar, usuarioBase)
        .query('SELECT TOP 1 ID_Usuario FROM a002103.USUARIO WHERE Legajo = @Legajo');

      const idUsuario = r && r.recordset && r.recordset[0] ? r.recordset[0].ID_Usuario : null;
      if (!idUsuario) {
        return res.status(400).json({ mensaje: 'No se encontró ID_Usuario para el UsuarioBase proporcionado.' });
      }

      // Evitar duplicados por ID_Usuario
      const existente = await pool.request()
        .input('ID_Usuario', sql.Int, idUsuario)
        .query('SELECT COUNT(1) AS cnt FROM a002103.APP_ORDENES_USR WHERE ID_Usuario = @ID_Usuario');

      if (existente && existente.recordset && existente.recordset[0] && existente.recordset[0].cnt > 0) {
        return res.status(409).json({ mensaje: 'Ya existe un usuario de orden para ese UsuarioBase.' });
      }

      await pool.request()
        .input('ID_Usuario', sql.Int, idUsuario)
        .input('Grupo', sql.VarChar, Grupo)
        .input('Grupo2', sql.VarChar, Grupo_BKP || null)
        .input('Modo', sql.VarChar, Modo)
        .input('MaxPorTrabajar', sql.Int, maxInt)
        .input('HoraDe', sql.VarChar(32), horaDeNorm)
        .input('HoraA', sql.VarChar(32), horaANorm)
        .input('SF_UserID', sql.VarChar, SF_UserID || null)
        .input('Asc_desc', sql.VarChar, Asc_desc || null)
        .input('Script', sql.NVarChar(sql.MAX), Script || null)
        .query(`
          INSERT INTO a002103.APP_ORDENES_USR
          (ID_Usuario, Grupo, Grupo2, Modo, Max_Por_Trabajar, Hora_De, Hora_A, SF_UserID, Asc_desc, Script)
          VALUES (@ID_Usuario, @Grupo, @Grupo2, @Modo, @MaxPorTrabajar, @HoraDe, @HoraA, @SF_UserID, @Asc_desc, @Script)
        `);

    } else {
      // Fallback: tabla no tiene ID_Usuario — insert por Nombre/Apellido
      // Verificar si ya existe un usuario con el mismo apellido
      const existente = await pool.request()
        .input('Apellido', sql.VarChar, Apellido.trim())
        .query('SELECT COUNT(1) AS cnt FROM a002103.APP_ORDENES_USR WHERE Apellido = @Apellido');

      if (existente && existente.recordset && existente.recordset[0] && existente.recordset[0].cnt > 0) {
        return res.status(409).json({ mensaje: 'Ya existe un usuario con ese apellido.' });
      }

      await pool.request()
        .input('Nombre', sql.VarChar, Nombre)
        .input('Apellido', sql.VarChar, Apellido)
        .input('Grupo', sql.VarChar, Grupo)
        .input('Grupo2', sql.VarChar, Grupo_BKP || null)
        .input('Modo', sql.VarChar, Modo)
        .input('MaxPorTrabajar', sql.Int, maxInt)
        .input('HoraDe', sql.VarChar(32), horaDeNorm)
        .input('HoraA', sql.VarChar(32), horaANorm)
        .input('SF_UserID', sql.VarChar, SF_UserID || null)
        .input('Asc_desc', sql.VarChar, Asc_desc || null)
        .input('Script', sql.NVarChar(sql.MAX), Script || null)
        .query(`
          INSERT INTO a002103.APP_ORDENES_USR
          (Nombre, Apellido, Grupo, Grupo2, Modo, Max_Por_Trabajar, Hora_De, Hora_A, SF_UserID, Asc_desc, Script)
          VALUES (@Nombre, @Apellido, @Grupo, @Grupo2, @Modo, @MaxPorTrabajar, @HoraDe, @HoraA, @SF_UserID, @Asc_desc, @Script)
        `);
    }

    res.status(201).json({ mensaje: "Usuario de orden creado correctamente." });
  } catch (error) {
    console.error("Error al crear usuario de orden:", error);
    // devolver mensaje de error para depuración (no sensible)
    res.status(500).json({ mensaje: "Error interno del servidor.", error: error.message });
  }
});

module.exports = router;
