const { sql, poolPromise } = require("./db");
const schema = process.env.DB_SCHEMA;

module.exports = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const solicitante = (req.query.solicitante || "").trim();
    const registro = (req.query.registro || "").trim();

    const pool = await poolPromise;

    let idsPorDato = null;

    // 🔹 1) Buscar IDs por DATO (solo si registro >= 3)
    if (registro.length >= 3) {
      const resultDato = await pool
        .request()
        .input("dato", sql.VarChar, `%${registro}%`)
        .query(`
          SELECT DISTINCT Id_Tasklist
          FROM ${schema}.RPA_RESULTADOS
          WHERE Dato COLLATE Latin1_General_CI_AI LIKE @dato
        `);

      idsPorDato = resultDato.recordset.map(r => r.Id_Tasklist);
    }

    let where = "WHERE 1=1";

    // 🔹 2) Filtro solicitante (solo Email)
    if (solicitante) {
      where += " AND U.Email COLLATE Latin1_General_CI_AI LIKE @solicitante";
    }

    // 🔹 3) Filtro registro (Titulo Tasklist, Identificador o Dato)
    if (registro) {
      where += `
        AND (
          T.Titulo_Tasklist COLLATE Latin1_General_CI_AI LIKE @registro
          OR T.Identificador COLLATE Latin1_General_CI_AI LIKE @registro
          ${
            idsPorDato && idsPorDato.length
              ? `OR T.Id_Tasklist IN (${idsPorDato.join(",")})`
              : ""
          }
        )
      `;
    }

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
      JOIN ${schema}.RPA_TASKLIST T ON T.Id_Usuario = U.Id_Usuario
      JOIN ${schema}.RPA_TASKLIST_ESTADO TE ON T.Id_Estado = TE.Id_Estado
      JOIN ${schema}.RPA_FLUJOS F ON F.Id_Flujo = T.Id_Flujo
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

    const result = await request.query(query);

    res.json({
      success: true,
      page,
      limit,
      data: result.recordset
    });

  } catch (err) {
    console.error("Error ejecuciones paginadas:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
