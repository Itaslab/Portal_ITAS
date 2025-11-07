// appOrdenesSF_actualizarUsuario.js
const { sql, poolPromise } = require("./db");

module.exports = async (req, res) => {
  try {
    const {
      id_usuario,
      grupo,
      grupo2,
      max_por_trabajar,
      asc_desc,
      modo,
      script,
      des_asignar
    } = req.body;

    if (!id_usuario)
      return res.status(400).json({ success: false, error: "Falta id_usuario" });

    const pool = await poolPromise;

    const query = `
      UPDATE a002103.APP_ORDENES_USR
      SET 
        Grupo = @grupo,
        Grupo2 = @grupo2,
        Max_Por_Trabajar = @max_por_trabajar,
        Asc_Desc = @asc_desc,
        Modo = @modo,
        Script = @script,
        Des_Asignar = @des_asignar
      WHERE ID_Usuario = @id_usuario;
    `;

    await pool.request()
      .input("grupo", sql.VarChar, grupo || null)
      .input("grupo2", sql.VarChar, grupo2 || null)
      .input("max_por_trabajar", sql.Int, max_por_trabajar || 0)
      .input("asc_desc", sql.VarChar, asc_desc || null)
      .input("modo", sql.VarChar, modo || null)
      .input("script", sql.VarChar, script || null)
      .input("des_asignar", sql.Bit, des_asignar ? 1 : 0)
      .input("id_usuario", sql.Int, id_usuario)
      .query(query);

    res.json({ success: true, message: "Usuario actualizado correctamente" });
  } catch (err) {
    console.error("Error al actualizar usuario:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};
