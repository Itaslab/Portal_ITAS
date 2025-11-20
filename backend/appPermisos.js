const { sql, poolPromise } = require("./db");

async function obtenerPermisosUsuario(req, res) {
  try {
    const { id_usuario } = req.params;

    const query = `
      SELECT ID_Aplicacion
      FROM a002103.USUARIO_PERFIL_APP
      WHERE ID_Usuario = @id
    `;

    // Obtener pool (SQL Server)
    const pool = await poolPromise;

    const result = await pool.request()
      .input("id", sql.Int, id_usuario)
      .query(query);

    const permisos = result.recordset.map(r => r.ID_Aplicacion);

    res.json({
      ok: true,
      usuario: id_usuario,
      aplicacionesPermitidas: permisos
    });

  } catch (error) {
    console.error("Error obteniendo permisos:", error);
    res.status(500).json({
      ok: false,
      error: "Error al obtener permisos"
    });
  }
}

module.exports = { obtenerPermisosUsuario };
