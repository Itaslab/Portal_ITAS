//crearLicencia.js

const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("./db");
const schema = process.env.DB_SCHEMA;




//CREAR LICENCIA
router.post("/", async (req, res) => {

  try {

    const { tipoLic, fechaDesde, fechaHasta } = req.body;

    const idUsuario = req.session.user.ID_Usuario;

    const pool = await poolPromise;

    // Buscar legajo del usuario
    const legajoResult = await pool.request()
      .input("idUsuario", sql.Int, idUsuario)
      .query(`
        SELECT Legajo
        FROM ${schema}.USUARIO
        WHERE ID_Usuario = @idUsuario
      `);

    const legajo = legajoResult.recordset[0].Legajo;

    // Generar AñoMes
    const hoy = new Date();
    const anioMes = hoy.getFullYear().toString() +
      String(hoy.getMonth() + 1).padStart(2, "0");

    // Insert licencia
    await pool.request()
      .input("tipoLic", sql.VarChar, tipoLic)
      .input("fechaDesde", sql.Date, fechaDesde)
      .input("fechaHasta", sql.Date, fechaHasta)
      .input("idUsuario", sql.Int, idUsuario)
      .input("legajo", sql.VarChar, legajo)
      .input("anioMes", sql.Int, anioMes)
      .query(`
        INSERT INTO ${schema}.LICENCIAS_SMART
        (Licencia, Fecha_Desde, Fecha_Hasta, ID_Usuario, Legajo, Smart, Estado, AnioMes)
        VALUES
        (@tipoLic, @fechaDesde, @fechaHasta, @idUsuario, @legajo, 'No', 'PENDING', @anioMes)
      `);

    res.json({ success: true });

  } catch (error) {

    console.error("Error creando licencia:", error);

    res.status(500).json({
      success: false,
      error: "Error al crear licencia"
    });

  }

});

//ELIMINAR LICENCIA

router.delete("/:id", async (req, res) => {
  try {

    const id = parseInt(req.params.id)
    const idUsuario = req.session.user.ID_Usuario;

    const pool = await poolPromise;

    // 🔥 Solo permite borrar si es del usuario y está PENDING
    const result = await pool.request()
      .input("id", sql.Int, id)
      .input("idUsuario", sql.Int, idUsuario)
      .query(`
        DELETE FROM ${schema}.LICENCIAS_SMART
        WHERE ID = @id
        AND UPPER(Estado) = 'PENDING'
      `);

    if (result.rowsAffected[0] === 0) {
      return res.json({
        success: false,
        error: "No se puede eliminar (no es PENDING o no es tuya)"
      });
    }

    res.json({ success: true });

  } catch (error) {
    console.error("Error eliminando licencia:", error);
    res.status(500).json({
      success: false,
      error: "Error al eliminar licencia"
    });
  }
});


//EDITAR LICENCIA

router.put("/:id", async (req, res) => {

  try {

 
    const id = parseInt(req.params.id)
    const { tipoLic, fechaDesde, fechaHasta } = req.body;

    const idUsuario = req.session.user.ID_Usuario;

    const pool = await poolPromise;

    const result = await pool.request()
      .input("id", sql.Int, id)
      .input("tipoLic", sql.VarChar, tipoLic)
      .input("fechaDesde", sql.Date, fechaDesde)
      .input("fechaHasta", sql.Date, fechaHasta)
      .input("idUsuario", sql.Int, idUsuario)
      .query(`
        UPDATE ${schema}.LICENCIAS_SMART
        SET 
          Licencia = @tipoLic,
          Fecha_Desde = @fechaDesde,
          Fecha_Hasta = @fechaHasta
        WHERE ID = @id
        AND UPPER(Estado) = 'PENDING'

      `);

    if (result.rowsAffected[0] === 0) {
      return res.json({
        success: false,
        error: "No se puede editar (no es PENDING o no es tuya)"
      });
    }

    res.json({ success: true });

  } catch (error) {

    console.error("Error editando licencia:", error);

    res.status(500).json({
      success: false,
      error: "Error al editar licencia"
    });

  }

});
``


module.exports = router;


