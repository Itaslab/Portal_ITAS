// appHorarios_Usr.js

const express = require("express");
const router = express.Router();

const { sql, poolPromise } = require("./db");
const schema = process.env.DB_SCHEMA;

const DIAS_VALIDOS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

const MODALIDADES_VALIDAS = ["Oficina", "Home", "No Laborable"];

// La columna Dia_Semana en APP_HORARIOS_USR es tinyint, no texto.
// Mapeamos Lunes=1 ... Domingo=7. Si en la base ya usaban otra convención
// (por ejemplo Domingo=1 al estilo DATEPART), avisar para ajustar esto.
const DIA_A_NUMERO = {
  Lunes: 1,
  Martes: 2,
  Miércoles: 3,
  Jueves: 4,
  Viernes: 5,
  Sábado: 6,
  Domingo: 7,
};

const NUMERO_A_DIA = {
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
  7: "Domingo",
};

// =========================================================
// HELPERS
// =========================================================

function checkAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ success: false, mensaje: "No autenticado." });
  }
  next();
}

// Mismo criterio de "super admin" que usa appPermisos.js (ID_Perfil = 1 y
// ID_Aplicacion = 1). Lo repetimos acá como consulta directa porque
// obtenerPermisosUsuarioActual está pensado como handler de ruta (recibe
// req/res), no como función reutilizable.
async function esAdmin(pool, idUsuario) {
  const result = await pool.request().input("id", sql.Int, idUsuario).query(`
      SELECT ID_Perfil, ID_Aplicacion
      FROM ${schema}.USUARIO_PERFIL_APP
      WHERE ID_Usuario = @id
    `);

  return result.recordset.some(
    (r) => r.ID_Perfil === 1 && r.ID_Aplicacion === 1,
  );
}

// =========================================================
// ROL DEL USUARIO (misma lógica que licencias /mes y /usuarios)
// Recorre TODAS las filas donde el usuario figura como
// Gerente / Coordinador / Referente y junta:
//   - gruposUsuario: pares { grupo, subgrupo } donde es coordinador
//   - subgruposUsuario: subgrupos donde es referente
// Prioridad de rol: GERENTE > COORDINADOR > REFERENTE > USER
// =========================================================
async function obtenerRolUsuario(pool, idUsuario) {
  const result = await pool.request().input("idUsuario", sql.Int, idUsuario)
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
        ON (
          u.Nombre + ' ' + u.Apellido = g.Gerente
          OR u.Nombre + ' ' + u.Apellido = g.Coordinador
          OR u.Nombre + ' ' + u.Apellido = g.Referente
        )
      WHERE u.ID_Usuario = @idUsuario
        AND u.Vigencia_Hasta IS NULL
      ORDER BY g.Grupo, g.Subgrupo
    `);

  if (!result.recordset.length) {
    return {
      rol: "USER",
      gruposUsuario: [],
      subgruposUsuario: [],
    };
  }

  const registrosUsuario = result.recordset;
  const usuario = registrosUsuario[0];
  const nombreCompleto = `${usuario.Nombre} ${usuario.Apellido}`;

  let esGerente = false;
  let esCoordinador = false;
  let esReferente = false;

  const gruposUsuario = [];
  const subgruposUsuario = [];

  for (const fila of registrosUsuario) {
    // GERENTE
    if (fila.Gerente === nombreCompleto) {
      esGerente = true;
    }

    // COORDINADOR
    if (fila.Coordinador === nombreCompleto) {
      esCoordinador = true;

      if (fila.Grupo && fila.Subgrupo) {
        const existe = gruposUsuario.some(
          (item) =>
            item.grupo === fila.Grupo && item.subgrupo === fila.Subgrupo,
        );

        if (!existe) {
          gruposUsuario.push({
            grupo: fila.Grupo,
            subgrupo: fila.Subgrupo,
          });
        }
      }
    }

    // REFERENTE
    if (fila.Referente === nombreCompleto) {
      esReferente = true;

      if (fila.Subgrupo && !subgruposUsuario.includes(fila.Subgrupo)) {
        subgruposUsuario.push(fila.Subgrupo);
      }
    }
  }

  let rol = "USER";

  if (esGerente) {
    rol = "GERENTE";
  } else if (esCoordinador) {
    rol = "COORDINADOR";
  } else if (esReferente) {
    rol = "REFERENTE";
  }

  return {
    rol,
    gruposUsuario,
    subgruposUsuario,
  };
}

// =========================================================
// FILTRO POR ROL (COORDINADOR / REFERENTE)
// Agrega los parámetros al request y devuelve el SQL a
// concatenar en el WHERE. Usa el alias "g" (tabla GRUPO).
// GERENTE y USER se resuelven fuera de esta función.
// =========================================================
function construirFiltroRol(request, { rol, gruposUsuario, subgruposUsuario }) {
  if (rol === "COORDINADOR") {
    // Coordinador ve solamente los pares GRUPO + SUBGRUPO
    // donde figura como coordinador.
    if (gruposUsuario.length === 0) {
      return ` AND 1 = 0 `;
    }

    const condiciones = gruposUsuario.map((item, index) => {
      const parametroGrupo = `grupoUsuario${index}`;
      const parametroSubgrupo = `subgrupoUsuario${index}`;

      request.input(parametroGrupo, sql.VarChar, item.grupo);
      request.input(parametroSubgrupo, sql.VarChar, item.subgrupo);

      return `(g.Grupo = @${parametroGrupo} AND g.Subgrupo = @${parametroSubgrupo})`;
    });

    return ` AND (${condiciones.join(" OR ")}) `;
  }

  if (rol === "REFERENTE") {
    // Referente ve únicamente sus subgrupos.
    if (subgruposUsuario.length === 0) {
      return ` AND 1 = 0 `;
    }

    const parametros = subgruposUsuario.map((subgrupoNombre, index) => {
      const parametro = `subgrupoUsuario${index}`;

      request.input(parametro, sql.VarChar, subgrupoNombre);

      return `@${parametro}`;
    });

    return ` AND g.Subgrupo IN (${parametros.join(", ")}) `;
  }

  return "";
}

// =========================================================
// PERMISO SOBRE UN USUARIO (para ver / modificar su horario)
// =========================================================
async function tienePermisoSobreUsuario(
  pool,
  idUsuarioObjetivo,
  idSesion,
  ctx,
) {
  // Un USER solo puede sobre sí mismo
  if (ctx.rol === "USER") {
    return Number(idUsuarioObjetivo) === Number(idSesion);
  }

  // Gerente sin restricción
  if (ctx.rol === "GERENTE") {
    return true;
  }

  const request = pool
    .request()
    .input("id_usuario", sql.Int, idUsuarioObjetivo);

  const filtroRol = construirFiltroRol(request, ctx);

  const permiso = await request.query(`
    SELECT 1
    FROM ${schema}.USUARIO_GRUPO ug
    INNER JOIN ${schema}.GRUPO g
      ON g.ID_Grupo = ug.ID_Grupo
    WHERE ug.ID_Usuario = @id_usuario
      AND ug.Vigencia_Hasta IS NULL
      ${filtroRol}
  `);

  return permiso.recordset.length > 0;
}

// =========================================================
// OBTENER HORARIOS (grilla principal)
// =========================================================
router.get("/horarios", checkAuth, async (req, res) => {
  try {
    const pool = await poolPromise;

    const idSesion = req.session.user.ID_Usuario;
    const admin = await esAdmin(pool, idSesion);

    const ctx = await obtenerRolUsuario(pool, idSesion);
    const { rol, gruposUsuario, subgruposUsuario } = ctx;

    console.log("=================================");
    console.log("HORARIOS /horarios");
    console.log("USUARIO:", idSesion);
    console.log("ADMIN:", admin);
    console.log("ROL:", rol);
    console.log(
      "GRUPOS:",
      gruposUsuario
        .map((item) => `${item.grupo} / ${item.subgrupo}`)
        .join(" | "),
    );
    console.log("SUBGRUPOS:", subgruposUsuario.join(" | "));
    console.log("=================================");

    const request = pool.request();

    let filtroRol = "";

    if (admin || rol === "GERENTE") {
      // Admin y Gerente ven todo.
    } else if (rol === "COORDINADOR" || rol === "REFERENTE") {
      filtroRol = construirFiltroRol(request, ctx);
    } else {
      // USER → solamente él mismo
      request.input("idSesion", sql.Int, idSesion);
      filtroRol = ` AND u.ID_Usuario = @idSesion `;
    }

    const result = await request.query(`
      SELECT DISTINCT
          u.ID_Usuario,
          u.Legajo,
          u.Nombre,
          u.Apellido,

          g.Grupo,
          g.Subgrupo,

          h.Dia_Semana,
          CONVERT(VARCHAR(5), h.Hora_In1, 108) AS Hora_In1,
          CONVERT(VARCHAR(5), h.Hora_Out1, 108) AS Hora_Out1,
          CONVERT(VARCHAR(5), h.Hora_In2, 108) AS Hora_In2,
          CONVERT(VARCHAR(5), h.Hora_Out2, 108) AS Hora_Out2,
          h.Modalidad,
          h.Edificio

      FROM ${schema}.USUARIO u

      INNER JOIN ${schema}.USUARIO_GRUPO ug
          ON ug.ID_Usuario = u.ID_Usuario
          AND ug.Vigencia_Hasta IS NULL

      INNER JOIN ${schema}.GRUPO g
          ON g.ID_Grupo = ug.ID_Grupo

      LEFT JOIN ${schema}.APP_HORARIOS_USR h
          ON h.ID_Usuario = u.ID_Usuario
          AND h.Vigencia_Hasta IS NULL

      WHERE
          u.Vigencia_Hasta IS NULL
          ${filtroRol}

      ORDER BY
          g.Grupo,
          g.Subgrupo,
          u.Apellido,
          u.Nombre,
          h.Dia_Semana;
    `);

    res.json({
      success: true,
      horarios: result.recordset.map((fila) => ({
        ...fila,
        Dia_Semana: fila.Dia_Semana ? NUMERO_A_DIA[fila.Dia_Semana] : null,
      })),
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      mensaje: "Error obteniendo horarios.",
    });
  }
});

// =========================================================
// OBTENER HORARIOS DE UN USUARIO (detalle para el modal)
// =========================================================

router.get("/horarios/:id_usuario", checkAuth, async (req, res) => {
  const { id_usuario } = req.params;

  try {
    const pool = await poolPromise;
    const idSesion = req.session.user.ID_Usuario;

    const admin = await esAdmin(pool, idSesion);

    const ctx = await obtenerRolUsuario(pool, idSesion);

    if (!admin) {
      const permitido = await tienePermisoSobreUsuario(
        pool,
        id_usuario,
        idSesion,
        ctx,
      );

      if (!permitido) {
        return res.status(403).json({
          success: false,
          mensaje: "No tenés permiso para ver este horario.",
        });
      }
    }

    const result = await pool.request().input("id_usuario", sql.Int, id_usuario)
      .query(`
        SELECT
            Dia_Semana,
            CONVERT(VARCHAR(5), Hora_In1, 108) AS Hora_In1,
            CONVERT(VARCHAR(5), Hora_Out1, 108) AS Hora_Out1,
            CONVERT(VARCHAR(5), Hora_In2, 108) AS Hora_In2,
            CONVERT(VARCHAR(5), Hora_Out2, 108) AS Hora_Out2,
            Modalidad,
            Edificio
        FROM ${schema}.APP_HORARIOS_USR
        WHERE
            ID_Usuario = @id_usuario
            AND Vigencia_Hasta IS NULL
        ORDER BY
            Dia_Semana
      `);

    res.json({
      success: true,
      horarios: result.recordset.map((fila) => ({
        ...fila,
        Dia_Semana: fila.Dia_Semana ? NUMERO_A_DIA[fila.Dia_Semana] : null,
      })),
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      mensaje: "Error obteniendo horarios.",
    });
  }
});

// =========================================================
// MODIFICAR HORARIO DE UN USUARIO
// =========================================================
// Recibe: { dias: [ { dia, in1, out1, in2, out2, modalidad, edificio }, ... ] }
// Cierra (Vigencia_Hasta = GETDATE()) los registros activos del usuario
// e inserta los nuevos, para mantener el historial.

router.put("/horarios/:id_usuario", checkAuth, async (req, res) => {
  const { id_usuario } = req.params;
  const { dias } = req.body;

  if (!Array.isArray(dias) || dias.length === 0) {
    return res.status(400).json({
      success: false,
      mensaje: "Formato inválido: se esperaba un array 'dias'.",
    });
  }

  for (const d of dias) {
    if (!DIAS_VALIDOS.includes(d.dia)) {
      return res.status(400).json({
        success: false,
        mensaje: `Día inválido: ${d.dia}`,
      });
    }

    if (d.modalidad && !MODALIDADES_VALIDAS.includes(d.modalidad)) {
      return res.status(400).json({
        success: false,
        mensaje: `Modalidad inválida: ${d.modalidad}`,
      });
    }
  }

  try {
    const pool = await poolPromise;
    const idSesion = req.session.user.ID_Usuario;

    const admin = await esAdmin(pool, idSesion);

    const ctx = await obtenerRolUsuario(pool, idSesion);

    if (!admin) {
      const permitido = await tienePermisoSobreUsuario(
        pool,
        id_usuario,
        idSesion,
        ctx,
      );

      if (!permitido) {
        return res.status(403).json({
          success: false,
          mensaje: "No tenés permiso para modificar este horario.",
        });
      }
    }

    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // =========================================================
      // 1. OBTENER HORARIOS ACTIVOS ACTUALES
      // =========================================================
      const horariosActualesResult = await transaction
        .request()
        .input("id_usuario", sql.Int, id_usuario).query(`
          SELECT
              Dia_Semana,
              Hora_In1,
              Hora_Out1,
              Hora_In2,
              Hora_Out2,
              Modalidad,
              Edificio,
              Log_De_Cambios
          FROM ${schema}.APP_HORARIOS_USR
          WHERE ID_Usuario = @id_usuario
            AND Vigencia_Hasta IS NULL
        `);

      const horariosActuales = horariosActualesResult.recordset;

      // =========================================================
      // 2. ARMAR LOG SOLO CON LOS CAMBIOS REALIZADOS
      // =========================================================

      function formatearHora(hora) {
        if (!hora) return "";

        // Si SQL Server devuelve un Date
        if (hora instanceof Date) {
          const horas = String(hora.getHours()).padStart(2, "0");
          const minutos = String(hora.getMinutes()).padStart(2, "0");

          return `${horas}:${minutos}`;
        }

        // Si ya viene como texto
        return String(hora).substring(0, 5);
      }

      const cambios = [];

      for (const nuevo of dias) {
        const numeroDia = DIA_A_NUMERO[nuevo.dia];

        const anterior = horariosActuales.find(
          (h) => Number(h.Dia_Semana) === Number(numeroDia),
        );

        if (!anterior) continue;

        const cambiosDia = [];

        // =========================================================
        // VALORES ANTERIORES
        // =========================================================

        const anteriorIn1 = formatearHora(anterior.Hora_In1);
        const anteriorOut1 = formatearHora(anterior.Hora_Out1);
        const anteriorIn2 = formatearHora(anterior.Hora_In2);
        const anteriorOut2 = formatearHora(anterior.Hora_Out2);

        const anteriorModalidad = anterior.Modalidad
          ? String(anterior.Modalidad)
          : "";

        const anteriorEdificio = anterior.Edificio
          ? String(anterior.Edificio)
          : "";

        // =========================================================
        // VALORES NUEVOS
        // =========================================================

        const nuevoIn1 = nuevo.in1 ? String(nuevo.in1).substring(0, 5) : "";

        const nuevoOut1 = nuevo.out1 ? String(nuevo.out1).substring(0, 5) : "";

        const nuevoIn2 = nuevo.in2 ? String(nuevo.in2).substring(0, 5) : "";

        const nuevoOut2 = nuevo.out2 ? String(nuevo.out2).substring(0, 5) : "";

        const nuevaModalidad = nuevo.modalidad
          ? String(nuevo.modalidad)
          : "No Laborable";

        const nuevoEdificio = nuevo.edificio ? String(nuevo.edificio) : "";

        // =========================================================
        // COMPARAR HORARIOS
        // =========================================================

        if (anteriorIn1 !== nuevoIn1) {
          cambiosDia.push(
            `Hora Entrada 1: ${anteriorIn1 || "-"} a ${nuevoIn1 || "-"}`,
          );
        }

        if (anteriorOut1 !== nuevoOut1) {
          cambiosDia.push(
            `Hora Salida 1: ${anteriorOut1 || "-"} a ${nuevoOut1 || "-"}`,
          );
        }

        if (anteriorIn2 !== nuevoIn2) {
          cambiosDia.push(
            `Hora Entrada 2: ${anteriorIn2 || "-"} a ${nuevoIn2 || "-"}`,
          );
        }

        if (anteriorOut2 !== nuevoOut2) {
          cambiosDia.push(
            `Hora Salida 2: ${anteriorOut2 || "-"} a ${nuevoOut2 || "-"}`,
          );
        }

        // =========================================================
        // COMPARAR MODALIDAD
        // =========================================================

        if (anteriorModalidad !== nuevaModalidad) {
          cambiosDia.push(
            `Modalidad: ${anteriorModalidad || "-"} a ${nuevaModalidad || "-"}`,
          );
        }

        // =========================================================
        // COMPARAR EDIFICIO
        // =========================================================

        if (anteriorEdificio !== nuevoEdificio) {
          cambiosDia.push(
            `Edificio: ${anteriorEdificio || "-"} a ${nuevoEdificio || "-"}`,
          );
        }

        // =========================================================
        // SOLO GUARDAR EL DÍA SI REALMENTE CAMBIÓ ALGO
        // =========================================================

        if (cambiosDia.length > 0) {
          cambios.push({
            dia: nuevo.dia,
            cambios: cambiosDia,
          });
        }
      }

      // =========================================================
      // 3. OBTENER LOG ANTERIOR DEL LUNES
      // =========================================================
      const numeroLunes = DIA_A_NUMERO["Lunes"];

      const horarioLunes = horariosActuales.find(
        (h) => Number(h.Dia_Semana) === Number(numeroLunes),
      );

      const logAnterior = horarioLunes?.Log_De_Cambios || "";

      // =========================================================
      // 4. OBTENER NOMBRE Y APELLIDO DEL USUARIO QUE REALIZÓ EL CAMBIO
      // =========================================================
      const usuarioSesionResult = await transaction
        .request()
        .input("idSesion", sql.Int, idSesion).query(`
          SELECT Nombre, Apellido
          FROM ${schema}.USUARIO
          WHERE ID_Usuario = @idSesion
        `);

      const usuarioSesion = usuarioSesionResult.recordset[0];

      const nombreUsuario = usuarioSesion
        ? `${usuarioSesion.Nombre} ${usuarioSesion.Apellido}`
        : `ID Usuario ${idSesion}`;

      // =========================================================
      // 5. GENERAR NUEVO LOG
      // =========================================================
      let nuevoLog = "";

      if (cambios.length > 0) {
        const fecha = new Date().toLocaleString("es-AR");

        nuevoLog += `${fecha} - Modificación realizada por ID Usuario ${nombreUsuario}\n\n`;

        for (const cambio of cambios) {
          nuevoLog += `${cambio.dia}:\n`;

          for (const detalle of cambio.cambios) {
            nuevoLog += `${detalle}\n`;
          }

          nuevoLog += "\n";
        }

        nuevoLog += "--------------------------------------------------\n\n";
      }

      // El log nuevo queda arriba del historial anterior.
      const logFinal = nuevoLog + logAnterior;

      // =========================================================
      // 6. CERRAMOS LA VIGENCIA DE TODO LO ACTIVO
      // =========================================================
      await transaction.request().input("id_usuario", sql.Int, id_usuario)
        .query(`
          UPDATE ${schema}.APP_HORARIOS_USR
          SET Vigencia_Hasta = GETDATE()
          WHERE ID_Usuario = @id_usuario
            AND Vigencia_Hasta IS NULL
        `);

      // =========================================================
      // 7. INSERTAMOS EL NUEVO HORARIO
      // =========================================================
      for (const d of dias) {
        const numeroDia = DIA_A_NUMERO[d.dia];

        // El log se guarda SOLAMENTE en el lunes.
        const logParaEsteDia =
          Number(numeroDia) === Number(numeroLunes) ? logFinal : null;

        await transaction
          .request()
          .input("id_usuario", sql.Int, id_usuario)
          .input("dia", sql.TinyInt, numeroDia)
          .input("in1", sql.VarChar, d.in1 || null)
          .input("out1", sql.VarChar, d.out1 || null)
          .input("in2", sql.VarChar, d.in2 || null)
          .input("out2", sql.VarChar, d.out2 || null)
          .input("modalidad", sql.VarChar, d.modalidad || "No Laborable")
          .input("edificio", sql.VarChar, d.edificio || null)
          .input("logDeCambios", sql.VarChar(sql.MAX), logParaEsteDia).query(`
            INSERT INTO ${schema}.APP_HORARIOS_USR
              (
                ID_Usuario,
                Dia_Semana,
                Hora_In1,
                Hora_Out1,
                Hora_In2,
                Hora_Out2,
                Modalidad,
                Edificio,
                Vigencia_Desde,
                Vigencia_Hasta,
                Log_De_Cambios
              )
            VALUES
              (
                @id_usuario,
                @dia,
                @in1,
                @out1,
                @in2,
                @out2,
                @modalidad,
                @edificio,
                GETDATE(),
                NULL,
                @logDeCambios
              )
          `);
      }

      // =========================================================
      // 8. CONFIRMAMOS LA TRANSACCIÓN
      // =========================================================
      await transaction.commit();

      res.json({
        success: true,
        mensaje: "Horario actualizado correctamente.",
      });
    } catch (errorInterno) {
      try {
        await transaction.rollback();
      } catch (errorRollback) {
        console.error(
          "Error haciendo rollback (la transacción ya se había abortado):",
          errorRollback,
        );
      }

      throw errorInterno;
    }
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      mensaje: "Error actualizando el horario.",
    });
  }
});

// =========================================================
// OBTENER LOG DE CAMBIOS DEL HORARIO
// =========================================================
router.get("/horarios/:id_usuario/log", checkAuth, async (req, res) => {
  const { id_usuario } = req.params;

  try {
    const pool = await poolPromise;
    const idSesion = req.session.user.ID_Usuario;

    const admin = await esAdmin(pool, idSesion);
    const ctx = await obtenerRolUsuario(pool, idSesion);

    // Admin puede ver cualquier log.
    // El resto solamente puede ver el log de usuarios
    // sobre los que tiene permiso.
    if (!admin) {
      const permitido = await tienePermisoSobreUsuario(
        pool,
        id_usuario,
        idSesion,
        ctx,
      );

      if (!permitido) {
        return res.status(403).json({
          success: false,
          mensaje: "No tenés permiso para ver este log.",
        });
      }
    }

    const result = await pool.request().input("id_usuario", sql.Int, id_usuario)
      .query(`
        SELECT TOP 1
          Log_De_Cambios
        FROM ${schema}.APP_HORARIOS_USR
        WHERE ID_Usuario = @id_usuario
          AND Dia_Semana = ${DIA_A_NUMERO["Lunes"]}
          AND Vigencia_Hasta IS NULL
      `);

    const log = result.recordset[0]?.Log_De_Cambios || "";

    res.json({
      success: true,
      log,
    });
  } catch (error) {
    console.error("Error obteniendo log de horarios:", error);

    res.status(500).json({
      success: false,
      mensaje: "Error obteniendo el log de cambios.",
    });
  }
});

module.exports = router;
