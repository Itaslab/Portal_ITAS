// appOrdenesSF_updateAsignar.js
const { sql, poolPromise } = require("./db");

module.exports = async (req, res) => {
  try {
    const { sf_user_id, asignar } = req.body;

    if (!sf_user_id) {
      return res.status(400).json({ success: false, error: "Falta SF_UserID" });
    }

    const pool = await poolPromise;

    // ✅ Actualiza la columna Asignar según el SF_UserID
    await pool.request()
      .input("sf_user_id", sql.VarChar, sf_user_id)
      .input("asignar", sql.VarChar, asignar)
      .query(`
        UPDATE a002103.APP_ORDENES_USR
        SET Asignar = @asignar
        WHERE SF_UserID = @sf_user_id
      `);

    res.json({ success: true });
  } catch (err) {
    console.error("Error al actualizar Asignar:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};
