// appOrdenesSF_usuarioDetalle.js
const { sql, poolPromise } = require("./db");

module.exports = async (req, res) => {
  try {
    const id = parseInt(req.params.id_usuario, 10);
    if (!id) return res.status(400).json({ success: false, error: "Falta id_usuario" });

    const pool = await poolPromise;

    const query = `
      SELECT 
        ap.ID_Usuario,
        ISNULL(u.Nombre, '') + ' ' + ISNULL(u.Apellido, '') AS Nombre,
        u.Email,
        ap.SF_UserID,
        u.Referente,
        ap.Activo,
        ap.Grupo,
        ap.Grupo2,
        ap.Max_Por_Trabajar,
        ap.Asc_Desc,            -- asegúrate que exista esa columna
        ap.Modo,
        ap.Des_Asignar,     -- idem
        ap.Script            -- idem
      FROM 
        a002103.APP_ORDENES_USR ap
      INNER JOIN 
        a002103.USUARIO u ON u.ID_Usuario = ap.ID_Usuario
      WHERE ap.ID_Usuario = @id;
    `;

    const result = await pool.request()
      .input("id", sql.Int, id)
      .query(query);

    if (!result.recordset.length) {
      return res.status(404).json({ success: false, error: "Usuario no encontrado" });
    }

    const u = result.recordset[0];
    const usuario = {
      id_usuario: u.ID_Usuario,
      nombre: u.Nombre,
      email: u.Email,
      sf_user_id: u.SF_UserID,
      referente: u.Referente,
      activo: u.Activo,
      grupo: u.Grupo,
      grupo2: u.Grupo2,
      max: u.Max_Por_Trabajar,
      forma: u.Asc_Desc,
      modo: u.Modo,
      des_asignar: !!u.Des_Asignar,
      script: u.Script
    };

    res.json({ success: true, usuario });
  } catch (err) {
    console.error("Error al obtener detalle de usuario:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};
