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
      SELECT ID_Perfil, ID_Aplicacion
      FROM ${schema}.USUARIO_PERFIL_APP
      WHERE ID_Usuario = @id
    `;

    const pool = await poolPromise;

    const result = await pool.request()
      .input("id", sql.Int, id_usuario)
      .query(query);

    // Si no hay resultados, el usuario no está en la tabla
    if (result.recordset.length === 0) {
      return res.json({
        ok: true,
        usuarioEncontrado: false,
        esAdmin: false,
        aplicacionesPermitidas: [] // Array vacío → no mostrar nada
      });
    }

    // Verificar si algún registro tiene ID_Perfil = 1 (Admin)
    const esAdmin = result.recordset.some(r => r.ID_Perfil === 1);

    // Si es admin, retornar vacío (señal de mostrar todas)
    if (esAdmin) {
      return res.json({
        ok: true,
        usuarioEncontrado: true,
        esAdmin: true,
        aplicacionesPermitidas: []
      });
    }

    // Si no es admin, extraer solo los ID_Aplicacion permitidos
    const aplicacionesPermitidas = result.recordset.map(r => r.ID_Aplicacion);

    return res.json({
      ok: true,
      usuarioEncontrado: true,
      esAdmin: false,
      aplicacionesPermitidas: aplicacionesPermitidas
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
      SELECT ID_Perfil, ID_Aplicacion
      FROM ${schema}.USUARIO_PERFIL_APP
      WHERE ID_Usuario = @id
    `;

    const pool = await poolPromise;

    const result = await pool.request()
      .input("id", sql.Int, id_usuario)
      .query(query);

    // Si no hay resultados, el usuario no está en la tabla
    if (result.recordset.length === 0) {
      return res.json({
        ok: true,
        usuarioEncontrado: false,
        esAdmin: false,
        aplicacionesPermitidas: [] // Array vacío → no mostrar nada
      });
    }

    // Verificar si algún registro tiene ID_Perfil = 1 (Admin)
    const esAdmin = result.recordset.some(r => r.ID_Perfil === 1);

    // Si es admin, retornar vacío (señal de mostrar todas)
    if (esAdmin) {
      return res.json({
        ok: true,
        usuarioEncontrado: true,
        esAdmin: true,
        aplicacionesPermitidas: []
      });
    }

    // Si no es admin, extraer solo los ID_Aplicacion permitidos
    const aplicacionesPermitidas = result.recordset.map(r => r.ID_Aplicacion);

    return res.json({
      ok: true,
      usuarioEncontrado: true,
      esAdmin: false,
      aplicacionesPermitidas: aplicacionesPermitidas
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
