const { sql, poolPromise } = require("./db");

module.exports = async (req, res) => {
  try {
    const pool = await poolPromise;

    const query = `
      SELECT 
          T.Id_Tasklist,
          T.Titulo_Tasklist,
          U.Apellido AS Usuario,       -- 🔹 Trae el apellido desde RPA_USUARIOS
          E.Estado AS Estado,           -- 🔹 Trae el nombre del estado desde RPA_TASKLIST_ESTADOS
          T.Avance,
          T.Resultado
      FROM a002103.RPA_TASKLIST AS T
      LEFT JOIN a002103.RPA_USUARIOS AS U ON T.Id_Usuario = U.Id_Usuario
      LEFT JOIN a002103.RPA_TASKLIST_ESTADOS AS E ON T.Id_Estado = E.Id_Estado
      ORDER BY T.Id_Tasklist DESC
    `;

    const result = await pool.request().query(query);

    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error("Error al consultar ejecucionesRealizadas:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};


