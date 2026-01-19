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
    
    console.log("🔍 DEBUG /me/password - ID Usuario:", idUsuario);
    console.log("🔍 DEBUG /me/password - currentPassword recibido:", currentPassword ? "***" : "VACÍO");
    console.log("🔍 DEBUG /me/password - newPassword recibido:", newPassword ? "***" : "VACÍO");
    
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
    console.log("🔍 DEBUG /me/password - PasswordHash en BD:", current ? "EXISTE" : "NO EXISTE");
    console.log("🔍 DEBUG /me/password - PasswordHash longitud:", current ? current.length : 0);
    console.log("🔍 DEBUG /me/password - PasswordHash primeros 10 chars:", current ? current.substring(0, 10) : "N/A");
    console.log("🔍 DEBUG /me/password - PasswordHash últimos 10 chars:", current ? current.substring(current.length - 10) : "N/A");
    
    // Limpiar espacios en blanco
    const cleanHash = current ? current.trim() : null;
    if (cleanHash !== current) {
      console.log("⚠️ ADVERTENCIA: El hash tenía espacios en blanco, fue limpiado");
    }
    
    console.log("🔍 DEBUG /me/password - currentPassword longitud:", currentPassword ? currentPassword.length : 0);
    console.log("🔍 DEBUG /me/password - currentPassword primeros 3 chars:", currentPassword ? currentPassword.substring(0, 3) : "N/A");
    
    const passwordOk = await bcrypt.compare(currentPassword, cleanHash);
    console.log("🔍 DEBUG /me/password - ¿Contraseña coincide?", passwordOk);
    
    if (!passwordOk) {
      return res.status(403).json({ success: false, error: 'Contraseña actual incorrecta' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.request()
      .input('id', sql.Int, idUsuario)
      .input('newPass', sql.VarChar, hashedPassword)
      .query(`UPDATE ${schema}.WEB_PORTAL_ITAS_USR SET PasswordHash = @newPass, Blanquear_Pass = 1 WHERE ID_Usuario = @id`);

    res.json({ success: true, mensaje: 'Contraseña actualizada' });
  } catch (err) {
    console.error('Error en PUT /me/password', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;