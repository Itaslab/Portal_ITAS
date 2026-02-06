// galeriaEjecuciones_paginadas.js
const { sql, poolPromise } = require("./db");
const schema = process.env.DB_SCHEMA;

module.exports = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const offset = (page - 1) * limit;

  const dato = (req.query.dato || "").trim();
  const solicitante = (req.query.solicitante || "").trim();
  const registro = (req.query.registro || "").trim();

  let where = "WHERE 1=1";

  // 🔹 Filtro solicitante
  if (solicitante) {
    where += " AND U.Email LIKE @solicitante";
  }

  // 🔹 Filtro registro (ID / identificador / email / flujo)
  if (registro) {
    where += `
      AND (
        CAST(T.Id_Tasklist AS VARCHAR) LIKE @registro
        OR T.Identificador LIKE @registro
        OR U.Email LIKE @registro
        OR F.Titulo LIKE @registro
      )
    `;
  }

  // 🔹 Filtro por DATO (GLOBAL, real)
  if (dato) {
    where += `
      AND EXISTS (
        SELECT 1
        FROM ${schema}.RPA_RESULTADOS R
        WHERE R.Id_Tasklist = T.Id_Tasklist
          AND R.Dato LIKE @dato
      )
    `;
  }

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
      ${where}
      ORDER BY T.Id_Tasklist DESC
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;

    const request = pool
      .request()
      .input("offset", sql.Int, offset)
      .input("limit", sql.Int, limit);

    if (solicitante) {
      request.input("solicitante", sql.VarChar, `%${solicitante}%`);
    }

    if (registro) {
      request.input("registro", sql.VarChar, `%${registro}%`);
    }

    if (dato) {
      request.input("dato", sql.VarChar, `%${dato}%`);
    }

    const result = await request.query(query);

    res.json({
      success: true,
      page,
      limit,
      data: result.recordset
    });

  } catch (err) {
    console.error("Error ejecuciones paginadas:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};
