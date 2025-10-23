const { sql, poolPromise } = require("./db");

module.exports = async (req, res) => {
  try {
    const pool = await poolPromise;

    const query = `
select U.Email,
	   TE.Estado,
	   T.Id_Tasklist,
	   T.Titulo_Tasklist,
	   T.Identificador,
	   T.Id_Estado,
	   T.Fecha_Inicio,
	   T.Fecha_Fin, 
	   T.Avance,
	   T.Resultado  from  a002103.USUARIO U, a002103.RPA_TASKLIST_ESTADO TE, a002103.RPA_TASKLIST T
	   where  T.Id_Usuario = U.Id_Usuario
	   and T.Id_Estado = TE.Id_Estado
 
    `;

    const result = await pool.request().query(query);

    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error("Error al consultar ejecucionesRealizadas:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};


