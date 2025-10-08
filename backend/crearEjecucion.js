const { sql, poolPromise } = require("./db");

module.exports = async (req, res) => {
    const { flujoSeleccionado, datos, tipoFlujo, prioridad, solicitante, identificador, estado, FHInicio } = req.body;

    const FlujoEjecutado = `${flujoSeleccionado}_${Date.now()}`; // nombre + timestamp

    try {
        const pool = await poolPromise;

        const insertQuery = `
            INSERT INTO ejecucionesRealizadas 
            (FlujoEjecutado, Solicitante, Identificador, FlujoSeleccionado, Estado, FHInicio, Prioridad, Datos)
            VALUES (@FlujoEjecutado, @Solicitante, @Identificador, @FlujoSeleccionado, @Estado, @FHInicio, @Prioridad, @Datos);
        `;

        await pool.request()
            .input("FlujoEjecutado", sql.VarChar, FlujoEjecutado)
            .input("Solicitante", sql.VarChar, solicitante)
            .input("Identificador", sql.VarChar, identificador)
            .input("FlujoSeleccionado", sql.VarChar, flujoSeleccionado)
            .input("Estado", sql.VarChar, estado)
            .input("FHInicio", sql.DateTime, FHInicio)
            .input("Prioridad", sql.VarChar, prioridad)
            .input("Datos", sql.VarChar, datos)
            .query(insertQuery);

        res.json({ success: true });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
};

