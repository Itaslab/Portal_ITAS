// generarUsuario_modificarTbUsuarios.js
const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("./db");

// Función para evitar "" y convertirlos en NULL
const clean = (v) => (v === "" || v === undefined ? null : v);

// ---------------------------------------------------------
// 1️⃣ LISTA DE USUARIOS
// ---------------------------------------------------------
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

// ---------------------------------------------------------
// 2️⃣ OBTENER UN USUARIO
// ---------------------------------------------------------
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


// consulta permisos usuario 

router.get("/permisos/:legajo", async (req, res) => {
  const legajo = req.params.legajo;
  try {
    const pool = await poolPromise;

    // Resolver Legajo -> ID_Usuario
    const rUser = await pool.request()
      .input('Legajo', sql.VarChar, legajo)
      .query('SELECT TOP 1 ID_Usuario FROM a002103.USUARIO WHERE Legajo = @Legajo');

    if (!rUser.recordset || rUser.recordset.length === 0) {
      // Si no existe el legajo, devolver array vacío
      return res.json([]);
    }

    const idUsuario = rUser.recordset[0].ID_Usuario;

    const result = await pool.request()
      .input("ID_Usuario", sql.Int, idUsuario)
      .query(`
        SELECT ID_Aplicacion
        FROM a002103.USUARIO_PERFIL_APP
        WHERE ID_Usuario = @ID_Usuario
      `);

    res.json(result.recordset);

  } catch (error) {
    console.error("Error al obtener permisos:", error);
    res.status(500).send("Error al obtener permisos del usuario");
  }
});




// ---------------------------------------------------------
// 3️⃣ ACTUALIZAR USUARIO
// ---------------------------------------------------------
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
      .input('Apellido', sql.VarChar, clean(Apellido))
      .input('Nombre', sql.VarChar, clean(Nombre))
      .input('Alias', sql.VarChar, clean(Alias))
      .input('Email', sql.VarChar, clean(Email))
      .input('Referente', sql.VarChar, clean(Referente))
      .input('Fecha_Nacimiento', sql.Date, clean(Fecha_Nacimiento))
      .input('Empresa', sql.VarChar, clean(Empresa))
      .input('Convenio', sql.VarChar, clean(Convenio))
      .input('Ciudad', sql.VarChar, clean(Ciudad))
      .query(`
        UPDATE a002103.USUARIO
        SET Apellido=@Apellido,
            Nombre=@Nombre,
            Alias=@Alias,
            Email=@Email,
            Referente=@Referente,
            Fecha_Nacimiento=@Fecha_Nacimiento,
            Empresa=@Empresa,
            Convenio=@Convenio,
            Ciudad=@Ciudad
        WHERE Legajo=@Legajo
      `);

    res.json({ mensaje: 'Usuario actualizado correctamente' });

  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});

module.exports = router;
