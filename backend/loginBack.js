// loginBack.js
const { sql, poolPromise } = require("./db");

module.exports = async (req, res) => {
    const { email, password } = req.body;

    try {
        const pool = await poolPromise;
        const result = await pool
            .request()
            .input("email", sql.VarChar, email)
            .input("password", sql.VarChar, password)
            .query("SELECT * FROM Usuarios WHERE email = @email AND password = @password");

        if (result.recordset.length > 0) {
            return res.json({ success: true });
        } else {
            return res.json({ success: false, error: "Usuario o contraseña incorrectos" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Error de base de datos" });
    }
};
