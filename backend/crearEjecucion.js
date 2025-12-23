const { sql, poolPromise } = require("./db");
const schema = process.env.DB_SCHEMA;


module.exports = async (req, res) => {
    const { flujoSeleccionado, nombreFlujo, datos, solicitante, identificador, prioridad } = req.body;

    let transaction;

    try {
        const pool = await poolPromise;
        transaction = new sql.Transaction(pool);
        await transaction.begin();

        // 🔹 Generar título dinámico con nombre del flujo
        const ahora = new Date();
        const fecha = ahora.toISOString().split("T")[0].replace(/-/g, ""); // YYYYMMDD
        const hora = ahora.toTimeString().split(" ")[0].replace(/:/g, ""); // HHMMSS
        const tituloTasklist = `Portal_ITAS_${nombreFlujo}_${hora}_${fecha}`;

        // --- 1️⃣ Insert en RPA_TASKLIST ---
        const tasklistRequest = new sql.Request(transaction);
        const insertTasklistQuery = `
            INSERT INTO ${schema}.RPA_TASKLIST
                (Id_Usuario, Identificador, Id_Flujo, Fecha_Pedido, Cant_Reintentos, Indice_Ultimo_Registro, Id_Estado, 
                 Titulo_Tasklist, Avance, Prioridad)
            OUTPUT INSERTED.id_tasklist
            VALUES (@Id_Usuario, @Identificador, @Id_Flujo, GETDATE(), 0, 0, 1, @Titulo_Tasklist, @Avance, @Prioridad);
        `;

        const identificadorSQL = identificador?.substring(0, 100) || "SinIdentificador";

        const tasklistResult = await tasklistRequest
            .input("Id_Usuario", sql.Int, solicitante)
            .input("Identificador", sql.VarChar(100), identificadorSQL)
            .input("Id_Flujo", sql.Int, flujoSeleccionado)
            .input("Titulo_Tasklist", sql.VarChar, tituloTasklist)
            .input("Avance", sql.Int, 0)
            .input("Prioridad", sql.Int, prioridad)
            .query(insertTasklistQuery);

        const id_tasklist = tasklistResult.recordset[0]?.id_tasklist;
        if (!id_tasklist) throw new Error("No se generó id_tasklist en la inserción de Tasklist.");

        // --- 2️⃣ Insert en RPA_RESULTADOS ---
        const lineas = datos.split(/\r?\n/).filter(l => l.trim() !== "");
        for (let i = 0; i < lineas.length; i++) {
            const requestResultado = new sql.Request(transaction);
            await requestResultado
                .input("id_tasklist", sql.Int, id_tasklist)
                .input("indice_task", sql.Int, i + 1)
                .input("dato", sql.VarChar(sql.MAX), lineas[i].trim())
                .query(`
                    INSERT INTO ${schema}.RPA_RESULTADOS (id_tasklist, indice_task, dato, Fecha_Pedido)
                    VALUES (@id_tasklist, @indice_task, @dato, GETDATE());
                `);
        }

        // --- 3️⃣ Actualizar Reg_Totales en RPA_TASKLIST ---
        const updateTasklistRequest = new sql.Request(transaction);
        await updateTasklistRequest
            .input("RegTotales", sql.Int, lineas.length)
            .input("id_tasklist", sql.Int, id_tasklist)
            .query(`
                UPDATE ${schema}.RPA_TASKLIST
                SET Reg_Totales = @RegTotales
                WHERE id_tasklist = @id_tasklist;
            `);

        // --- 4️⃣ Commit final ---
        await transaction.commit();

        res.json({
            success: true,
            id_tasklist,
            cantidad: lineas.length,
            tituloTasklist
        });

    } catch (err) {
        if (transaction) {
            try { await transaction.rollback(); } catch {}
        }
        console.error("❌ Error en crearEjecucion:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};
