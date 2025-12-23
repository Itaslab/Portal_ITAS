const { sql, poolPromise } = require("./db");
const schema = process.env.DB_SCHEMA;


module.exports = async (req, res) => {
  try {
    const { id, nombre, negocio, script, esquema_json, activo } = req.body;

    if (!id)
      return res.status(400).json({ success: false, error: "Falta el ID" });

    const pool = await poolPromise;

    const query = `
      UPDATE ${schema}.APP_ORDENES_BAJADA
      SET 
        Nombre = @nombre,
        Negocio = @negocio,
        Script = @script,
        Esquema_JSON = @esquema_json,
        Activo = @activo
      WHERE ID = @id;
    `;

    await pool.request()
      .input("nombre", sql.VarChar, nombre || null)
      .input("negocio", sql.VarChar, negocio || null)
      .input("script", sql.VarChar, script || null)
      .input("esquema_json", sql.VarChar, esquema_json || null)
      .input("activo", sql.Bit, activo ? 1 : 0)
      .input("id", sql.Int, id)
      .query(query);

    res.json({ success: true, message: "Orden actualizada correctamente" });
  } catch (err) {
    console.error("Error al actualizar orden:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};