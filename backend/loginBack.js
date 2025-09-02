// loginBack.js
const sqlite3 = require("sqlite3").verbose();

// Abrimos la base de datos (ajustá la ruta si es necesario)
const db = new sqlite3.Database("../Portal_Itas.db", sqlite3.OPEN_READWRITE, (err) => {
    if (err) console.error("Error al abrir la DB:", err.message);
    else console.log("Conectado a la base de datos Usuarios");
});

module.exports = (req, res) => {
    const { email, password } = req.body;
    const sql = "SELECT * FROM Usuarios WHERE email = ? AND password = ?";

    db.get(sql, [email, password], (err, row) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, error: "Error de base de datos" });
        }
        if (row) return res.json({ success: true });
        res.json({ success: false, error: "Usuario o contraseña incorrectos" });
    });
};
