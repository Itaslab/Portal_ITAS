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

const MODALIDADES_VALIDAS = ["Oficina", "Home", "No Aplica"];

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
// OBTENER HORARIOS (grilla principal)
// =========================================================

router.get("/horarios", checkAuth, async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT
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

    if (!admin && Number(id_usuario) !== Number(idSesion)) {
      return res.status(403).json({
        success: false,
        mensaje: "No tenés permiso para ver este horario.",
      });
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

    if (!admin && Number(id_usuario) !== Number(idSesion)) {
      return res.status(403).json({
        success: false,
        mensaje: "No tenés permiso para modificar este horario.",
      });
    }

    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Cerramos la vigencia de todo lo que esté activo hoy.
      await transaction.request().input("id_usuario", sql.Int, id_usuario)
        .query(`
          UPDATE ${schema}.APP_HORARIOS_USR
          SET Vigencia_Hasta = GETDATE()
          WHERE ID_Usuario = @id_usuario
            AND Vigencia_Hasta IS NULL
        `);

      // Insertamos el nuevo horario, un registro por día.
      for (const d of dias) {
        await transaction
          .request()
          .input("id_usuario", sql.Int, id_usuario)
          .input("dia", sql.TinyInt, DIA_A_NUMERO[d.dia])
          .input("in1", sql.VarChar, d.in1 || null)
          .input("out1", sql.VarChar, d.out1 || null)
          .input("in2", sql.VarChar, d.in2 || null)
          .input("out2", sql.VarChar, d.out2 || null)
          .input("modalidad", sql.VarChar, d.modalidad || "No Aplica")
          .input("edificio", sql.VarChar, d.edificio || null).query(`
            INSERT INTO ${schema}.APP_HORARIOS_USR
              (ID_Usuario, Dia_Semana, Hora_In1, Hora_Out1, Hora_In2, Hora_Out2,
               Modalidad, Edificio, Vigencia_Desde, Vigencia_Hasta)
            VALUES
              (@id_usuario, @dia, @in1, @out1, @in2, @out2,
               @modalidad, @edificio, GETDATE(), NULL)
          `);
      }

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

module.exports = router;
