// loginBack.js
const { sql, poolPromise } = require("./db");

module.exports = async (req, res) => {
    const { email, password } = req.body;

    try {
        const pool = await poolPromise;

        const result = await pool
            .request()
            .input("email", sql.VarChar, email)
            .query(`
                SELECT u.ID_Usuario, w.Password
                FROM a002103.USUARIO u
                inner join  a002103.WEB_PORTAL_ITAS_USR w ON u.ID_Usuario = w.ID_Usuario
                WHERE u.Email = @email
            `);

        if (result.recordset.length === 0) {
            return res.json({ success: false, error: "Usuario no encontrado" });
        }

        const user = result.recordset[0];

        if (user.Password === password) {
            return res.json({ success: true, ID_Usuario: user.ID_Usuario });
        } else {
            return res.json({ success: false, error: "Contraseña incorrecta" });
        }

    } catch (err) {
    console.error("Error en login:", err.message, err);
    res.status(500).json({ success: false, error: err.message });
}
};

