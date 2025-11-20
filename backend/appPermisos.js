const pool = require("./db"); // o "../db" según dónde esté realmente

async function obtenerPermisosUsuario(req, res) {
  try {
    const { id_usuario } = req.params;

    const query = `
      SELECT ID_Aplicacion
      FROM a002103.USUARIO_PERFIL_APP
      WHERE ID_Usuario = ?
    `;

    const [rows] = await pool.query(query, [id_usuario]);

    const permisos = rows.map(r => r.ID_Aplicacion);

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
