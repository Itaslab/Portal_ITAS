const { sql, poolPromise } = require("./db");

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
           FROM a002103.USUARIO U
           JOIN a002103.RPA_TASKLIST T ON T.Id_Usuario = U.Id_Usuario
           JOIN a002103.RPA_TASKLIST_ESTADO TE ON T.Id_Estado = TE.Id_Estado
           ORDER BY T.Id_Tasklist DESC;
           `;

    const result = await pool.request().query(query);

    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error("Error al consultar ejecucionesRealizadas:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};


// BOTONES DE LA GALERIA DE EJECUCIONES 

// BOTON OJO : TOTAL 

app.get('/api/ejecuciones/detalle/:id', async (req, res) => {
  try {
    const idTasklist = req.params.id;
    const pool = await poolPromise;

    const query = `
        SELECT 
            r.Dato,
            r.Accion,
            r.Resultado,
            rf.Campos,
            rf.Campos_Accion,
            rf.Campos_Resultado
        FROM a002103.RPA_RESULTADOS r
        INNER JOIN a002103.RPA_TASKLIST t ON r.Id_Tasklist = t.Id_Tasklist
        INNER JOIN a002103.RPA_FLUJOS rf ON t.Id_Flujo = rf.Id_Flujo
        WHERE t.Id_Tasklist = @idTasklist
    `;

    const result = await pool
      .request()
      .input("idTasklist", sql.Int, idTasklist)
      .query(query);

    res.json(result.recordset);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo datos" });
  }
});


