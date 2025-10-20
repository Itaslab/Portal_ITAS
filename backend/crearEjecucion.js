const { sql, poolPromise } = require("./db");

module.exports = async (req, res) => {
    const { flujoSeleccionado, nombreFlujo, datos, solicitante, prioridad } = req.body;

    let transaction;
    try {
        const pool = await poolPromise;
        const lineas = datos.split(/\r?\n/).filter(l => l.trim() !== "");

        if (lineas.length === 0) {
            throw new Error("No se detectaron datos válidos para procesar.");
        }

        transaction = new sql.Transaction(pool);
        await transaction.begin();

        const ahora = new Date();
        const fecha = ahora.toISOString().split("T")[0].replace(/-/g, "");
        const hora = ahora.toTimeString().split(" ")[0].replace(/:/g, "");

        const resultadosInsertados = [];

        for (let i = 0; i < lineas.length; i++) {
            const identificador = lineas[i].trim();

            // 🔹 Crear título con el número
            const tituloTasklist = `Portal_ITAS_${nombreFlujo}_${identificador}_${hora}_${fecha}`;

            // --- 1️⃣ Insert en RPA_TASKLIST ---
            const tasklistRequest = new sql.Request(transaction);
            const insertTasklistQuery = `
                INSERT INTO a002103.RPA_TASKLIST
                    (Id_Usuario, Identificador, Id_Flujo, Fecha_Pedido, Cant_Reintentos, Indice_Ultimo_Registro, Id_Estado, Titulo_Tasklist, Avance, Prioridad)
                OUTPUT INSERTED.id_tasklist
                VALUES (@Id_Usuario, @Identificador, @Id_Flujo, GETDATE(), 0, 0, 1, @Titulo_Tasklist, @Avance, @Prioridad);
            `;

            const tasklistResult = await tasklistRequest
                .input("Id_Usuario", sql.Int, solicitante)
                .input("Identificador", sql.VarChar, identificador)
                .input("Id_Flujo", sql.Int, flujoSeleccionado)
                .input("Titulo_Tasklist", sql.VarChar, tituloTasklist)
                .input("Avance", sql.Int, 0)
                .input("Prioridad", sql.Int, prioridad)
                .query(insertTasklistQuery);

            const id_tasklist = tasklistResult.recordset[0]?.id_tasklist;

            if (!id_tasklist) throw new Error("No se generó id_tasklist.");

            // --- 2️⃣ Insert en RPA_RESULTADOS ---
            const requestResultado = new sql.Request(transaction);
            await requestResultado
                .input("id_tasklist", sql.Int, id_tasklist)
                .input("indice_task", sql.Int, 1)
                .input("dato", sql.VarChar, identificador)
                .query(`
                    INSERT INTO a002103.RPA_RESULTADOS (id_tasklist, indice_task, dato, Fecha_Pedido)
                    VALUES (@id_tasklist, @indice_task, @dato, GETDATE());
                `);

            resultadosInsertados.push({
                id_tasklist,
                identificador,
                tituloTasklist
            });
        }

        await transaction.commit();
        res.json({
            success: true,
            cantidad: resultadosInsertados.length,
            ejecuciones: resultadosInsertados
        });

    } catch (err) {
        if (transaction) {
            try { await transaction.rollback(); } catch {}
        }
        console.error("❌ Error en crearEjecucion múltiple:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};
