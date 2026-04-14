const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("./db");
const schema = process.env.DB_SCHEMA;

// =============================
// OBTENER LICENCIAS POR MES
// =============================
router.get("/mes", async (req, res) => {

  const { year, month, grupo, subgrupo } = req.query;

  if (!year || !month) {
    return res.status(400).json({
      success: false,
      error: "Debe enviar year y month"
    });
  }

  // ✅ CAPTURAR USUARIO
  const idUsuarioSesion = req.session?.user?.ID_Usuario;
  const adminIds = [79, 81, 89, 88];
  const esAdmin = adminIds.includes(idUsuarioSesion);


  if (!idUsuarioSesion) {
    return res.status(401).json({
      success: false,
      error: "No autorizado"
    });
  }
  
  try {

    const inicioMes = new Date(year, month - 1, 1);
    const finMes = new Date(year, month, 0);

    const pool = await poolPromise;

// 🔎 Obtener datos del usuario logueado y detectar rol
const usuarioResult = await pool.request()
  .input("idUsuario", sql.Int, idUsuarioSesion)
  .query(`
    SELECT 
        u.ID_Usuario,
        u.Nombre,
        u.Apellido,
        g.Grupo,
        g.Subgrupo,
        g.Gerente,
        g.Coordinador,
        g.Referente
    FROM ${schema}.USUARIO u
    LEFT JOIN ${schema}.GRUPO g
        ON (u.Nombre + ' ' + u.Apellido = g.Gerente
            OR u.Nombre + ' ' + u.Apellido = g.Coordinador
            OR u.Nombre + ' ' + u.Apellido = g.Referente)
    WHERE u.ID_Usuario = @idUsuario
  `);

if (usuarioResult.recordset.length === 0) {
  return res.status(403).json({
    success: false,
    error: "Usuario sin rol asignado"
  });
}

const usuario = usuarioResult.recordset[0];

const nombreCompleto = `${usuario.Nombre} ${usuario.Apellido}`;


if (esAdmin) {

  const licencias = await pool.request()
    .input("inicioMes", sql.Date, inicioMes)
    .input("finMes", sql.Date, finMes)
    .query(`
      SELECT 
          l.ID_Usuario,
          u.Nombre,
          u.Apellido,
          g.Grupo,
          g.Subgrupo,
          CONVERT(varchar(10), l.Fecha_Desde, 23) AS Fecha_Desde,
          CONVERT(varchar(10), l.Fecha_Hasta, 23) AS Fecha_Hasta,
          l.TipoLic
      FROM ${schema}.LICENCIAS_SMART l
      INNER JOIN ${schema}.USUARIO u 
          ON u.ID_Usuario = l.ID_Usuario
      INNER JOIN ${schema}.USUARIO_GRUPO ug
          ON ug.ID_Usuario = u.ID_Usuario
      INNER JOIN ${schema}.GRUPO g
          ON g.ID_Grupo = ug.ID_Grupo
      WHERE l.Fecha_Desde <= @finMes
      AND l.Fecha_Hasta >= @inicioMes
      ORDER BY g.Grupo, u.Apellido, u.Nombre
    `);

  return res.json({
    success: true,
    data: licencias.recordset
  });
}




let rol = "USER";
let grupoUsuario = null;
let subgrupoUsuario = null;

if (usuario.Gerente === nombreCompleto) {
  rol = "GERENTE";
}

else if (usuario.Coordinador === nombreCompleto) {
  rol = "COORDINADOR";
  grupoUsuario = usuario.Grupo;
}

else if (usuario.Referente === nombreCompleto) {
  rol = "REFERENTE";
  grupoUsuario = usuario.Grupo;
  subgrupoUsuario = usuario.Subgrupo;
}




    const request = pool.request()
      .input("inicioMes", sql.Date, inicioMes)
      .input("finMes", sql.Date, finMes);

let query = `
SELECT 
    l.ID_Usuario,
    u.Nombre,
    u.Apellido,
    g.Grupo,
    g.Subgrupo,
    CONVERT(varchar(10), l.Fecha_Desde, 23) AS Fecha_Desde,
    CONVERT(varchar(10), l.Fecha_Hasta, 23) AS Fecha_Hasta,
    l.TipoLic
FROM ${schema}.LICENCIAS_SMART l
INNER JOIN ${schema}.USUARIO u 
    ON u.ID_Usuario = l.ID_Usuario
INNER JOIN ${schema}.USUARIO_GRUPO ug
    ON ug.ID_Usuario = u.ID_Usuario
INNER JOIN ${schema}.GRUPO g
    ON g.ID_Grupo = ug.ID_Grupo
WHERE l.Fecha_Desde <= @finMes
AND l.Fecha_Hasta >= @inicioMes
`;

// 🎯 FILTRO POR ROL
if (rol === "GERENTE" || rol === "COORDINADOR") {
  // ve todo
} else if (rol === "REFERENTE") {
  request.input("subgrupoUsuario", sql.VarChar, subgrupoUsuario);
  query += ` AND g.Subgrupo = @subgrupoUsuario `;
} else {
  request.input("idUsuarioSesion", sql.Int, idUsuarioSesion);
  query += ` AND l.ID_Usuario = @idUsuarioSesion `;
}

if (grupo) {
  request.input("grupo", sql.VarChar, grupo);
  query += ` AND g.Grupo = @grupo `;
}

if (grupo && subgrupo) {
  request.input("subgrupo", sql.VarChar, subgrupo);
  query += ` AND g.Subgrupo = @subgrupo `;
}

query += `
ORDER BY g.Grupo, u.Apellido, u.Nombre
`;

    const result = await request.query(query);

    res.json({
      success: true,
      data: result.recordset
    });

  } catch (err) {
    console.error("Error obteniendo licencias:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }

});

// =============================
// OBTENER SUBGRUPOS POR GRUPO
// =============================
router.get("/subgrupos", async (req, res) => {

  const { grupo } = req.query;

  if (!grupo) {
    return res.status(400).json({
      success: false,
      error: "Debe enviar grupo"
    });
  }

  try {

    const pool = await poolPromise;

    const result = await pool.request()
      .input("grupo", sql.VarChar, grupo)
      .query(`
        SELECT DISTINCT Subgrupo
        FROM ${schema}.GRUPO
        WHERE Grupo = @grupo
        ORDER BY Subgrupo
      `);

    res.json({
      success: true,
      data: result.recordset
    });

  } catch (err) {
    console.error("Error obteniendo subgrupos:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }

});


// =============================
// OBTENER USUARIOS (CON GRUPO)
// =============================
router.get("/usuarios", async (req, res) => {

  const { grupo, subgrupo } = req.query;

  const idUsuarioSesion = req.session?.user?.ID_Usuario;
  const adminIds = [79, 81, 89, 88];
  const esAdmin = adminIds.includes(idUsuarioSesion);

  if (!idUsuarioSesion) {
    return res.status(401).json({
      success: false,
      error: "No autorizado"
    });
  }

  try {

    const pool = await poolPromise;

    // 🔎 Obtener datos del usuario logueado
    const usuarioResult = await pool.request()
      .input("idUsuario", sql.Int, idUsuarioSesion)
      .query(`
        SELECT 
            u.ID_Usuario,
            u.Nombre,
            u.Apellido,
            g.Grupo,
            g.Subgrupo,
            g.Gerente,
            g.Coordinador,
            g.Referente
        FROM ${schema}.USUARIO u
        LEFT JOIN ${schema}.GRUPO g
            ON (u.Nombre + ' ' + u.Apellido = g.Gerente
                OR u.Nombre + ' ' + u.Apellido = g.Coordinador
                OR u.Nombre + ' ' + u.Apellido = g.Referente)
        WHERE u.ID_Usuario = @idUsuario
      `);

    if (usuarioResult.recordset.length === 0) {
      return res.status(403).json({
        success: false,
        error: "Usuario sin rol asignado"
      });
    }

    const usuario = usuarioResult.recordset[0];
    const nombreCompleto = `${usuario.Nombre} ${usuario.Apellido}`;

    let rol = "USER";
    let grupoUsuario = null;
    let subgrupoUsuario = null;

    if (usuario.Gerente === nombreCompleto) {
      rol = "GERENTE";
    } else if (usuario.Coordinador === nombreCompleto) {
      rol = "COORDINADOR";
      grupoUsuario = usuario.Grupo;
    } else if (usuario.Referente === nombreCompleto) {
      rol = "REFERENTE";
      grupoUsuario = usuario.Grupo;
      subgrupoUsuario = usuario.Subgrupo;
    }

    const request = pool.request();

    let query = `
      SELECT 
          u.ID_Usuario,
          u.Nombre,
          u.Apellido,
          g.Grupo,
          g.Subgrupo
      FROM ${schema}.USUARIO u
      INNER JOIN ${schema}.USUARIO_GRUPO ug
          ON ug.ID_Usuario = u.ID_Usuario
      INNER JOIN ${schema}.GRUPO g
          ON g.ID_Grupo = ug.ID_Grupo
      WHERE 1=1
    `;

    // 🎯 FILTRO POR ROL
    if (esAdmin || rol === "GERENTE" || rol === "COORDINADOR") {
      // ve todo
    } 
    else if (rol === "REFERENTE") {
      request.input("subgrupoUsuario", sql.VarChar, subgrupoUsuario);
      query += ` AND g.Subgrupo = @subgrupoUsuario `;
    } 
    else {
      request.input("idUsuarioSesion", sql.Int, idUsuarioSesion);
      query += ` AND u.ID_Usuario = @idUsuarioSesion `;
    }

    // 🎯 FILTROS OPCIONALES
    if (grupo) {
      request.input("grupo", sql.VarChar, grupo);
      query += ` AND g.Grupo = @grupo `;
    }

    if (grupo && subgrupo) {
      request.input("subgrupo", sql.VarChar, subgrupo);
      query += ` AND g.Subgrupo = @subgrupo `;
    }

    query += ` ORDER BY g.Grupo, u.Apellido, u.Nombre `;

    const result = await request.query(query);

    res.json({
      success: true,
      data: result.recordset
    });

  } catch (err) {
    console.error("Error obteniendo usuarios:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }

});

// =============================
// OBTENER FERIADOS POR MES
// =============================
router.get("/feriados", async (req, res) => {

  const { year, month } = req.query;

  if (!year || !month) {
    return res.status(400).json({
      success: false,
      error: "Debe enviar year y month"
    });
  }

  try {

    const pool = await poolPromise;

    const yearMonth = `${year}${String(month).padStart(2, "0")}`;

    const result = await pool.request()
      .input("yearMonth", sql.VarChar, yearMonth)
      .query(`
        SELECT 
          CONVERT(varchar(10), Fecha, 23) AS Fecha,
          Descripcion
        FROM ${schema}.FERIADOS
        WHERE AñoMes = @yearMonth
      `);

    res.json({
      success: true,
      data: result.recordset
    });

  } catch (err) {
    console.error("Error obteniendo feriados:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }

});




/// =============================
// OBTENER LICENCIAS PENDIENTES
// =============================
router.get("/pendientes", async (req, res) => {

  const { grupo, subgrupo } = req.query;

  const idUsuarioSesion = req.session?.user?.ID_Usuario;
  const adminIds = [79, 81, 89, 88];
  const esAdmin = adminIds.includes(idUsuarioSesion);

  if (!idUsuarioSesion) {
    return res.status(401).json({
      success: false,
      error: "No autorizado"
    });
  }

  try {

    const pool = await poolPromise;

    // 🔎 Obtener usuario logueado
    const usuarioResult = await pool.request()
      .input("idUsuario", sql.Int, idUsuarioSesion)
      .query(`
        SELECT 
            u.ID_Usuario,
            u.Nombre,
            u.Apellido,
            g.Grupo,
            g.Subgrupo,
            g.Gerente,
            g.Coordinador,
            g.Referente
        FROM ${schema}.USUARIO u
        LEFT JOIN ${schema}.GRUPO g
            ON (u.Nombre + ' ' + u.Apellido = g.Gerente
                OR u.Nombre + ' ' + u.Apellido = g.Coordinador
                OR u.Nombre + ' ' + u.Apellido = g.Referente)
        WHERE u.ID_Usuario = @idUsuario
      `);

    if (usuarioResult.recordset.length === 0) {
      return res.status(403).json({
        success: false,
        error: "Usuario sin rol asignado"
      });
    }

    const usuario = usuarioResult.recordset[0];
    const nombreCompleto = `${usuario.Nombre} ${usuario.Apellido}`;

    // 🎯 detectar rol
    let rol = "USER";
    let subgrupoUsuario = null;

    if (usuario.Gerente === nombreCompleto) {
      rol = "GERENTE";
    } 
    else if (usuario.Coordinador === nombreCompleto) {
      rol = "COORDINADOR";
    } 
    else if (usuario.Referente === nombreCompleto) {
      rol = "REFERENTE";
      subgrupoUsuario = usuario.Subgrupo;
    }

    const request = pool.request();

    // 🔥 QUERY BASE (SIN GROUP BY)
    let query = `
      SELECT DISTINCT
          l.Id,
          l.ID_Usuario,
          u.Nombre,
          u.Apellido,
          g.Grupo,
          g.Subgrupo,
          CONVERT(varchar(10), l.Fecha_Desde, 23) AS Fecha_Desde,
          CONVERT(varchar(10), l.Fecha_Hasta, 23) AS Fecha_Hasta,
          l.Licencia,
          l.Estado
      FROM ${schema}.LICENCIAS_SMART l
      INNER JOIN ${schema}.USUARIO u 
          ON u.ID_Usuario = l.ID_Usuario
      INNER JOIN (
          SELECT DISTINCT ID_Usuario, ID_Grupo 
          FROM ${schema}.USUARIO_GRUPO
      ) ug ON ug.ID_Usuario = u.ID_Usuario
      INNER JOIN ${schema}.GRUPO g
          ON g.ID_Grupo = ug.ID_Grupo
      WHERE l.Estado = 'PENDING'
    `;

    // 🎯 FILTRO POR ROL
    if (!esAdmin) {

      if (rol === "REFERENTE") {
        request.input("subgrupoUsuario", sql.VarChar, subgrupoUsuario);
        query += ` AND g.Subgrupo = @subgrupoUsuario `;
      } 
      else if (rol === "USER") {
        request.input("idUsuarioSesion", sql.Int, idUsuarioSesion);
        query += ` AND l.ID_Usuario = @idUsuarioSesion `;
      }

      // ⚠️ GERENTE / COORDINADOR → ven todo (por ahora)
    }

    // 🎯 FILTROS OPCIONALES
    if (grupo) {
      request.input("grupo", sql.VarChar, grupo);
      query += ` AND g.Grupo = @grupo `;
    }

    if (grupo && subgrupo) {
      request.input("subgrupo", sql.VarChar, subgrupo);
      query += ` AND g.Subgrupo = @subgrupo `;
    }

    // ✅ ORDEN FINAL
    query += ` ORDER BY g.Grupo, u.Apellido, u.Nombre `;

    const result = await request.query(query);

    res.json({
      success: true,
      data: result.recordset
    });

  } catch (err) {
    console.error("Error obteniendo licencias pendientes:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }

});



module.exports = router;