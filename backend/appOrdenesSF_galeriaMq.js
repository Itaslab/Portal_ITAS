// appOrdenesSF_galeriaMQ.js

const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("./db");
const schema = process.env.DB_SCHEMA;


router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;

    const query = `
      SELECT 
        AM.Id_AMQ_Accion,
        AM.Titulo_AMQ,
        AM.Descripcion,
        AM.Inbox,
        AA.Accion
      FROM 
        ${schema}.RPA_AUTO_MQ AM
      INNER JOIN 
        ${schema}.RPA_AMQ_ACCION AA ON AA.Id_AMQ_Accion = AM.Id_AMQ_Accion
      ORDER BY AM.Titulo_AMQ;
    `;

    const result = await pool.request().query(query);

    const autoMQ = result.recordset.map(item => ({
      id_accion: item.Id_AMQ_Accion,
      titulo: item.Titulo_AMQ,
      descripcion: item.Descripcion,
      inbox: item.Inbox,
      accion: item.Accion
    }));

    res.json({ success: true, autoMQ });

  } catch (err) {
    console.error("Error al obtener AutoMQ (galería):", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
