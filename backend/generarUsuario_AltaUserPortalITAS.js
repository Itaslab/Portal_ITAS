//generarUsuario_AltaUserPortalITAS.js



const bcrypt = require("bcrypt");
const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("./db");
const schema = process.env.DB_SCHEMA;

// ==========================================
// OBTENER USUARIOS
// ==========================================
router.get("/usuariosPortalAlta", async (req, res) => {

    try {

        const pool = await poolPromise;

        const result = await pool.request().query(`
            SELECT
                ID_Usuario,
                Nombre,
                Apellido,
                Email
            FROM ${schema}.USUARIO
            ORDER BY Nombre, Apellido
        `);

        res.json(result.recordset);

    } catch (error) {

        console.error("Error obteniendo usuarios:", error);

        res.status(500).json({
            error: "Error obteniendo usuarios"
        });

    }

});


// ==========================================
// ALTA USUARIO PORTAL
// ==========================================
router.post("/altaUsuarioPortal", async (req, res) => {

    try {

        const { idUsuario, password } = req.body;

        if (!idUsuario || !password) {
            return res.status(400).json({
                error: "Faltan datos"
            });
        }

        if (password.length < 8 || password.length > 15) {
            return res.status(400).json({
                error: "La contraseña debe tener entre 8 y 15 caracteres"
            });
        }

        const pool = await poolPromise;

        // VALIDAR EXISTENCIA
        const existe = await pool.request()
            .input("idUsuario", sql.Int, idUsuario)
            .query(`
                SELECT 1
                FROM ${schema}.WEB_PORTAL_ITAS_USR
                WHERE ID_Usuario = @idUsuario
            `);

        if (existe.recordset.length > 0) {

            return res.status(400).json({
                error: "El usuario ya posee acceso al portal"
            });

        }

        // HASH PASSWORD
        const passwordHash = await bcrypt.hash(password, 10);

        // INSERT
        await pool.request()
            .input("idUsuario", sql.Int, idUsuario)
            .input("passwordHash", sql.VarChar, passwordHash)
            .query(`
                INSERT INTO ${schema}.WEB_PORTAL_ITAS_USR
                (
                    ID_Usuario,
                    ID_Aplicacion,
                    Blanquear_Pass,
                    PasswordHash
                )
                VALUES
                (
                    @idUsuario,
                    1,
                    1,
                    @passwordHash
                )
            `);

        res.json({
            success: true
        });

    } catch (error) {

        console.error("Error alta usuario portal:", error);

        res.status(500).json({
            error: "Error al crear usuario portal"
        });

    }

});

module.exports = router;