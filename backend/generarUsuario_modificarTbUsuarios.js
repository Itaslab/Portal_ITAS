// generarUsuario_modificarTbUsuarios.js
const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("./db");

// Obtener lista de usuarios (para el dropdown)
router.get('/abm_usuarios', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT Legajo, Nombre, Apellido
      FROM a002103.USUARIO
      ORDER BY Apellido
    `);
    res.json({ success: true, usuarios: result.recordset });
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ success: false, mensaje: 'Error al obtener usuarios' });
  }
});

// Obtener datos de un usuario específico
router.get('/abm_usuarios/:legajo', async (req, res) => {
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
router.put('/abm_usuarios/:legajo', async (req, res) => {
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

module.exports = router;
