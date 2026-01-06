//galeriaEjecuciones.js
const { sql, poolPromise } = require("./db");
const schema = process.env.DB_SCHEMA;

 
module.exports = async (req, res) => {
  try {
    const pool = await poolPromise;
 
    const query = `
         SELECT
           U.Email,
           TE.Estado,
           T.Id_Tasklist,
           T.Titulo_Tasklist,
           T.Identificador,
           T.Id_Estado,
           T.Fecha_Inicio,
           T.Fecha_Fin,
           T.Avance,
           T.Resultado,
           T.Reg_Totales,
           T.Reg_Proc_OK,
           T.Reg_Proc_NOK
           FROM ${schema}.USUARIO U
           JOIN ${schema}.RPA_TASKLIST T ON T.Id_Usuario = U.Id_Usuario
           JOIN ${schema}.RPA_TASKLIST_ESTADO TE ON T.Id_Estado = TE.Id_Estado
           ORDER BY T.Id_Tasklist DESC;
           `;
 
    const result = await pool.request().query(query);
 
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error("Error al consultar ejecucionesRealizadas:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};