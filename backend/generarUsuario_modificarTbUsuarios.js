// generarUsuario_modificarTbUsuarios.js

const express = require("express");
const router = express.Router();

const { sql, poolPromise } = require("./db");

const schema = process.env.DB_SCHEMA;

// =========================================================
// HELPER
// =========================================================

const clean = (v) => (v === "" || v === undefined ? null : v);

// =========================================================
// 1️⃣ LISTA DE USUARIOS
// =========================================================

router.get("/abm_usuarios", async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`

      SELECT
        Legajo,
        Nombre,
        Apellido

      FROM ${schema}.USUARIO
      WHERE Vigencia_Hasta IS NULL
      ORDER BY Apellido, Nombre

    `);

    res.json({
      success: true,
      usuarios: result.recordset,
    });
  } catch (error) {
    console.error("Error obteniendo usuarios:", error);

    res.status(500).json({
      success: false,
      mensaje: "Error al obtener usuarios",
    });
  }
});

// =========================================================
// 2️⃣ OBTENER UN USUARIO
// =========================================================

router.get("/abm_usuarios/:legajo", async (req, res) => {
  const { legajo } = req.params;

  try {
    const pool = await poolPromise;

    const result = await pool
      .request()

      .input("Legajo", sql.VarChar, legajo).query(`

        SELECT *

        FROM ${schema}.USUARIO

        WHERE Legajo = @Legajo

      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        mensaje: "Usuario no encontrado",
      });
    }

    res.json(result.recordset[0]);
  } catch (error) {
    console.error("Error obteniendo usuario:", error);

    res.status(500).json({
      mensaje: "Error interno del servidor",
    });
  }
});

// =========================================================
// 3️⃣ MODIFICAR USUARIO
// =========================================================

router.put("/abm_usuarios/:legajo", async (req, res) => {
  const { legajo } = req.params;

  const {
    Apellido,
    Nombre,
    Alias,
    Email,
    Referente,
    Fecha_Nacimiento,
    Empresa,
    Convenio,
    Ciudad,
  } = req.body;

  try {
    const pool = await poolPromise;

    // =====================================================
    // VALIDAR EXISTENCIA
    // =====================================================

    const existe = await pool
      .request()

      .input("Legajo", sql.VarChar, legajo).query(`

        SELECT TOP 1 ID_Usuario

        FROM ${schema}.USUARIO

        WHERE Legajo = @Legajo

      `);

    if (existe.recordset.length === 0) {
      return res.status(404).json({
        mensaje: "Usuario no encontrado",
      });
    }

    // =====================================================
    // UPDATE
    // =====================================================

    await pool
      .request()

      .input("Legajo", sql.VarChar, legajo)

      .input("Apellido", sql.VarChar, clean(Apellido))

      .input("Nombre", sql.VarChar, clean(Nombre))

      .input("Alias", sql.VarChar, clean(Alias))

      .input("Email", sql.VarChar, clean(Email))

      .input("Referente", sql.VarChar, clean(Referente))

      .input("Fecha_Nacimiento", sql.Date, clean(Fecha_Nacimiento))

      .input("Empresa", sql.VarChar, clean(Empresa))

      .input("Convenio", sql.VarChar, clean(Convenio))

      .input("Ciudad", sql.VarChar, clean(Ciudad)).query(`

        UPDATE ${schema}.USUARIO

        SET

          Apellido = @Apellido,
          Nombre = @Nombre,
          Alias = @Alias,
          Email = @Email,
          Referente = @Referente,
          Fecha_Nacimiento = @Fecha_Nacimiento,
          Empresa = @Empresa,
          Convenio = @Convenio,
          Ciudad = @Ciudad

        WHERE Legajo = @Legajo

      `);

    // =====================================================
    // OK
    // =====================================================

    res.json({
      success: true,
      mensaje: "Usuario actualizado correctamente",
    });
  } catch (error) {
    console.error("Error actualizando usuario:", error);

    res.status(500).json({
      success: false,
      mensaje: "Error interno del servidor",
    });
  }
});

// =========================================================
// 4️⃣ GRUPO ACTUAL DEL USUARIO
// =========================================================

router.get("/abm_usuarios/:id_usuario/grupo-actual", async (req, res) => {
  const { id_usuario } = req.params;

  try {
    const pool = await poolPromise;

    const result = await pool.request().input("id_usuario", sql.Int, id_usuario)
      .query(`
        SELECT ug.ID_Usuario_Grupo, g.ID_Grupo, g.Grupo, g.Subgrupo
        FROM ${schema}.USUARIO_GRUPO ug
        INNER JOIN ${schema}.GRUPO g ON g.ID_Grupo = ug.ID_Grupo
        WHERE ug.ID_Usuario = @id_usuario
          AND ug.Vigencia_Hasta IS NULL;
      `);

    if (result.recordset.length === 0) {
      return res.json({ success: true, tieneGrupo: false });
    }

    res.json({
      success: true,
      tieneGrupo: true,
      actual: result.recordset[0],
    });
  } catch (error) {
    console.error("Error obteniendo grupo actual:", error);
    res
      .status(500)
      .json({ success: false, mensaje: "Error interno del servidor" });
  }
});

// =========================================================
// 5️⃣ LISTA DE GRUPOS (nombres únicos)
// =========================================================

router.get("/grupos", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT DISTINCT Grupo FROM ${schema}.GRUPO ORDER BY Grupo;
    `);
    res.json({ success: true, grupos: result.recordset.map((r) => r.Grupo) });
  } catch (error) {
    console.error("Error obteniendo grupos:", error);
    res
      .status(500)
      .json({ success: false, mensaje: "Error interno del servidor" });
  }
});

// =========================================================
// 6️⃣ SUBGRUPOS DE UN GRUPO
// =========================================================

router.get("/grupos/subgrupos", async (req, res) => {
  const { grupo } = req.query;

  if (!grupo) {
    return res
      .status(400)
      .json({ success: false, mensaje: "Falta el parámetro grupo" });
  }

  try {
    const pool = await poolPromise;
    const result = await pool.request().input("grupo", sql.VarChar, grupo)
      .query(`
        SELECT ID_Grupo, Subgrupo
        FROM ${schema}.GRUPO
        WHERE Grupo = @grupo
        ORDER BY Subgrupo;
      `);

    res.json({ success: true, subgrupos: result.recordset });
  } catch (error) {
    console.error("Error obteniendo subgrupos:", error);
    res
      .status(500)
      .json({ success: false, mensaje: "Error interno del servidor" });
  }
});

// =========================================================
// 7️⃣ CAMBIAR GRUPO DEL USUARIO (cierra actual + crea nuevo)
// =========================================================

router.put("/abm_usuarios/:id_usuario/cambiar-grupo", async (req, res) => {
  const { id_usuario } = req.params;
  const { id_grupo_nuevo } = req.body;

  if (!id_grupo_nuevo) {
    return res
      .status(400)
      .json({ success: false, mensaje: "Falta id_grupo_nuevo" });
  }

  let transaction;

  try {
    const pool = await poolPromise;
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    const request = new sql.Request(transaction);

    await request.input("id_usuario", sql.Int, id_usuario).query(`
        UPDATE ${schema}.USUARIO_GRUPO
        SET Vigencia_Hasta = CAST(GETDATE() AS DATE)
        WHERE ID_Usuario = @id_usuario AND Vigencia_Hasta IS NULL;
      `);

    await request.input("id_grupo_nuevo", sql.Int, id_grupo_nuevo).query(`
        INSERT INTO ${schema}.USUARIO_GRUPO (ID_Usuario, ID_Grupo, Vigencia_Desde, Vigencia_Hasta)
        VALUES (@id_usuario, @id_grupo_nuevo, CAST(GETDATE() AS DATE), NULL);
      `);

    await transaction.commit();

    res.json({ success: true, mensaje: "Grupo actualizado correctamente" });
  } catch (error) {
    console.error("Error cambiando grupo:", error);

    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackErr) {
        console.error("Error en rollback:", rollbackErr);
      }
    }

    res
      .status(500)
      .json({ success: false, mensaje: "Error interno del servidor" });
  }
});

// =========================================================
//  FINALIZAR VIGENCIA DEL USUARIO
// =========================================================

router.put("/abm_usuarios/:id_usuario/finalizar-vigencia", async (req, res) => {
  const { id_usuario } = req.params;

  try {
    const pool = await poolPromise;

    const result = await pool.request().input("id_usuario", sql.Int, id_usuario)
      .query(`
        UPDATE ${schema}.USUARIO
        SET Vigencia_Hasta = CAST(GETDATE() AS DATE)
        WHERE ID_Usuario = @id_usuario
          AND Vigencia_Hasta IS NULL;
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        success: false,
        mensaje: "Usuario no encontrado o ya sin vigencia.",
      });
    }

    res.json({
      success: true,
      mensaje: "Vigencia finalizada correctamente.",
    });
  } catch (error) {
    console.error("Error finalizando vigencia:", error);

    res.status(500).json({
      success: false,
      mensaje: "Error interno del servidor.",
    });
  }
});

module.exports = router;
