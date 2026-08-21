const { sql, poolPromise } = require("./db");
const schema = process.env.DB_SCHEMA;
const express = require("express");
const router = express.Router();

// POST /usuarios/actualizar
router.post("/actualizar", async (req, res) => {
  try {
    const usuarioEditorId = req.session?.user?.ID_Usuario || "desconocido";

    const {
      id_usuario,
      grupo,
      grupo2,
      max_por_trabajar,
      asc_desc,
      modo,
      script,
      des_asignar,
    } = req.body;

    if (!id_usuario) {
      return res
        .status(400)
        .json({ success: false, error: "Falta id_usuario" });
    }

    const pool = await poolPromise;

    const norm = (v) => (v ?? "").toString().trim();
    const val = (v) =>
      v === null || v === undefined || v === "" ? "(vacío)" : v;

    const resultActual = await pool
      .request()
      .input("id_usuario", sql.Int, id_usuario).query(`
        SELECT Grupo, Grupo2, Max_Por_Trabajar, Asc_Desc, Modo, Script, Des_Asignar, LogDeCambios
        FROM ${schema}.APP_ORDENES_USR
        WHERE ID_Usuario = @id_usuario
      `);

    const actual = resultActual.recordset[0];
    if (!actual) {
      return res
        .status(404)
        .json({ success: false, error: "Usuario no encontrado" });
    }

    const logActual = actual.LogDeCambios || "";
    const cambios = [];

    if (norm(actual.Grupo) !== norm(grupo))
      cambios.push(`- Grupo: ${val(actual.Grupo)} → ${val(grupo)}`);
    if (norm(actual.Grupo2) !== norm(grupo2))
      cambios.push(`- Grupo2: ${val(actual.Grupo2)} → ${val(grupo2)}`);
    if (Number(actual.Max_Por_Trabajar) !== Number(max_por_trabajar))
      cambios.push(
        `- Max: ${val(actual.Max_Por_Trabajar)} → ${val(max_por_trabajar)}`,
      );
    if (norm(actual.Asc_Desc) !== norm(asc_desc))
      cambios.push(`- Forma: ${val(actual.Asc_Desc)} → ${val(asc_desc)}`);
    if (norm(actual.Modo) !== norm(modo))
      cambios.push(`- Modo: ${val(actual.Modo)} → ${val(modo)}`);
    if (norm(actual.Script) !== norm(script))
      cambios.push(`- Script: ${val(actual.Script)} → ${val(script)}`);
    if (Number(actual.Des_Asignar) !== (des_asignar ? 1 : 0))
      cambios.push(
        `- Des_Asignar: ${val(actual.Des_Asignar)} → ${val(des_asignar ? 1 : 0)}`,
      );

    let logFinal = logActual;
    if (cambios.length > 0) {
      const fecha = new Date().toISOString().slice(0, 19).replace("T", " ");
      const nuevoLog =
        `[${fecha}] Usuario ${usuarioEditorId} cambió:\n` + cambios.join("\n");
      logFinal = logActual ? logActual + "\n\n" + nuevoLog : nuevoLog;
    }

    await pool
      .request()
      .input("grupo", sql.VarChar, grupo || null)
      .input("grupo2", sql.VarChar, grupo2 || null)
      .input("max_por_trabajar", sql.Int, max_por_trabajar || 0)
      .input("asc_desc", sql.VarChar, asc_desc || null)
      .input("modo", sql.VarChar, modo || null)
      .input("script", sql.VarChar(sql.MAX), script || null)
      .input("des_asignar", sql.Bit, des_asignar ? 1 : 0)
      .input("log", sql.VarChar(sql.MAX), logFinal)
      .input("id_usuario", sql.Int, id_usuario).query(`
        UPDATE ${schema}.APP_ORDENES_USR
        SET Grupo=@grupo, Grupo2=@grupo2, Max_Por_Trabajar=@max_por_trabajar,
            Asc_Desc=@asc_desc, Modo=@modo, Script=@script,
            Des_Asignar=@des_asignar, LogDeCambios=@log
        WHERE ID_Usuario=@id_usuario;
      `);

    res.json({ success: true, message: "Usuario actualizado correctamente" });
  } catch (err) {
    console.error("Error al actualizar usuario:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /finalizar-vigencia
router.put("/finalizar-vigencia", async (req, res) => {
  try {
    const usuarioEditorId = req.session?.user?.ID_Usuario || "desconocido";
    const { id_usuario } = req.body;

    if (!id_usuario) {
      return res
        .status(400)
        .json({ success: false, error: "Falta id_usuario" });
    }

    const pool = await poolPromise;
    const result = await pool.request().input("id_usuario", sql.Int, id_usuario)
      .query(`
        SELECT LogDeCambios FROM ${schema}.APP_ORDENES_USR WHERE ID_Usuario = @id_usuario
      `);

    if (result.recordset.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Usuario no encontrado" });
    }

    const logActual = result.recordset[0].LogDeCambios || "";
    const fechaLog = new Date().toISOString().slice(0, 19).replace("T", " ");
    const fechaVigencia = new Date().toISOString().slice(0, 10);
    const nuevoLog = `[${fechaLog}] Usuario ${usuarioEditorId} finalizó la vigencia. Fecha: ${fechaVigencia}`;
    const logFinal = logActual ? logActual + "\n\n" + nuevoLog : nuevoLog;

    await pool
      .request()
      .input("id_usuario", sql.Int, id_usuario)
      .input("log", sql.VarChar(sql.MAX), logFinal).query(`
        UPDATE ${schema}.APP_ORDENES_USR
        SET Vigencia_Hasta = CAST(GETDATE() AS DATE),
        LogDeCambios = @log,
        Activo = 'Inactivo',
        Asignar = 'No Asignar'
        WHERE ID_Usuario = @id_usuario
      `);

    res.json({ success: true, message: "Vigencia finalizada correctamente." });
  } catch (err) {
    console.error("Error al finalizar vigencia:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /usuarios/:id_usuario/sf-user-id
router.put("/:id_usuario/sf-user-id", async (req, res) => {
  try {
    const usuarioEditorId = req.session?.user?.ID_Usuario || "desconocido";

    const id_usuario = parseInt(req.params.id_usuario, 10);
    const { sf_user_id } = req.body;

    if (!id_usuario) {
      return res.status(400).json({
        success: false,
        error: "Falta id_usuario",
      });
    }

    const pool = await poolPromise;

    // Obtener el valor actual
    const resultActual = await pool
      .request()
      .input("id_usuario", sql.Int, id_usuario).query(`
        SELECT SF_UserID, LogDeCambios
        FROM ${schema}.APP_ORDENES_USR
        WHERE ID_Usuario = @id_usuario
      `);

    if (resultActual.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Usuario no encontrado",
      });
    }

    const actual = resultActual.recordset[0];

    const sfActual = actual.SF_UserID ?? "";
    const sfNuevo = (sf_user_id ?? "").toString().trim();

    // Si no cambió, no hacemos nada
    if (sfActual.toString().trim() === sfNuevo) {
      return res.json({
        success: true,
        message: "El SF User ID no tuvo cambios.",
      });
    }

    // Log
    const fecha = new Date().toISOString().slice(0, 19).replace("T", " ");

    const nuevoLog =
      `[${fecha}] Usuario ${usuarioEditorId} cambió:\n` +
      `- SF User ID: ${sfActual || "(vacío)"} → ${sfNuevo || "(vacío)"}`;

    const logActual = actual.LogDeCambios || "";
    const logFinal = logActual ? logActual + "\n\n" + nuevoLog : nuevoLog;

    // Actualizar
    await pool
      .request()
      .input("id_usuario", sql.Int, id_usuario)
      .input("sf_user_id", sql.VarChar, sfNuevo || null)
      .input("log", sql.VarChar(sql.MAX), logFinal).query(`
        UPDATE ${schema}.APP_ORDENES_USR
        SET 
          SF_UserID = @sf_user_id,
          LogDeCambios = @log
        WHERE ID_Usuario = @id_usuario
      `);

    res.json({
      success: true,
      message: "SF User ID actualizado correctamente.",
    });
  } catch (err) {
    console.error("Error al actualizar SF User ID:", err);

    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

module.exports = router;
