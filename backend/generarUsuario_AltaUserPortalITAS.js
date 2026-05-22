//generarUsuario_AltaUserPortalITAS.js

const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("./db");
const schema = process.env.DB_SCHEMA;

// ==========================================
// OBTENER USUARIOS
// ==========================================
router.get("/usuarios", async (req, res) => {

    try {

        const pool = await poolPromise;

        const result = await pool.request().query(`
            SELECT
                ID,
                NOMBRE,
                EMAIL
            FROM ${schema}.USUARIO
            ORDER BY NOMBRE
        `);

        res.json(result.recordset);

    } catch (error) {

        console.error("Error obteniendo usuarios:", error);

        res.status(500).json({
            error: "Error obteniendo usuarios"
        });

    }

});

module.exports = router;