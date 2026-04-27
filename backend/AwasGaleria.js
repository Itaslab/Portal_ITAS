//AwasGaleria.js

const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("./db");
const schema = process.env.DB_SCHEMA;

router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT 
        ID_WA,
        ID_AWA,
        ERR_AppORD,
        Titulo,
        Jira_Tarea,
        Estado,
        Fdesde,
        Fhasta,
        Origen,
        Sistema,
        Negocio,
        Sistemas_Analisis,
        Sistemas_Accion,
        Volumen_Diario,
        Esfuerzo,
        Tiempo_Manual,
        Referentes_ITSS,
        Referentes_N2,
        Id_Flujo_RPA,
        Prioridad_RPA,
        Max_Encoladas_RPA,
        Bajada,
        Limite_Bajada,
        FrecuenciaRPA,
        FrecuenciaRPA2,
        HS_Antiguedad_Bajada,
        RevITSS_x100,
        RevITSS_Max
      FROM ${schema}.AWAs
      ORDER BY ID_AWA DESC
    `);

    res.json(result.recordset);

  } catch (error) {
  console.error("💥 ERROR AWAS:", error.message);
  console.error("💥 STACK:", error);
  res.status(500).json({
    error: error.message
  });
}
});

module.exports = router;