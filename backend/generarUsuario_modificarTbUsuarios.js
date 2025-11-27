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

// ---------------------------------------------------------
// 2.1️⃣ OBTENER PERMISOS DE UN USUARIO
// ---------------------------------------------------------
router.get("/permisos/:legajo", async (req, res) => {
  const legajo = req.params.legajo;
  try {
    const pool = await poolPromise;

    const rUser = await pool.request()
      .input('Legajo', sql.VarChar, legajo)
      .query('SELECT TOP 1 ID_Usuario FROM a002103.USUARIO WHERE Legajo = @Legajo');

    if (!rUser.recordset || rUser.recordset.length === 0) {
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

// ============================================================================
// 3️⃣ ACTUALIZAR USUARIO + PERMISOS
// ============================================================================
router.put('/abm_usuarios/:legajo', async (req, res) => {
  const { legajo } = req.params;

  const {
    Apellido, Nombre, Alias, Email, Referente,
    Fecha_Nacimiento, Empresa, Convenio, Ciudad,
    Perm_Robot,
    Perm_AppOrdenes,
    Perm_Grafana,
    Perm_ABMUsuarios
  } = req.body;

  try {
    const pool = await poolPromise;

    // -----------------------------------------------------------------------
    // 3.1️⃣ UPDATE de datos del usuario
    // -----------------------------------------------------------------------
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

    // -----------------------------------------------------------------------
    // 3.2️⃣ PERMISOS
    // -----------------------------------------------------------------------

    const resultUser = await pool.request()
      .input("Legajo", sql.VarChar, legajo)
      .query("SELECT TOP 1 ID_Usuario, Nombre, Apellido FROM a002103.USUARIO WHERE Legajo = @Legajo");

    if (resultUser.recordset.length === 0) {
      return res.status(400).json({ mensaje: "Usuario no existe" });
    }

    const ID_Usuario = resultUser.recordset[0].ID_Usuario;
    const nombreCompleto = `${resultUser.recordset[0].Nombre} ${resultUser.recordset[0].Apellido}`;

    // MAP permisos → ID_Aplicacion
    const permisosMap = {
      Perm_Robot: 3,
      Perm_AppOrdenes: 2,
      Perm_Grafana: 5,
      Perm_ABMUsuarios: 6,
    };

    const permisosEstado = {
      Perm_Robot,
      Perm_AppOrdenes,
      Perm_Grafana,
      Perm_ABMUsuarios
    };

    // -------------------------------------------
    // 🔥 PERFIL DEL USUARIO
    // -------------------------------------------
    let buscarPerfil = await pool.request()
      .input("Nombre", sql.VarChar, nombreCompleto)
      .query(`
        SELECT ID_Perfil 
        FROM a002103.PERFIL 
        WHERE Nombre = @Nombre
      `);

    let ID_Perfil;

    if (buscarPerfil.recordset.length === 0) {
      // Crear PERFIL
      const nuevoPerfil = await pool.request()
        .input("Nombre", sql.VarChar, nombreCompleto)
        .query(`
          INSERT INTO a002103.PERFIL (Nombre, ID_Aplicacion)
          VALUES (@Nombre, 0)

          SELECT SCOPE_IDENTITY() AS ID_Perfil;
        `);

      ID_Perfil = nuevoPerfil.recordset[0].ID_Perfil;

    } else {
      ID_Perfil = buscarPerfil.recordset[0].ID_Perfil;
    }

    // -------------------------------------------
    // 🔥 GUARDADO DE PERMISOS
    // -------------------------------------------
    for (const [permisoNombre, activo] of Object.entries(permisosEstado)) {
      const idApp = permisosMap[permisoNombre];
      if (!idApp) continue;

      if (activo) {
        // Insertar si no existe
        await pool.request()
          .input("ID_Usuario", sql.Int, ID_Usuario)
          .input("ID_Perfil", sql.Int, ID_Perfil)
          .input("ID_Aplicacion", sql.Int, idApp)
          .query(`
            IF NOT EXISTS (
              SELECT 1 FROM a002103.USUARIO_PERFIL_APP
              WHERE ID_Usuario = @ID_Usuario 
              AND ID_Aplicacion = @ID_Aplicacion
            )
            INSERT INTO a002103.USUARIO_PERFIL_APP (ID_Usuario, ID_Perfil, ID_Aplicacion)
            VALUES (@ID_Usuario, @ID_Perfil, @ID_Aplicacion)
          `);

      } else {
        // Eliminar si existe
        await pool.request()
          .input("ID_Usuario", sql.Int, ID_Usuario)
          .input("ID_Aplicacion", sql.Int, idApp)
          .query(`
            DELETE FROM a002103.USUARIO_PERFIL_APP
            WHERE ID_Usuario = @ID_Usuario AND ID_Aplicacion = @ID_Aplicacion
          `);
      }
    }

    res.json({ mensaje: 'Usuario y permisos actualizados correctamente' });

  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});

module.exports = router;
