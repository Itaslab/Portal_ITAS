const { sql, poolPromise } = require("./db");
const schema = process.env.DB_SCHEMA;

async function obtenerPermisosUsuario(req, res) {
  try {
    if (!req.session || !req.session.user) {
      return res.status(401).json({
        ok: false,
        error: "No autenticado"
      });
    }

    const id_usuario = req.session.user.ID_Usuario;

    const query = `
      SELECT ID_Aplicacion
      FROM ${schema}.USUARIO_PERFIL_APP
      WHERE ID_Usuario = @id
    `;

    const pool = await poolPromise;

    const result = await pool.request()
      .input("id", sql.Int, id_usuario)
      .query(query);

    const permisos = result.recordset.map(r => r.ID_Aplicacion);

    return res.json({
      ok: true,
      aplicacionesPermitidas: permisos
    });

  } catch (error) {
    console.error("Error obteniendo permisos:", error);
    return res.status(500).json({
      ok: false,
      error: "Error al obtener permisos"
    });
  }
}

module.exports = { obtenerPermisosUsuario };
