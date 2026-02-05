//galeriaEjecuciones_paginadas.js


const { sql, poolPromise } = require("./db");
const schema = process.env.DB_SCHEMA;

const page = parseInt(req.query.page) || 1;
const limit = parseInt(req.query.limit) || 50;
const offset = (page - 1) * limit;

module.exports = async (req, res) => {
  try {
    const pool = await poolPromise;
 
           const query = `
           SELECT
           U.Email,
             TE.Estado,
             TE.Color,
             T.Id_Tasklist,
             T.Titulo_Tasklist,
             F.Titulo AS Titulo_Flujo,
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
           JOIN ${schema}.RPA_TASKLIST T 
             ON T.Id_Usuario = U.Id_Usuario
           JOIN ${schema}.RPA_TASKLIST_ESTADO TE 
             ON T.Id_Estado = TE.Id_Estado
           JOIN ${schema}.RPA_FLUJOS F
             ON F.Id_Flujo = T.Id_Flujo
           ORDER BY T.Id_Tasklist DESC
            OFFSET @offset ROWS
            FETCH NEXT @limit ROWS ONLY
           `;
 
    const result = await pool
  .request()
  .input("offset", sql.Int, offset)
  .input("limit", sql.Int, limit)
  .query(query);
 
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error("Error al consultar ejecucionesRealizadas:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};