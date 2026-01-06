// appOrdenesSF_updateAsignar.js
const { sql, poolPromise } = require("./db");
const schema = process.env.DB_SCHEMA;


module.exports = async (req, res) => {
  try {
    const id = parseInt(req.params.id_usuario, 10);
    const { asignar } = req.body;

    if (!id) return res.status(400).json({ success: false, error: "Falta id_usuario" });
    if (typeof asignar === "undefined") return res.status(400).json({ success: false, error: "Falta asignar" });

    // (opcional) validar valores permitidos:
    const allowed = ["Asignar", "No Asignar", "Automático", "Automático", "Automatico"];
    // podés afinar allowed según lo que uses en la app

    // if (!allowed.includes(asignar)) {
    //   return res.status(400).json({ success: false, error: "Valor de 'asignar' no permitido" });
    // }

    const pool = await poolPromise;

    await pool.request()
      .input("id", sql.Int, id)
      .input("asignar", sql.VarChar(50), asignar)
      .query(`
        UPDATE ${schema}.APP_ORDENES_USR
        SET Asignar = @asignar
        WHERE ID_Usuario = @id;
      `);

    res.json({ success: true });
  } catch (err) {
    console.error("Error al actualizar Asignar:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};
