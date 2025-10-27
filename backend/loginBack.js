const { sql, poolPromise } = require("./db");

module.exports = async (req, res) => {
    const { email, password } = req.body;

    try {
        const pool = await poolPromise;

        const result = await pool.request()
            .input("email", sql.VarChar, email)
            .query(`
                SELECT u.ID_Usuario, w.Password
                FROM a002103.USUARIO u
                INNER JOIN a002103.WEB_PORTAL_ITAS_USR w ON u.ID_Usuario = w.ID_Usuario
                WHERE u.Email = @email
            `);

        if (result.recordset.length === 0) {
            return res.json({ success: false, error: "Usuario o contraseña incorrectos" });
        }

        const user = result.recordset[0];

        // Validar contraseña
        if (user.Password !== password) {
            return res.json({ success: false, error: "Usuario o contraseña incorrectos" });
        }

        // ✅ Guardar sesión en el servidor
        req.session.user = {
            ID_Usuario: user.ID_Usuario,
            Email: email
        };

        console.log(`🔐 Sesión iniciada para: ${email}`);

        return res.json({
            success: true,
            message: "Login correcto",
            ID_Usuario: user.ID_Usuario || null,
            Email: email
        });

    } catch (err) {
        console.error("Error en login:", err.message, err);
        res.status(500).json({ success: false, error: err.message });
    }
};


