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

// Modificacion de Usuario 


// Obtener lista de usuarios (para el dropdown)
router.get('/usuarios', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT Legajo, Nombre, Apellido
      FROM a002103.USUARIO
      ORDER BY Apellido
    `);
    res.json(result.recordset);
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ mensaje: 'Error al obtener usuarios' });
  }
});

// Obtener datos de un usuario
router.get('/usuario/:legajo', async (req, res) => {
  const { legajo } = req.params;
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('Legajo', sql.VarChar, legajo)
      .query('SELECT * FROM a002103.USUARIO WHERE Legajo = @Legajo');

    if (result.recordset.length === 0) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }
    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});

// Actualizar usuario existente
router.put('/actualizar_usuario/:legajo', async (req, res) => {
  const { legajo } = req.params;
  const {
    Apellido, Nombre, Alias, Email, Referente,
    Fecha_Nacimiento, Empresa, Convenio, Ciudad
  } = req.body;

  try {
    const pool = await poolPromise;
    await pool.request()
      .input('Legajo', sql.VarChar, legajo)
      .input('Apellido', sql.VarChar, Apellido)
      .input('Nombre', sql.VarChar, Nombre)
      .input('Alias', sql.VarChar, Alias)
      .input('Email', sql.VarChar, Email)
      .input('Referente', sql.VarChar, Referente)
      .input('Fecha_Nacimiento', sql.Date, Fecha_Nacimiento)
      .input('Empresa', sql.VarChar, Empresa)
      .input('Convenio', sql.VarChar, Convenio)
      .input('Ciudad', sql.VarChar, Ciudad)
      .query(`
        UPDATE a002103.USUARIO
        SET Apellido=@Apellido, Nombre=@Nombre, Alias=@Alias, Email=@Email,
            Referente=@Referente, Fecha_Nacimiento=@Fecha_Nacimiento,
            Empresa=@Empresa, Convenio=@Convenio, Ciudad=@Ciudad
        WHERE Legajo=@Legajo
      `);

    res.json({ mensaje: 'Usuario actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});
