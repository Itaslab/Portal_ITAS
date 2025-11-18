const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('./db'); // ajustá la ruta si está en la misma carpeta

// Endpoint para verificar si existe legajo o email en otro usuario
router.get('/verificar_legajo_email', async (req, res) => {
  const { legajo, email, actual } = req.query;
  if (!legajo && !email) {
    return res.status(400).json({ success: false, mensaje: 'Faltan parámetros' });
  }
  try {
    const pool = await poolPromise;
    let query = `SELECT Legajo, Email FROM a002103.USUARIO WHERE (Legajo = @Legajo OR Email = @Email)`;
    if (actual) {
      query += ' AND Legajo <> @Actual';
    }
    const request = pool.request()
      .input('Legajo', sql.VarChar, legajo || null)
      .input('Email', sql.VarChar, email || null);
    if (actual) request.input('Actual', sql.VarChar, actual);
    const result = await request.query(query);
    if (result.recordset.length > 0) {
      return res.json({ success: true, existe: true, coincidencias: result.recordset });
    }
    res.json({ success: true, existe: false });
  } catch (error) {
    console.error('Error en verificación legajo/email:', error);
    res.status(500).json({ success: false, mensaje: 'Error interno', error: error.message });
  }
});
// Endpoint GET para obtener todos los referentes únicos
router.get('/referentes', async (req, res) => {
  try {
    const pool = await poolPromise;
    // Trae Referente y el nombre completo asociado (primera ocurrencia por Referente)
    const result = await pool.request().query(`
      SELECT r.Referente, CONCAT(u.Apellido, ', ', u.Nombre) AS NombreCompleto
      FROM (
        SELECT DISTINCT Referente FROM a002103.USUARIO
        WHERE Referente IS NOT NULL AND LTRIM(RTRIM(Referente)) <> ''
      ) r
      OUTER APPLY (
        SELECT TOP 1 Apellido, Nombre FROM a002103.USUARIO u2 WHERE u2.Legajo = r.Referente
      ) u
      ORDER BY r.Referente
    `);
    const referentes = result.recordset.map(r => ({
      Referente: r.Referente,
      NombreCompleto: r.NombreCompleto || ''
    }));
    res.json({ success: true, referentes });
  } catch (error) {
    console.error('Error al obtener referentes:', error);
    res.status(500).json({ success: false, mensaje: 'Error al obtener referentes', error: error.message });
  }
});
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





