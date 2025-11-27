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

    // Resolver Legajo -> ID_Usuario
    const rUser = await pool.request()
      .input('Legajo', sql.VarChar, legajo)
      .query('SELECT TOP 1 ID_Usuario FROM a002103.USUARIO WHERE Legajo = @Legajo');

    if (!rUser.recordset || rUser.recordset.length === 0) {
      return res.json([]);
    }

    const idUsuario = rUser.recordset[0].ID_Usuario;

    // Obtener permisos
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
// 3️⃣ ACTUALIZAR USUARIO + ACTUALIZAR PERMISOS
// ============================================================================
router.put('/abm_usuarios/:legajo', async (req, res) => {
  const { legajo } = req.params;

  const {
    Apellido, Nombre, Alias, Email, Referente,
    Fecha_Nacimiento, Empresa, Convenio, Ciudad,

    // 🔹 Permisos agregados desde tu frontend
    Perm_Robot,
    Perm_AppOrdenes,
    Perm_Grafana,
    Perm_ABMUsuarios
  } = req.body;

  try {
    const pool = await poolPromise;

    // -----------------------------------------------------------------------
    // 3.1️⃣ UPDATE de datos del usuario (esto ya lo tenías)
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
    // 3.2️⃣ PERMISOS → requiere lógica extra según tu base:
    //    1. Buscar ID_Usuario
    //    2. Crear PERFIL si no existe
    //    3. Registrar o borrar en USUARIO_PERFIL_APP
    // -----------------------------------------------------------------------

    // Buscar ID_Usuario
    const resultUser = await pool.request()
      .input("Legajo", sql.VarChar, legajo)
      .query("SELECT TOP 1 ID_Usuario FROM a002103.USUARIO WHERE Legajo = @Legajo");

    if (resultUser.recordset.length === 0) {
      return res.status(400).json({ mensaje: "No existe el usuario para asignar permisos" });
    }

    const ID_Usuario = resultUser.recordset[0].ID_Usuario;

    // MAP de permisos → ID_Aplicacion
    const permisosMap = {
      Perm_Robot: 1,
      Perm_AppOrdenes: 2,
      Perm_Grafana: 3,
      Perm_ABMUsuarios: 4,
    };

    // Lista en formato iterable
    const permisosEstado = {
      Perm_Robot,
      Perm_AppOrdenes,
      Perm_Grafana,
      Perm_ABMUsuarios
    };

    // Recorremos todos los permisos
    for (const [permisoNombre, activo] of Object.entries(permisosEstado)) {
      const idApp = permisosMap[permisoNombre];
      if (!idApp) continue;

      if (activo) {
        // Si está marcado → debe existir en las tablas PERFIL + USUARIO_PERFIL_APP

        // 1️⃣ Buscar si existe PERFIL con ese ID_Aplicacion
        const rsPerfil = await pool.request()
          .input("ID_Aplicacion", sql.Int, idApp)
          .query(`
            SELECT TOP 1 ID_Perfil 
            FROM a002103.PERFIL 
            WHERE ID_Aplicacion = @ID_Aplicacion
          `);

        let idPerfil;

        if (rsPerfil.recordset.length === 0) {
          // 2️⃣ Crear PERFIL si no existe
          const insertPerfil = await pool.request()
            .input("ID_Aplicacion", sql.Int, idApp)
            .query(`
              INSERT INTO a002103.PERFIL (ID_Aplicacion)
              OUTPUT INSERTED.ID_Perfil
              VALUES (@ID_Aplicacion)
            `);

          idPerfil = insertPerfil.recordset[0].ID_Perfil;
        } else {
          idPerfil = rsPerfil.recordset[0].ID_Perfil;
        }

        // 3️⃣ Insertar en USUARIO_PERFIL_APP si NO existe
        await pool.request()
          .input("ID_Usuario", sql.Int, ID_Usuario)
          .input("ID_Perfil", sql.Int, idPerfil)
          .query(`
            IF NOT EXISTS (
                SELECT 1 FROM a002103.USUARIO_PERFIL_APP
                WHERE ID_Usuario = @ID_Usuario AND ID_Perfil = @ID_Perfil
            )
            INSERT INTO a002103.USUARIO_PERFIL_APP (ID_Usuario, ID_Perfil, ID_Aplicacion)
            VALUES (@ID_Usuario, @ID_Perfil, ${idApp})
          `);

      } else {
        // Si NO está marcado → BORRAR si existía

        await pool.request()
          .input("ID_Usuario", sql.Int, ID_Usuario)
          .input("ID_Aplicacion", sql.Int, idApp)
          .query(`
            DELETE FROM a002103.USUARIO_PERFIL_APP
            WHERE ID_Usuario = @ID_Usuario AND ID_Aplicacion = @ID_Aplicacion
          `);
      }
    }

    // -----------------------------------------------------------------------

    res.json({ mensaje: 'Usuario y permisos actualizados correctamente' });

  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});

module.exports = router;
