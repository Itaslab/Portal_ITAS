// loginBack.js
const { sql, poolPromise } = require("./db");

module.exports = async (req, res) => {
    const { email, password } = req.body;

    try {
        const pool = await poolPromise;

        const result = await pool.request()
            .input("email", sql.VarChar, email)
            .input("password", sql.VarChar, password)
            .query("SELECT * FROM dbo.USUARIO_WEB WHERE Email = @email AND Password = @password");

        if (result.recordset.length === 0) {
            return res.json({ success: false, error: "Usuario o contraseña incorrectos" });
        }

        const user = result.recordset[0];

        return res.json({
            success: true,
            message: "Login correcto",
            ID_Usuario: user.ID_Usuario || null,
            Email: user.Email
        });

    } catch (err) {
        console.error("Error en login:", err.message, err);
        res.status(500).json({ success: false, error: err.message });
    }
};


