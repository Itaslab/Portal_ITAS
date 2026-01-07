const bcrypt = require("bcrypt");
const { sql, poolPromise } = require("./db");

const schema = process.env.DB_SCHEMA;

module.exports = async (req, res) => {
  const { email, password } = req.body;

  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input("email", sql.VarChar, email)
      .query(`
        SELECT 
          u.ID_Usuario,
          w.PasswordHash
        FROM ${schema}.USUARIO u
        INNER JOIN ${schema}.WEB_PORTAL_ITAS_USR w 
          ON u.ID_Usuario = w.ID_Usuario
        WHERE u.Email = @email
      `);

    if (result.recordset.length === 0) {
      return res.json({ success: false, error: "Usuario o contraseña incorrectos" });
    }

    const user = result.recordset[0];

    // 🔐 Validación bcrypt
    const passwordOk = await bcrypt.compare(password, user.PasswordHash);

    if (!passwordOk) {
      return res.json({ success: false, error: "Usuario o contraseña incorrectos" });
    }

    return res.json({
      success: true,
      message: "Login correcto",
      ID_Usuario: user.ID_Usuario,
      Email: email
    });

  } catch (err) {
    console.error("Error en login:", err);
    res.status(500).json({ success: false, error: "Error interno" });
  }
};