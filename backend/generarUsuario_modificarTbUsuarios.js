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

module.exports = router;