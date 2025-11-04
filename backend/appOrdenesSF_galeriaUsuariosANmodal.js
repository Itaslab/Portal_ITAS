// appOrdenesSF_galeriaUsuariosANmodal.js
const { sql, poolPromise } = require("./db");

module.exports = async (req, res) => {
  try {
    // ✅ Tomamos el ID del usuario desde la sesión o del body/query según lo que uses
    const idUsuario = req.session?.user?.ID_Usuario || req.query.idUsuario || req.body.idUsuario;

    if (!idUsuario) {
      return res.status(400).json({ success: false, error: "Falta el parámetro idUsuario" });
    }

    const pool = await poolPromise;

    const query = `
      SELECT 
          ISNULL(u.Nombre, '') + ' ' + ISNULL(u.Apellido, '') AS Nombre,
          u.Email,
          u.Referente,
          ap.SF_UserID,
          ap.Grupo,
          ap.Grupo2,
          ap.Modo,
          ap.Max_Por_Trabajar,
          ap.Hora_De,
          ap.Hora_A,
          ap.Activo,
          ap.Asignar,
          ISNULL(CONVERT(VARCHAR, ap.Hora_De), '') + ' - ' + ISNULL(CONVERT(VARCHAR, ap.Hora_A), '') AS Horario
      FROM 
          a002103.USUARIO u
      INNER JOIN 
          a002103.APP_ORDENES_USR ap ON u.ID_Usuario = ap.ID_Usuario
      WHERE
          u.ID_Usuario = @idUsuario;
    `;

    const result = await pool
      .request()
      .input("idUsuario", sql.Int, idUsuario)
      .query(query);

    const usuarios = result.recordset.map(u => ({
      nombre: u.Nombre,
      email: u.Email,
      referente: u.Referente,
      sf_user_id: u.SF_UserID,
      grupo: u.Grupo,
      grupo2: u.Grupo2,
      modo: u.Modo,
      max: u.Max_Por_Trabajar,
      desde: u.Hora_De,
      hasta: u.Hora_A,
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
