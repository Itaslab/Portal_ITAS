// appOrdenesSF_AltaUsuario.js

const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("./db");
const schema = process.env.DB_SCHEMA;

// Endpoint para traer usuarios base
router.get("/usuarios_base", async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
SELECT Legajo, Nombre, Apellido, Email
FROM ${schema}.USUARIO
WHERE Vigencia_Hasta IS NULL
ORDER BY Apellido, Nombre
    `);

    res.json({
      success: true,
      usuarios: result.recordset,
    });
  } catch (error) {
    console.error("Error al obtener usuarios base:", error);
    res.status(500).json({
      success: false,
      mensaje: "Error interno",
      error: error.message,
    });
  }
});

router.post("/usuariosordenes", async (req, res) => {
  try {
    const {
      UsuarioBase,
      Grupo,
      Grupo_BKP,
      Modo,
      MaxPorTrabajar,
      HoraDe,
      HoraA,
      SF_UserID,
      Asc_desc,
      Script,
    } = req.body;

    const pool = await poolPromise;

    // Validaciones
    const faltantes = [];

    if (!UsuarioBase) faltantes.push("UsuarioBase");
    if (!Grupo) faltantes.push("Grupo");
    if (!Modo) faltantes.push("Modo");
    if (MaxPorTrabajar === undefined || MaxPorTrabajar === null)
      faltantes.push("MaxPorTrabajar");
    if (!HoraDe) faltantes.push("HoraDe");
    if (!HoraA) faltantes.push("HoraA");

    if (faltantes.length) {
      return res.status(400).json({
        mensaje: `Faltan campos: ${faltantes.join(", ")}`,
      });
    }

    if (Modo === "SCRIPT" && (!Script || !Script.trim())) {
      return res.status(400).json({
        mensaje: "Modo SCRIPT requiere el campo Script.",
      });
    }

    const maxInt = parseInt(MaxPorTrabajar, 10);

    if (isNaN(maxInt)) {
      return res.status(400).json({
        mensaje: "MaxPorTrabajar debe ser un número entero.",
      });
    }

    function normalizeTime(t) {
      if (typeof t !== "string") return null;

      if (/^\d{2}:\d{2}$/.test(t)) return t + ":00.0000000";

      if (/^\d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(t)) {
        if (!t.includes(".")) return t + ".0000000";

        const partes = t.split(".");
        return partes[0] + "." + partes[1].padEnd(7, "0").slice(0, 7);
      }

      return null;
    }

    const horaDeNorm = normalizeTime(HoraDe);
    const horaANorm = normalizeTime(HoraA);

    if (!horaDeNorm || !horaANorm) {
      return res.status(400).json({
        mensaje: "Formato de HoraDe/HoraA inválido.",
      });
    }

    // Buscar ID_Usuario por Legajo
    const usuario = await pool
      .request()
      .input("Legajo", sql.VarChar, UsuarioBase).query(`
        SELECT TOP 1 ID_Usuario
        FROM ${schema}.USUARIO
        WHERE Legajo = @Legajo
      `);

    if (usuario.recordset.length === 0) {
      return res.status(400).json({
        mensaje: "No se encontró el usuario seleccionado.",
      });
    }

    const idUsuario = usuario.recordset[0].ID_Usuario;

    // Verificar duplicado
    const existente = await pool
      .request()
      .input("ID_Usuario", sql.Int, idUsuario).query(`
        SELECT COUNT(*) Cantidad
        FROM ${schema}.APP_ORDENES_USR
        WHERE ID_Usuario = @ID_Usuario
      `);

    if (existente.recordset[0].Cantidad > 0) {
      return res.status(409).json({
        mensaje: "Ese usuario ya existe.",
      });
    }

    // Insert
    await pool
      .request()
      .input("ID_Usuario", sql.Int, idUsuario)
      .input("Grupo", sql.VarChar, Grupo)
      .input("Grupo2", sql.VarChar, Grupo_BKP || null)
      .input("Modo", sql.VarChar, Modo)
      .input("MaxPorTrabajar", sql.Int, maxInt)
      .input("HoraDe", sql.VarChar(32), horaDeNorm)
      .input("HoraA", sql.VarChar(32), horaANorm)
      .input("SF_UserID", sql.VarChar, SF_UserID || null)
      .input("Asc_desc", sql.VarChar, Asc_desc || null)
      .input("Activo", sql.VarChar(20), "Inactivo")
      .input("Asignar", sql.VarChar(20), "No Asignar")
      .input("Script", sql.NVarChar(sql.MAX), Script || null).query(`
        INSERT INTO ${schema}.APP_ORDENES_USR
        (
          ID_Usuario,
          Grupo,
          Grupo2,
          Modo,
          Max_Por_Trabajar,
          Hora_De,
          Hora_A,
          SF_UserID,
          Asc_desc,
          Activo,
          Asignar,
          Script
        )
        VALUES
        (
          @ID_Usuario,
          @Grupo,
          @Grupo2,
          @Modo,
          @MaxPorTrabajar,
          @HoraDe,
          @HoraA,
          @SF_UserID,
          @Asc_desc,
          @Activo,
          @Asignar,
          @Script
        )
      `);

    res.status(201).json({
      mensaje: "Usuario de orden creado correctamente.",
    });
  } catch (error) {
    console.error("Error al crear usuario de orden:", error);

    res.status(500).json({
      mensaje: "Error interno del servidor.",
      error: error.message,
    });
  }
});

module.exports = router;
