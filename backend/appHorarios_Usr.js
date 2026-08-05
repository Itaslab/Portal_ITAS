// appHorarios_Usr.js

const express = require("express");
const router = express.Router();

const { sql, poolPromise } = require("./db");
const schema = process.env.DB_SCHEMA;

// =========================================================
// OBTENER HORARIOS
// =========================================================

router.get("/horarios", async (req, res) => {
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
    h.Hora_In1,
    h.Hora_Out1,
    h.Hora_In2,
    h.Hora_Out2,
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
      horarios: result.recordset,
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
// OBTENER HORARIOS DE UN USUARIO
// =========================================================

router.get("/horarios/:id_usuario", async (req, res) => {
  const { id_usuario } = req.params;

  try {
    const pool = await poolPromise;

    const result = await pool.request().input("id_usuario", sql.Int, id_usuario)
      .query(`
        SELECT
            Dia_Semana,
            Hora_In1,
            Hora_Out1,
            Hora_In2,
            Hora_Out2,
            Modalidad,
            Edificio
        FROM ${schema}.APP_HORARIOS_USR
        WHERE
            ID_Usuario = @id_usuario
            AND Vigencia_Hasta IS NULL
        ORDER BY
            CASE Dia_Semana
                WHEN 'Lunes' THEN 1
                WHEN 'Martes' THEN 2
                WHEN 'Miércoles' THEN 3
                WHEN 'Miercoles' THEN 3
                WHEN 'Jueves' THEN 4
                WHEN 'Viernes' THEN 5
                WHEN 'Sábado' THEN 6
                WHEN 'Sabado' THEN 6
                WHEN 'Domingo' THEN 7
            END
      `);

    res.json({
      success: true,
      horarios: result.recordset,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      mensaje: "Error obteniendo horarios.",
    });
  }
});

module.exports = router;
