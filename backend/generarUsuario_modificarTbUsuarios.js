// generarUsuario_modificarTbUsuarios.js

const express = require("express");
const router = express.Router();

const { sql, poolPromise } = require("./db");

const schema = process.env.DB_SCHEMA;

// =========================================================
// HELPER
// =========================================================

const clean = (v) =>
  (v === "" || v === undefined)
    ? null
    : v;

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

      ORDER BY Apellido, Nombre

    `);

    res.json({
      success: true,
      usuarios: result.recordset
    });

  } catch (error) {

    console.error("Error obteniendo usuarios:", error);

    res.status(500).json({
      success: false,
      mensaje: "Error al obtener usuarios"
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

    const result = await pool.request()

      .input("Legajo", sql.VarChar, legajo)

      .query(`

        SELECT *

        FROM ${schema}.USUARIO

        WHERE Legajo = @Legajo

      `);

    if (result.recordset.length === 0) {

      return res.status(404).json({
        mensaje: "Usuario no encontrado"
      });

    }

    res.json(result.recordset[0]);

  } catch (error) {

    console.error("Error obteniendo usuario:", error);

    res.status(500).json({
      mensaje: "Error interno del servidor"
    });

  }

});



// =====================================================
// OBTENER APLICACIONES
// =====================================================

router.get("/aplicaciones", async (req, res) => {

  try {

    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT
        ID_Aplicacion,
        Nombre
      FROM ${schema}.APLICACION
      ORDER BY Nombre
    `);

    res.json({
      success: true,
      aplicaciones: result.recordset
    });

  } catch (error) {

    console.error("Error obteniendo aplicaciones:", error);

    res.status(500).json({
      success: false,
      mensaje: "Error obteniendo aplicaciones"
    });

  }

});





// =====================================================
// OBTENER PERFILES SEGUN APLICACION
// =====================================================

router.get("/perfiles/:idAplicacion", async (req, res) => {

  const { idAplicacion } = req.params;

  try {

    const pool = await poolPromise;

    const result = await pool.request()
      .input("ID_Aplicacion", sql.Int, idAplicacion)
      .query(`
        SELECT
          ID_Perfil,
          Nombre
        FROM ${schema}.PERFIL
        WHERE ID_Aplicacion = @ID_Aplicacion
        ORDER BY Nombre
      `);

    res.json({
      success: true,
      perfiles: result.recordset
    });

  } catch (error) {

    console.error("Error obteniendo perfiles:", error);

    res.status(500).json({
      success: false,
      mensaje: "Error obteniendo perfiles"
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
    Ciudad

  } = req.body;

  try {

    const pool = await poolPromise;

    // =====================================================
    // VALIDAR EXISTENCIA
    // =====================================================

    const existe = await pool.request()

      .input("Legajo", sql.VarChar, legajo)

      .query(`

        SELECT TOP 1 ID_Usuario

        FROM ${schema}.USUARIO

        WHERE Legajo = @Legajo

      `);

    if (existe.recordset.length === 0) {

      return res.status(404).json({
        mensaje: "Usuario no encontrado"
      });

    }

    // =====================================================
    // UPDATE
    // =====================================================

    await pool.request()

      .input("Legajo", sql.VarChar, legajo)

      .input("Apellido", sql.VarChar, clean(Apellido))

      .input("Nombre", sql.VarChar, clean(Nombre))

      .input("Alias", sql.VarChar, clean(Alias))

      .input("Email", sql.VarChar, clean(Email))

      .input("Referente", sql.VarChar, clean(Referente))

      .input("Fecha_Nacimiento", sql.Date, clean(Fecha_Nacimiento))

      .input("Empresa", sql.VarChar, clean(Empresa))

      .input("Convenio", sql.VarChar, clean(Convenio))

      .input("Ciudad", sql.VarChar, clean(Ciudad))

      .query(`

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
      mensaje: "Usuario actualizado correctamente"
    });

  } catch (error) {

    console.error("Error actualizando usuario:", error);

    res.status(500).json({
      success: false,
      mensaje: "Error interno del servidor"
    });

  }

});



// =====================================================
// AGREGAR PERMISO A USUARIO
// =====================================================

router.post("/usuario_perfil_app", async (req, res) => {

  const {
    legajo,
    ID_Aplicacion,
    ID_Perfil
  } = req.body;

  try {

    const pool = await poolPromise;

    // =================================================
    // 1️⃣ OBTENER ID_USUARIO
    // =================================================

    const usuarioResult = await pool.request()
      .input("Legajo", sql.VarChar, legajo)
      .query(`
        SELECT ID_Usuario
        FROM ${schema}.USUARIO
        WHERE Legajo = @Legajo
      `);

    if (usuarioResult.recordset.length === 0) {

      return res.status(404).json({
        success: false,
        mensaje: "Usuario no encontrado"
      });

    }

    const ID_Usuario =
      usuarioResult.recordset[0].ID_Usuario;

    // =================================================
    // 2️⃣ VALIDAR SI YA EXISTE
    // =================================================

    const existeResult = await pool.request()
      .input("ID_Usuario", sql.Int, ID_Usuario)
      .input("ID_Aplicacion", sql.Int, ID_Aplicacion)
      .input("ID_Perfil", sql.Int, ID_Perfil)
      .query(`
        SELECT 1
        FROM ${schema}.USUARIO_PERFIL_APP
        WHERE ID_Usuario = @ID_Usuario
          AND ID_Aplicacion = @ID_Aplicacion
          AND ID_Perfil = @ID_Perfil
      `);

    if (existeResult.recordset.length > 0) {

      return res.status(400).json({
        success: false,
        mensaje: "Ese permiso ya existe para el usuario"
      });

    }

    // =================================================
    // 3️⃣ INSERT
    // =================================================

    await pool.request()
      .input("ID_Usuario", sql.Int, ID_Usuario)
      .input("ID_Aplicacion", sql.Int, ID_Aplicacion)
      .input("ID_Perfil", sql.Int, ID_Perfil)
      .query(`
        INSERT INTO ${schema}.USUARIO_PERFIL_APP
        (
          ID_Usuario,
          ID_Aplicacion,
          ID_Perfil
        )
        VALUES
        (
          @ID_Usuario,
          @ID_Aplicacion,
          @ID_Perfil
        )
      `);

    // =================================================
    // 4️⃣ OK
    // =================================================

    res.json({
      success: true,
      mensaje: "Permiso agregado correctamente"
    });

  } catch (error) {

    console.error(
      "Error agregando permiso:",
      error
    );

    res.status(500).json({
      success: false,
      mensaje: "Error interno del servidor"
    });

  }

});


// =====================================================
// OBTENER PERMISOS ACTUALES DEL USUARIO
// =====================================================

router.get("/usuario_perfil_app/:legajo", async (req, res) => {

  const { legajo } = req.params;

  try {

    const pool = await poolPromise;

    const result = await pool.request()
      .input("Legajo", sql.VarChar, legajo)
      .query(`

        SELECT
          UPA.ID_UsuarioPerfilApp,
          A.Nombre AS Aplicacion,
          P.Nombre AS Perfil
          
        FROM ${schema}.USUARIO_PERFIL_APP UPA

        INNER JOIN ${schema}.USUARIO U
          ON U.ID_Usuario = UPA.ID_Usuario

        INNER JOIN ${schema}.APLICACION A
          ON A.ID_Aplicacion = UPA.ID_Aplicacion

        INNER JOIN ${schema}.PERFIL P
          ON P.ID_Perfil = UPA.ID_Perfil

        WHERE U.Legajo = @Legajo

        ORDER BY A.Nombre, P.Nombre

      `);

    res.json({
      success: true,
      permisos: result.recordset
    });

  } catch (error) {

    console.error(
      "Error obteniendo permisos:",
      error
    );

    res.status(500).json({
      success: false,
      mensaje: "Error obteniendo permisos"
    });

  }

});

module.exports = router;