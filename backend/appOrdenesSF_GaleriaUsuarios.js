// appOrdenesSF_galeriaUsuarios.js
const { sql, poolPromise } = require("./db");
const schema = process.env.DB_SCHEMA;


module.exports = async (req, res) => {
  try {
    const pool = await poolPromise;

    const query = `
    SELECT 
        ap.ID_Usuario,
        ISNULL(u.Nombre, '') + ' ' + ISNULL(u.Apellido, '') AS Nombre,
        ap.Grupo,
        ap.Grupo2,
        ap.Modo,
        ap.Max_Por_Trabajar,
        ISNULL(CONVERT(VARCHAR(8), ap.Hora_De, 108), '') AS Hora_De,
        ISNULL(CONVERT(VARCHAR(8), ap.Hora_A, 108), '') AS Hora_A,
        ap.Activo,
        ap.Asignar
      FROM 
        ${schema}.APP_ORDENES_USR ap
      INNER JOIN 
        ${schema}.USUARIO u ON u.ID_Usuario = ap.ID_Usuario
      ORDER BY u.Nombre;
    `;


    

    const result = await pool.request().query(query);

    const usuarios = result.recordset.map(u => ({
      id_usuario: u.ID_Usuario,           // <= clave para updates
      nombre: u.Nombre,
      grupo: u.Grupo,
      grupo2: u.Grupo2,
      modo: u.Modo,
      max: u.Max_Por_Trabajar,
      desde: u.Hora_De,
      hasta: u.Hora_A,
      activo: u.Activo,
      asignar: u.Asignar
    }));

    res.json({ success: true, usuarios });
  } catch (err) {
    console.error("Error al obtener usuarios (galería):", err);
    res.status(500).json({ success: false, error: err.message });
  }
};
