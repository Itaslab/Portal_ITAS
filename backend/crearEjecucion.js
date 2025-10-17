const { sql, poolPromise } = require("./db");

module.exports = async (req, res) => {
    const { flujoSeleccionado, datos, tipoFlujo, prioridad, solicitante, identificador } = req.body;

    try {
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // --- Insert en RPA_TASKLIST ---
            const tasklistRequest = new sql.Request(transaction);

            const insertTasklistQuery = `
                INSERT INTO a002103.RPA_TASKLIST
                    (Id_Usuario, Identificador, Id_Flujo, Fecha_Pedido, Cant_Reintentos, Indice_Ultimo_Registro, Id_Estado)
                OUTPUT INSERTED.id_tasklist
                VALUES (@Id_Usuario, @Identificador, @Id_Flujo, GETDATE(), 0, 0, 1);
            `;

            const tasklistResult = await tasklistRequest
                .input("Id_Usuario", sql.VarChar, solicitante)
                .input("Identificador", sql.VarChar, identificador)
                .input("Id_Flujo", sql.VarChar, flujoSeleccionado)
                .query(insertTasklistQuery);

            const id_tasklist = tasklistResult.recordset[0].id_tasklist;

            // --- Insert en RPA_RESULTADOS ---
            const lineas = datos.split('\n').filter(l => l.trim() !== '');

            for (let i = 0; i < lineas.length; i++) {
                const requestResultado = new sql.Request(transaction);
                await requestResultado
                    .input("id_tasklist", sql.Int, id_tasklist)
                    .input("indice_task", sql.Int, i + 1)
                    .input("dato", sql.VarChar, lineas[i])
                    .query(`
                        INSERT INTO a002103.RPA_RESULTADOS (id_tasklist, indice_task, dato)
                        VALUES (@id_tasklist, @indice_task, @dato);
                    `);
            }

            await transaction.commit();
            res.json({ success: true, id_tasklist });

        } catch (err) {
            await transaction.rollback();
            console.error("Error en transacción:", err);
            res.status(500).json({ success: false, error: err.message });
        }

    } catch (err) {
        console.error("Error al conectar con DB:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};
