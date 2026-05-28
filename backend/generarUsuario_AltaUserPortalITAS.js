//generarUsuario_AltaUserPortalITAS.js



const bcrypt = require("bcrypt");
const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("./db");
const schema = process.env.DB_SCHEMA;

// ==========================================
// OBTENER USUARIOS
// ==========================================
router.get("/usuariosPortalAlta", async (req, res) => {

    try {

        const pool = await poolPromise;

        const result = await pool.request().query(`
            SELECT
                ID_Usuario,
                Nombre,
                Apellido,
                Email
            FROM ${schema}.USUARIO
            ORDER BY Nombre, Apellido
        `);

        res.json(result.recordset);

    } catch (error) {

        console.error("Error obteniendo usuarios:", error);

        res.status(500).json({
            error: "Error obteniendo usuarios"
        });

    }

});


// ==========================================
// ALTA USUARIO PORTAL
// ==========================================
router.post("/altaUsuarioPortal", async (req, res) => {

    try {

        const { idUsuario, password } = req.body;

        if (!idUsuario || !password) {
            return res.status(400).json({
                error: "Faltan datos"
            });
        }

        if (password.length < 8 || password.length > 15) {
            return res.status(400).json({
                error: "La contraseña debe tener entre 8 y 15 caracteres"
            });
        }

        const pool = await poolPromise;

        // RESOLVER ID DE APLICACIÓN PORTAL EN PRODUCCIÓN O TEST
        const appResult = await pool.request().query(`
            SELECT TOP 1 ID_Aplicacion
            FROM ${schema}.APLICACION
            WHERE Nombre LIKE '%Portal%' OR Nombre LIKE '%ITAS%'
        `);

        const idAplicacionPortal = appResult.recordset[0]?.ID_Aplicacion || 1;

        // VALIDAR EXISTENCIA
        const existe = await pool.request()
            .input("idUsuario", sql.Int, idUsuario)
            .query(`
                SELECT 1
                FROM ${schema}.WEB_PORTAL_ITAS_USR
                WHERE ID_Usuario = @idUsuario
            `);

        if (existe.recordset.length > 0) {

            return res.status(400).json({
                error: "El usuario ya posee acceso al portal"
            });

        }

        // HASH PASSWORD
        const passwordHash = await bcrypt.hash(password, 10);

        // INSERT
        await pool.request()
            .input("idUsuario", sql.Int, idUsuario)
            .input("idAplicacion", sql.Int, idAplicacionPortal)
            .input("passwordHash", sql.NVarChar(255), passwordHash)
            .query(`
                INSERT INTO ${schema}.WEB_PORTAL_ITAS_USR
                (
                    ID_Usuario,
                    ID_Aplicacion,
                    Password,
                    Blanquear_Pass,
                    PasswordHash
                )
                VALUES
                (
                    @idUsuario,
                    @idAplicacion,
                    1234,
                    0,
                    @passwordHash
                )
            `);

        res.json({
            success: true
        });

    } catch (error) {

        console.error("Error alta usuario portal:", error);

        res.status(500).json({
            error: error.message || "Error al crear usuario portal"
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

// =====================================================
// AGREGAR PERMISO A USUARIO
// =====================================================

router.post("/usuario_perfil_app", async (req, res) => {

  const {
     ID_Usuario,
    ID_Aplicacion,
    ID_Perfil
  } = req.body;

  try {

    const pool = await poolPromise;


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

router.get("/usuario_perfil_app/:idUsuario", async (req, res) => {

  const { idUsuario } = req.params;

  try {

    const pool = await poolPromise;


    // ============================================
    // 2️⃣ OBTENER PERMISOS
    // ============================================

    const result = await pool.request()
      .input("ID_Usuario", sql.Int, idUsuario)
      .query(`

        SELECT
          UPA.ID_Usuario_Perfil_App,
          A.Nombre AS Aplicacion,
          P.Nombre AS Perfil

        FROM ${schema}.USUARIO_PERFIL_APP UPA

        INNER JOIN ${schema}.APLICACION A
          ON A.ID_Aplicacion = UPA.ID_Aplicacion

        INNER JOIN ${schema}.PERFIL P
          ON P.ID_Perfil = UPA.ID_Perfil

        WHERE UPA.ID_Usuario = @ID_Usuario

        ORDER BY
          A.Nombre,
          P.Nombre

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

// =====================================================
// ELIMINAR PERMISO
// =====================================================

router.delete(
  "/usuario_perfil_app/:id",
  async (req, res) => {

    const { id } = req.params;

    try {

      const pool = await poolPromise;

      await pool.request()
        .input(
          "ID",
          sql.Int,
          id
        )
        .query(`

          DELETE FROM
            ${schema}.USUARIO_PERFIL_APP

          WHERE
            ID_Usuario_Perfil_App = @ID

        `);

      res.json({
        success: true,
        mensaje: "Permiso eliminado"
      });

    } catch (error) {

      console.error(
        "Error eliminando permiso:",
        error
      );

      res.status(500).json({
        success: false,
        mensaje: "Error eliminando permiso"
      });

    }

});


module.exports = router;