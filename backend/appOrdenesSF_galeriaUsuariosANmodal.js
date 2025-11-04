// appOrdenesSF_galeriaUsuariosANmodal.js
const { sql, poolPromise } = require("./db");

module.exports = async (req, res) => {
  try {
    const pool = await poolPromise;

    const query = `
      SELECT 
          ISNULL(u.Nombre, '') + ' ' + ISNULL(u.Apellido, '') AS Nombre,
          u.Email,
          u.Referente,
          ap.SF_UserID,
          ap.Grupo,
          ap.Grupo_BKP,
          ap.Modo,
          ap.Max,
          ap.Desde,
          ap.Hasta,
          ap.Activo,
          ap.Asignar,
          ISNULL(CONVERT(VARCHAR, ap.Hora_De), '') + ' - ' + ISNULL(CONVERT(VARCHAR, ap.Hora_A), '') AS Horario
      FROM 
          a002103.USUARIO u
      INNER JOIN 
          a002103.APP_ORDENES_USR ap ON u.ID_Usuario = ap.ID_Usuario;
    `;

    const result = await pool.request().query(query);

    const usuarios = result.recordset.map(u => ({
      nombre: u.Nombre,
      email: u.Email,
      referente: u.Referente,
      sf_user_id: u.SF_UserID,
      grupo: u.Grupo,
      grupo_bkp: u.Grupo_BKP,
      modo: u.Modo,
      max: u.Max,
      desde: u.Desde,
      hasta: u.Hasta,
      activo: u.Activo,
      asignar: u.Asignar,
      horario: u.Horario
    }));

    res.json({ success: true, usuarios });
  } catch (err) {
    console.error("Error al obtener usuarios:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};
