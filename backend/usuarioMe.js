const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('./db');

// Devuelve info del usuario logueado (según session)
router.get('/me', async (req, res) => {
  try {
    if (!req.session || !req.session.user) return res.status(401).json({ success: false, error: 'No autenticado' });
    const idUsuario = req.session.user.ID_Usuario;
    const pool = await poolPromise;
    const r = await pool.request()
      .input('id', sql.Int, idUsuario)
      .query('SELECT ID_Usuario, Legajo, Nombre, Apellido, Email FROM a002103.USUARIO WHERE ID_Usuario = @id');
    if (!r.recordset || r.recordset.length === 0) return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    const u = r.recordset[0];
    res.json({ success: true, usuario: { ID_Usuario: u.ID_Usuario, Legajo: u.Legajo, Nombre: u.Nombre, Apellido: u.Apellido, Email: u.Email } });
  } catch (err) {
    console.error('Error en GET /me', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Cambiar password (requiere currentPassword y newPassword en body)
router.put('/me/password', async (req, res) => {
  try {
    if (!req.session || !req.session.user) return res.status(401).json({ success: false, error: 'No autenticado' });
    const idUsuario = req.session.user.ID_Usuario;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ success: false, error: 'Se requieren currentPassword y newPassword' });
    // validaciones mínimas
    if (String(newPassword).length < 4) return res.status(400).json({ success: false, error: 'La contraseña debe tener al menos 4 caracteres' });

    const pool = await poolPromise;
    const r = await pool.request()
      .input('id', sql.Int, idUsuario)
      .query('SELECT Password FROM a002103.WEB_PORTAL_ITAS_USR WHERE ID_Usuario = @id');

    if (!r.recordset || r.recordset.length === 0) return res.status(404).json({ success: false, error: 'Registro WEB no encontrado' });

    const current = r.recordset[0].Password;
    if (String(current) !== String(currentPassword)) {
      return res.status(403).json({ success: false, error: 'Contraseña actual incorrecta' });
    }

    await pool.request()
      .input('id', sql.Int, idUsuario)
      .input('newPass', sql.VarChar, newPassword)
      .query('UPDATE a002103.WEB_PORTAL_ITAS_USR SET Password = @newPass WHERE ID_Usuario = @id');

    res.json({ success: true, mensaje: 'Contraseña actualizada' });
  } catch (err) {
    console.error('Error en PUT /me/password', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;