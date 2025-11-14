// appOrdenesSF_GaleriaScripts.js
const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db"); // ajustá la ruta según tu estructura

// GET /api/scripts  -> lista
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const query = `
      SELECT
        ID,
        Nombre,
        Descripcion,
        Negocio,
        Delay,
        Esquema_JSON,
        Script,
        ISNULL(CONVERT(VARCHAR(10), Vigencia_Desde, 120), '') AS Vigencia_Desde,
        ISNULL(CONVERT(VARCHAR(10), Vigencia_Hasta, 120), '') AS Vigencia_Hasta,
        Activo
      FROM a002103.APP_ORDENES_BAJADA
      ORDER BY Nombre;
    `;
    const result = await pool.request().query(query);
    const bajadas = result.recordset.map(b => ({
      id: b.ID,
      nombre: b.Nombre,
      descripcion: b.Descripcion,
      negocio: b.Negocio,
      delay: b.Delay,
      esquema: b.Esquema_JSON,
      script: b.Script,
      vigencia_desde: b.Vigencia_Desde,
      vigencia_hasta: b.Vigencia_Hasta,
      activo: b.Activo
    }));
    res.json({ success: true, bajadas });
  } catch (err) {
    console.error("Error al obtener bajadas:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/scripts/:id -> detalle
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    const result = await pool.request()
      .input("id", sql.Int, id)
      .query(`
        SELECT
          ID,
          Nombre,
          Descripcion,
          Negocio,
          Delay,
          Esquema_JSON,
          Script,
          ISNULL(CONVERT(VARCHAR(10), Vigencia_Desde, 120), '') AS Vigencia_Desde,
          ISNULL(CONVERT(VARCHAR(10), Vigencia_Hasta, 120), '') AS Vigencia_Hasta,
          Activo
        FROM a002103.APP_ORDENES_BAJADA
        WHERE ID = @id;
      `);

    if (!result.recordset || result.recordset.length === 0) {
      return res.status(404).json({ success: false, error: "No encontrado" });
    }
    const b = result.recordset[0];
    const bajada = {
      id: b.ID,
      nombre: b.Nombre,
      descripcion: b.Descripcion,
      negocio: b.Negocio,
      delay: b.Delay,
      esquema: b.Esquema_JSON,
      script: b.Script,
      vigencia_desde: b.Vigencia_Desde,
      vigencia_hasta: b.Vigencia_Hasta,
      activo: b.Activo
    };
    res.json({ success: true, bajada });
  } catch (err) {
    console.error("Error al obtener detalle:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/scripts/:id -> update
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let { nombre, negocio, script, esquema_json, activo, vigencia_desde, vigencia_hasta } = req.body;

    if (!id) return res.status(400).json({ success: false, error: "Falta el ID" });

    // Normalizaciones
    activo = activo ? 1 : 0;
    // Ajustar nullables
    nombre = nombre || null;
    negocio = negocio || null;
    script = script || null;
    esquema_json = esquema_json || null;
    vigencia_desde = vigencia_desde || null;
    vigencia_hasta = vigencia_hasta || null;

    const pool = await poolPromise;
    const request = pool.request()
      .input("nombre", sql.VarChar, nombre)
      .input("negocio", sql.VarChar, negocio)
      .input("script", sql.Text, script) // usar Text para scripts largos
      .input("esquema_json", sql.VarChar, esquema_json)
      .input("activo", sql.Bit, activo)
      .input("vigencia_desde", sql.Date, vigencia_desde)
      .input("vigencia_hasta", sql.Date, vigencia_hasta)
      .input("id", sql.Int, id);

    const query = `
      UPDATE a002103.APP_ORDENES_BAJADA
      SET 
        Nombre = COALESCE(@nombre, Nombre),
        Negocio = COALESCE(@negocio, Negocio),
        Script = COALESCE(@script, Script),
        Esquema_JSON = COALESCE(@esquema_json, Esquema_JSON),
        Activo = @activo,
        Vigencia_Desde = CASE WHEN @vigencia_desde IS NULL THEN Vigencia_Desde ELSE @vigencia_desde END,
        Vigencia_Hasta = CASE WHEN @vigencia_hasta IS NULL THEN Vigencia_Hasta ELSE @vigencia_hasta END
      WHERE ID = @id;
    `;

    await request.query(query);

    res.json({ success: true, message: "Orden actualizada correctamente" });
  } catch (err) {
    console.error("Error al actualizar orden:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
