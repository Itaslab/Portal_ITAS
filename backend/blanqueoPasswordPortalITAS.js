// blanqueoPasswordPortalItas.js
// Endpoint para que administradores blaqueen contraseñas de usuarios

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { sql, poolPromise } = require('./db');
const schema = process.env.DB_SCHEMA;

// GET: Obtener lista de usuarios para el dropdown (desde WEB_PORTAL_ITAS_USR)
router.get('/usuarios-blanquear', async (req, res) => {
  try {
    const pool = await poolPromise;

    const query = `
      SELECT 
        u.ID_Usuario,
        u.Legajo,
        ISNULL(u.Nombre, '') + ' ' + ISNULL(u.Apellido, '') AS NombreCompleto,
        u.Email,
        w.Blanquear_Pass
      FROM 
        ${schema}.USUARIO u
      INNER JOIN 
        ${schema}.WEB_PORTAL_ITAS_USR w ON u.ID_Usuario = w.ID_Usuario
      ORDER BY u.Nombre, u.Apellido
    `;

    const result = await pool.request().query(query);

    const usuarios = result.recordset.map(u => ({
      id_usuario: u.ID_Usuario,
      legajo: u.Legajo,
      nombre_completo: u.NombreCompleto,
      email: u.Email,
      blanquear_pass: u.Blanquear_Pass
    }));

    res.json({ success: true, usuarios });
  } catch (err) {
    console.error('Error al obtener usuarios para blanqueo:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST: Blanquear password de un usuario
// Body: { id_usuario: number }
// Requiere sesión activa
router.post('/blanquear-password', async (req, res) => {
  try {
    // Verificar que hay sesión (debe estar autenticado)
    if (!req.session || !req.session.user) {
      return res.status(401).json({ success: false, error: 'No autenticado' });
    }

    const { id_usuario } = req.body;

    if (!id_usuario) {
      return res.status(400).json({ success: false, error: 'Se requiere id_usuario' });
    }

    // Validar que el id_usuario sea un número
    const idUsuarioNum = parseInt(id_usuario, 10);
    if (isNaN(idUsuarioNum)) {
      return res.status(400).json({ success: false, error: 'id_usuario debe ser un número' });
    }

    // Contraseña por defecto
    const passwordPorDefecto = 'Itas2026';

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(passwordPorDefecto, 10);

    const pool = await poolPromise;

    // Actualizar la contraseña en WEB_PORTAL_ITAS_USR
    // Cambiar PasswordHash a la nueva contraseña hasheada
    // Cambiar Blanquear_Pass a 0 para FORZAR cambio de contraseña en próximo login
    const updateResult = await pool
      .request()
      .input('id_usuario', sql.Int, idUsuarioNum)
      .input('newPass', sql.VarChar, hashedPassword)
      .query(`
        UPDATE ${schema}.WEB_PORTAL_ITAS_USR 
        SET 
          PasswordHash = @newPass,
          Blanquear_Pass = 0
        WHERE 
          ID_Usuario = @id_usuario
      `);

    if (updateResult.rowsAffected[0] === 0) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado en WEB_PORTAL_ITAS_USR' });
    }

    res.json({ 
      success: true, 
      mensaje: `Contraseña blanqueada exitosamente. Nueva contraseña temporal: ${passwordPorDefecto}. El usuario deberá cambiarla en el próximo login.`,
      id_usuario: idUsuarioNum
    });

  } catch (err) {
    console.error('Error al blanquear password:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
