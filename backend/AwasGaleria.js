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
        Tiempo_Manual_min,
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

// ============================
// CREATE AWA
// ============================
router.post("/", async (req, res) => {
  try {
    const pool = await poolPromise;

    const {
      ID_WA,
      Titulo,
      Estado,
      Origen,
      Sistema,
      Negocio,
      ERR_AppORD,
      Jira_Tarea,
      Fdesde,
      Fhasta,
      Id_Flujo_RPA,
      Prioridad_RPA,
      Max_Encoladas_RPA,
      FrecuenciaRPA,
      FrecuenciaRPA2,
      Volumen_Diario,
      Esfuerzo,
      HS_Antiguedad_Bajada,
      RevITSS_x100,
      RevITSS_Max
    } = req.body;

    // Insertar nuevo registro
    const result = await pool.request()
      .input("ID_WA", sql.VarChar, ID_WA || null)
      .input("Titulo", sql.VarChar, Titulo || null)
      .input("Estado", sql.VarChar, Estado || "Activo")
      .input("Origen", sql.VarChar, Origen || "Ordenes")
      .input("Sistema", sql.VarChar, Sistema || null)
      .input("Negocio", sql.VarChar, Negocio || "Hogar")
      .input("ERR_AppORD", sql.VarChar, ERR_AppORD || null)
      .input("Jira_Tarea", sql.VarChar, Jira_Tarea || null)
      .input("Fdesde", sql.Date, Fdesde || null)
      .input("Fhasta", sql.Date, Fhasta || null)
      .input("Id_Flujo_RPA", sql.Int, Id_Flujo_RPA || null)
      .input("Prioridad_RPA", sql.Int, Prioridad_RPA || null)
      .input("Max_Encoladas_RPA", sql.Int, Max_Encoladas_RPA || null)
      .input("FrecuenciaRPA", sql.Int, FrecuenciaRPA || null)
      .input("FrecuenciaRPA2", sql.Int, FrecuenciaRPA2 || null)
      .input("Volumen_Diario", sql.Decimal(18,2), Volumen_Diario || null)
      .input("Esfuerzo", sql.VarChar, Esfuerzo || null)
      .input("HS_Antiguedad_Bajada", sql.Int, HS_Antiguedad_Bajada || null)
      .input("RevITSS_x100", sql.Int, RevITSS_x100 || null)
      .input("RevITSS_Max", sql.Int, RevITSS_Max || null)

      .query(`
        INSERT INTO ${schema}.AWAs (
          ID_WA, Titulo, Estado, Origen, Sistema, Negocio, 
          ERR_AppORD, Jira_Tarea, Fdesde, Fhasta,
          Id_Flujo_RPA, Prioridad_RPA, Max_Encoladas_RPA, 
          FrecuenciaRPA, FrecuenciaRPA2, Volumen_Diario, Esfuerzo,
          HS_Antiguedad_Bajada, RevITSS_x100, RevITSS_Max
        )
        VALUES (
          @ID_WA, @Titulo, @Estado, @Origen, @Sistema, @Negocio,
          @ERR_AppORD, @Jira_Tarea, @Fdesde, @Fhasta,
          @Id_Flujo_RPA, @Prioridad_RPA, @Max_Encoladas_RPA,
          @FrecuenciaRPA, @FrecuenciaRPA2, @Volumen_Diario, @Esfuerzo,
          @HS_Antiguedad_Bajada, @RevITSS_x100, @RevITSS_Max
        );
        SELECT SCOPE_IDENTITY() AS newId;
      `);

    res.json({ 
      success: true, 
      newId: result.recordset[0].newId 
    });

  } catch (error) {
    console.error("💥 ERROR CREATE AWA:", error.message);
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GUARDAR CONFIGURACION 

// ============================
// UPDATE AWA
// ============================
router.put("/", async (req, res) => {
  try {
    const pool = await poolPromise;

    const {
      ID_AWA,
      ID_WA,
      Titulo,
      Estado,
      Origen,
      Sistema,
      Negocio,
      ERR_AppORD,
      Jira_Tarea,
      Fdesde,
      Fhasta,
      Id_Flujo_RPA,
      Prioridad_RPA,
      Max_Encoladas_RPA,
      FrecuenciaRPA,
      FrecuenciaRPA2,
      Volumen_Diario,
      Esfuerzo,
      HS_Antiguedad_Bajada,
      RevITSS_x100,
      RevITSS_Max
    } = req.body;

    await pool.request()
      // IDs
      .input("ID_AWA", sql.Int, ID_AWA)
      .input("ID_WA", sql.VarChar, ID_WA || null)

      // Básico
      .input("Titulo", sql.VarChar, Titulo || null)

      // Operativo
      .input("Estado", sql.VarChar, Estado || null)
      .input("Origen", sql.VarChar, Origen || null)
      .input("Sistema", sql.VarChar, Sistema || null)
      .input("Negocio", sql.VarChar, Negocio || null)
      .input("ERR_AppORD", sql.VarChar, ERR_AppORD || null)
      .input("Jira_Tarea", sql.VarChar, Jira_Tarea || null)

      // Fechas
      .input("Fdesde", sql.Date, Fdesde || null)
      .input("Fhasta", sql.Date, Fhasta || null)

      // RPA
      .input("Id_Flujo_RPA", sql.Int, Id_Flujo_RPA || null)
      .input("Prioridad_RPA", sql.Int, Prioridad_RPA || null)
      .input("Max_Encoladas_RPA", sql.Int, Max_Encoladas_RPA || null)
      .input("FrecuenciaRPA", sql.Int, FrecuenciaRPA || null)
      .input("FrecuenciaRPA2", sql.Int, FrecuenciaRPA2 || null)

      // Métricas
      .input("Volumen_Diario", sql.Decimal(18,2), Volumen_Diario || null)
      .input("Esfuerzo", sql.VarChar, Esfuerzo || null)
      .input("HS_Antiguedad_Bajada", sql.Int, HS_Antiguedad_Bajada || null)
      .input("RevITSS_x100", sql.Int, RevITSS_x100 || null)
      .input("RevITSS_Max", sql.Int, RevITSS_Max || null)

      .query(`
        UPDATE ${schema}.AWAs
        SET
          ID_WA = @ID_WA,
          Titulo = @Titulo,
          Estado = @Estado,
          Origen = @Origen,
          Sistema = @Sistema,
          Negocio = @Negocio,
          ERR_AppORD = @ERR_AppORD,
          Jira_Tarea = @Jira_Tarea,
          Fdesde = @Fdesde,
          Fhasta = @Fhasta,
          Id_Flujo_RPA = @Id_Flujo_RPA,
          Prioridad_RPA = @Prioridad_RPA,
          Max_Encoladas_RPA = @Max_Encoladas_RPA,
          FrecuenciaRPA = @FrecuenciaRPA,
          FrecuenciaRPA2 = @FrecuenciaRPA2,
          Volumen_Diario = @Volumen_Diario,
          Esfuerzo = @Esfuerzo,
          HS_Antiguedad_Bajada = @HS_Antiguedad_Bajada,
          RevITSS_x100 = @RevITSS_x100,
          RevITSS_Max = @RevITSS_Max
        WHERE ID_AWA = @ID_AWA
      `);

    res.json({ success: true });

  } catch (error) {
    console.error("💥 ERROR UPDATE AWAS:", error.message);
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================
// TOGGLE ESTADO AWA
// ============================
router.put("/toggle/:id", async (req, res) => {
  try {
    const pool = await poolPromise;
    const { id } = req.params;

    // 1. Obtener estado actual
    const result = await pool.request()
      .input("ID_AWA", sql.Int, id)
      .query(`
        SELECT Estado
        FROM ${schema}.AWAs
        WHERE ID_AWA = @ID_AWA
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "AWA no encontrada" });
    }

    const estadoActual = result.recordset[0].Estado;

    // 2. Definir nuevo estado
    const nuevoEstado = estadoActual === "Activo" ? "Inactivo" : "Activo";

    // 3. Update
    await pool.request()
      .input("ID_AWA", sql.Int, id)
      .input("Estado", sql.VarChar, nuevoEstado)
      .query(`
        UPDATE ${schema}.AWAs
        SET Estado = @Estado
        WHERE ID_AWA = @ID_AWA
      `);

    res.json({
      success: true,
      nuevoEstado
    });

  } catch (error) {
    console.error("💥 ERROR TOGGLE AWA:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;