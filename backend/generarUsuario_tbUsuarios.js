// backend/generarUsuario_tbUsuarios.js
const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('./db'); // ajustá la ruta si está en la misma carpeta

// Ruta POST para registrar un nuevo usuario
router.post('/registrar_usuario', async (req, res) => {
  try {
    const {
      Apellido,
      Nombre,
      Alias,
      Legajo,
      Email,
      Referente,
      Fecha_Nacimiento,
      Empresa,
      Convenio,
      Ciudad
    } = req.body;

    // Validar campos requeridos
    if (
      !Apellido || !Nombre || !Alias || !Legajo || !Email ||
      !Referente || !Fecha_Nacimiento || !Empresa ||
      !Convenio || !Ciudad
    ) {
      return res.status(400).json({ mensaje: 'Faltan campos obligatorios' });
    }

    // Conexión
    const pool = await poolPromise;

    // ------------------ VERIFICAR SI YA EXISTE ------------------
    const usuarioExistente = await pool.request()
      .input('Email', sql.VarChar, Email)
      .input('Legajo', sql.VarChar, Legajo)
      .query(`
        SELECT 1 FROM a002103.USUARIO
        WHERE Email = @Email OR Legajo = @Legajo
      `);

    if (usuarioExistente.recordset.length > 0) {
      return res.status(409).json({ mensaje: 'Usuario ya existe con ese Email o Legajo' });
    }
    // ------------------------------------------------------------

    // Ejecutar inserción segura
    await pool.request()
      .input('Apellido', sql.VarChar, Apellido)
      .input('Nombre', sql.VarChar, Nombre)
      .input('Alias', sql.VarChar, Alias)
      .input('Legajo', sql.VarChar, Legajo)
      .input('Email', sql.VarChar, Email)
      .input('Referente', sql.VarChar, Referente)
      .input('Fecha_Nacimiento', sql.Date, Fecha_Nacimiento)
      .input('Empresa', sql.VarChar, Empresa)
      .input('Convenio', sql.VarChar, Convenio)
      .input('Ciudad', sql.VarChar, Ciudad)
      .query(`
        INSERT INTO a002103.USUARIO (
          Apellido, Nombre, Alias, Legajo, Email,
          Referente, Fecha_Nacimiento, Empresa, Convenio, Ciudad
        )
        VALUES (
          @Apellido, @Nombre, @Alias, @Legajo, @Email,
          @Referente, @Fecha_Nacimiento, @Empresa, @Convenio, @Ciudad
        )
      `);

    res.status(201).json({ mensaje: 'Usuario registrado correctamente' });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor', error: error.message });
  }
});

module.exports = router;





