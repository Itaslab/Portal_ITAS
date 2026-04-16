router.post("/", async (req, res) => {

  try {

    const { tipoLic, fechaDesde, fechaHasta, idUsuarioDestino } = req.body;

    // 🔥 CLAVE: elegir a quién se le crea la licencia
    const idUsuario = idUsuarioDestino || req.session.user.ID_Usuario;

    const pool = await poolPromise;

    // Buscar legajo del usuario destino
    const legajoResult = await pool.request()
      .input("idUsuario", sql.Int, idUsuario)
      .query(`
        SELECT Legajo
        FROM ${schema}.USUARIO
        WHERE ID_Usuario = @idUsuario
      `);

    if (!legajoResult.recordset.length) {
      return res.status(400).json({
        success: false,
        error: "Usuario destino inválido"
      });
    }

    const legajo = legajoResult.recordset[0].Legajo;

    // Generar AñoMes
    const hoy = new Date();
    const anioMes = hoy.getFullYear().toString() +
      String(hoy.getMonth() + 1).padStart(2, "0");

    // Insert licencia
    await pool.request()
      .input("tipoLic", sql.VarChar, tipoLic)
      .input("fechaDesde", sql.Date, fechaDesde)
      .input("fechaHasta", sql.Date, fechaHasta)
      .input("idUsuario", sql.Int, idUsuario)
      .input("legajo", sql.VarChar, legajo)
      .input("anioMes", sql.Int, anioMes)
      .query(`
        INSERT INTO ${schema}.LICENCIAS_SMART
        (Licencia, Fecha_Desde, Fecha_Hasta, ID_Usuario, Legajo, Smart, Estado, AnioMes)
        VALUES
        (@tipoLic, @fechaDesde, @fechaHasta, @idUsuario, @legajo, 'No', 'PENDING', @anioMes)
      `);

    res.json({ success: true });

  } catch (error) {

    console.error("Error creando licencia:", error);

    res.status(500).json({
      success: false,
      error: "Error al crear licencia"
    });

  }

});