const { sql, poolPromise } = require("./db");
const schema = process.env.DB_SCHEMA;

async function obtenerPermisosUsuarioActual(req, res) {
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

    // Si no hay resultados, el usuario no está en la tabla
    if (permisos.length === 0) {
      return res.json({
        ok: true,
        usuarioEncontrado: false,
        esAdmin: false,
        aplicacionesPermitidas: [] // Array vacío → no mostrar nada
      });
    }

    // Si encuentra ID_Aplicacion = 999, es Admin y puede ver todas las apps
    const esAdmin = permisos.includes(999);

    return res.json({
      ok: true,
      usuarioEncontrado: true,
      esAdmin: esAdmin,
      aplicacionesPermitidas: esAdmin ? [] : permisos // Si es admin, retorna array vacío (señal de mostrar todas)
    });

  } catch (error) {
    console.error("Error obteniendo permisos:", error);
    return res.status(500).json({
      ok: false,
      error: "Error al obtener permisos"
    });
  }
}

async function obtenerPermisosUsuario(req, res) {
  try {
    if (!req.session || !req.session.user) {
      return res.status(401).json({
        ok: false,
        error: "No autenticado"
      });
    }

    const id_usuario = req.params.id_usuario;

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

    // Si no hay resultados, el usuario no está en la tabla
    if (permisos.length === 0) {
      return res.json({
        ok: true,
        usuarioEncontrado: false,
        esAdmin: false,
        aplicacionesPermitidas: [] // Array vacío → no mostrar nada
      });
    }

    // Si encuentra ID_Aplicacion = 999, es Admin y puede ver todas las apps
    const esAdmin = permisos.includes(999);

    return res.json({
      ok: true,
      usuarioEncontrado: true,
      esAdmin: esAdmin,
      aplicacionesPermitidas: esAdmin ? [] : permisos // Si es admin, retorna array vacío (señal de mostrar todas)
    });

  } catch (error) {
    console.error("Error obteniendo permisos:", error);
    return res.status(500).json({
      ok: false,
      error: "Error al obtener permisos"
    });
  }
}

module.exports = { obtenerPermisosUsuarioActual, obtenerPermisosUsuario };
