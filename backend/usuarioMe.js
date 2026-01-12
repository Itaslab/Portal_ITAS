const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { sql, poolPromise } = require('./db');
const schema = process.env.DB_SCHEMA;


// Devuelve info del usuario logueado (según session)
router.get('/me', async (req, res) => {
  try {
    if (!req.session || !req.session.user) return res.status(401).json({ success: false, error: 'No autenticado' });
    const idUsuario = req.session.user.ID_Usuario;
    const pool = await poolPromise;
    const r = await pool.request()
      .input('id', sql.Int, idUsuario)
      .query(`SELECT ID_Usuario, Legajo, Nombre, Apellido, Email FROM ${schema}.USUARIO WHERE ID_Usuario = @id`);
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
    const newLen = String(newPassword).length;
    if (newLen < 8 || newLen > 15) return res.status(400).json({ success: false, error: 'La contraseña debe tener entre 8 y 15 caracteres' });

    const pool = await poolPromise;
    const r = await pool.request()
      .input('id', sql.Int, idUsuario)
      .query(`SELECT PasswordHash FROM ${schema}.WEB_PORTAL_ITAS_USR WHERE ID_Usuario = @id`);

    if (!r.recordset || r.recordset.length === 0) return res.status(404).json({ success: false, error: 'Registro WEB no encontrado' });

    const current = r.recordset[0].PasswordHash;
    const passwordOk = await bcrypt.compare(currentPassword, current);
    if (!passwordOk) {
      return res.status(403).json({ success: false, error: 'Contraseña actual incorrecta' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.request()
      .input('id', sql.Int, idUsuario)
      .input('newPass', sql.VarChar, hashedPassword)
      .query(`UPDATE ${schema}.WEB_PORTAL_ITAS_USR SET PasswordHash = @newPass WHERE ID_Usuario = @id`);

    res.json({ success: true, mensaje: 'Contraseña actualizada' });
  } catch (err) {
    console.error('Error en PUT /me/password', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;