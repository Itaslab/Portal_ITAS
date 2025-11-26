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
  // Permisos recibidos del frontend
  const { Perm_Robot, Perm_AppOrdenes, Perm_Grafana, Perm_ABMUsuarios } = req.body;

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

    // === Actualizar permisos en USUARIO_PERFIL_APP según flags recibidos ===
    // Mapeo frontend -> ID_Aplicacion
    const permisosMap = [
      { appId: 3, flag: !!Perm_Robot },
      { appId: 2, flag: !!Perm_AppOrdenes },
      { appId: 5, flag: !!Perm_Grafana },
      { appId: 6, flag: !!Perm_ABMUsuarios },
    ];

    try {
      // 1) resolver Legajo -> ID_Usuario
      const rUser = await pool.request()
        .input('Legajo', sql.VarChar, legajo)
        .query('SELECT TOP 1 ID_Usuario FROM a002103.USUARIO WHERE Legajo = @Legajo');
      if (!rUser.recordset || rUser.recordset.length === 0) {
        // Usuario no encontrado; ya actualizamos la tabla USUARIO pero no podemos asignar permisos
        console.warn('Usuario no encontrado al actualizar permisos:', legajo);
      } else {
        const idUsuario = rUser.recordset[0].ID_Usuario;

        // 2) obtener permisos existentes (ID_Aplicacion y ID_Perfil)
        const existingRes = await pool.request()
          .input('ID_Usuario', sql.Int, idUsuario)
          .query('SELECT ID_Perfil, ID_Aplicacion FROM a002103.USUARIO_PERFIL_APP WHERE ID_Usuario = @ID_Usuario');
        const existing = existingRes.recordset || [];
        const existingAppIds = new Set(existing.map(r => parseInt(r.ID_Aplicacion, 10)));

        // Helper: detectar columnas de PERFIL y preparar campos de insert dinámico
        const perfilColsRes = await pool.request()
          .query(`SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'a002103' AND TABLE_NAME = 'PERFIL'`);
        const perfilCols = perfilColsRes.recordset || [];
        const hasIdAplicacionCol = perfilCols.some(c => c.COLUMN_NAME.toUpperCase() === 'ID_APLICACION');
        // detectar una columna tipo string para usar como nombre
        const nameCol = perfilCols.find(c => /CHAR|TEXT|NVARCHAR|VARCHAR/i.test(c.DATA_TYPE) && c.IS_NULLABLE === 'YES');
        const nameColName = nameCol ? nameCol.COLUMN_NAME : null;

        // Helper: detectar columnas de USUARIO_PERFIL_APP para insert (si necesita ID_Aplicacion)
        const upsColsRes = await pool.request()
          .query(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'a002103' AND TABLE_NAME = 'USUARIO_PERFIL_APP'`);
        const upsCols = (upsColsRes.recordset || []).map(r => r.COLUMN_NAME.toUpperCase());
        const upsHasAppId = upsCols.includes('ID_APLICACION');

        for (const p of permisosMap) {
          const { appId, flag } = p;
          const exists = existingAppIds.has(parseInt(appId, 10));

          if (flag && !exists) {
            // Debemos crear un PERFIL (si es necesario) y un registro en USUARIO_PERFIL_APP
            let idPerfil = null;

            // 1) intentar encontrar un PERFIL existente con ID_Aplicacion = appId (si la tabla PERFIL tiene esa columna)
            if (hasIdAplicacionCol) {
              const r = await pool.request()
                .input('ID_Aplicacion', sql.Int, appId)
                .query('SELECT TOP 1 ID_Perfil FROM a002103.PERFIL WHERE ID_Aplicacion = @ID_Aplicacion');
              if (r.recordset && r.recordset.length > 0) idPerfil = r.recordset[0].ID_Perfil;
            }

            // 2) si no encontramos, intentar encontrar por nombre generico
            if (!idPerfil && nameColName) {
              const genName = `AUTOGEN_PERF_${appId}`;
              const r2 = await pool.request()
                .input('NameVal', sql.VarChar, genName)
                .query(`SELECT TOP 1 ID_Perfil FROM a002103.PERFIL WHERE ${nameColName} = @NameVal`);
              if (r2.recordset && r2.recordset.length > 0) idPerfil = r2.recordset[0].ID_Perfil;
            }

            // 3) si sigue sin ID, crear un PERFIL si es posible
            if (!idPerfil) {
              // construir insert dinámico según columnas disponibles
              const insertCols = [];
              const insertVals = [];
              let req = pool.request();

              if (hasIdAplicacionCol) {
                insertCols.push('ID_Aplicacion');
                insertVals.push('@ID_Aplicacion');
                req = req.input('ID_Aplicacion', sql.Int, appId);
              }
              if (nameColName) {
                insertCols.push(nameColName);
                insertVals.push('@NameVal');
                req = req.input('NameVal', sql.VarChar, `AUTOGEN_PERF_${appId}`);
              }

              if (insertCols.length === 0) {
                // No hay columnas libres para crear PERFIL, no podemos generar automáticamente
                console.warn('No se pudo crear PERFIL automáticamente. No se detectaron columnas string o ID_Aplicacion en PERFIL.');
              } else {
                const q = `INSERT INTO a002103.PERFIL (${insertCols.join(',')}) OUTPUT INSERTED.ID_Perfil VALUES (${insertVals.join(',')})`;
                const r3 = await req.query(q);
                if (r3.recordset && r3.recordset[0]) idPerfil = r3.recordset[0].ID_Perfil;
              }
            }

            if (!idPerfil) {
              console.error(`No se encontró ni se pudo crear ID_Perfil para app ${appId}; salteando`);
            } else {
              // Insertar en USUARIO_PERFIL_APP con ID_Perfil e ID_Usuario (y posiblemente ID_Aplicacion)
              const insReq = pool.request().input('ID_Perfil', sql.Int, idPerfil).input('ID_Usuario', sql.Int, idUsuario);
              let insertSql = '';
              if (upsHasAppId) {
                insReq.input('ID_Aplicacion', sql.Int, appId);
                insertSql = `INSERT INTO a002103.USUARIO_PERFIL_APP (ID_Perfil, ID_Usuario, ID_Aplicacion) VALUES (@ID_Perfil, @ID_Usuario, @ID_Aplicacion)`;
              } else {
                insertSql = `INSERT INTO a002103.USUARIO_PERFIL_APP (ID_Perfil, ID_Usuario) VALUES (@ID_Perfil, @ID_Usuario)`;
              }
              await insReq.query(insertSql);
            }
          } else if (!flag && exists) {
            // Debemos eliminar el permiso (DELETE en USUARIO_PERFIL_APP) por ID_Usuario + ID_Aplicacion
            const delReq = pool.request().input('ID_Usuario', sql.Int, idUsuario).input('ID_Aplicacion', sql.Int, appId);
            await delReq.query('DELETE FROM a002103.USUARIO_PERFIL_APP WHERE ID_Usuario = @ID_Usuario AND ID_Aplicacion = @ID_Aplicacion');
          }
        }
      }
    } catch (permErr) {
      console.error('Error actualizando permisos:', permErr);
      // No abortar el flujo — respondemos OK para la actualización del usuario
    }

    res.json({ mensaje: 'Usuario actualizado correctamente' });

  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});

module.exports = router;
