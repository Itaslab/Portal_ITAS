//app_Servicios_ITAS.js
const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("./db");
const schema = process.env.DB_SCHEMA;

//EndPoint Galeria

router.get("/integraciones_grilla", async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
        SELECT
          IdPedido,
          Servicio,
          Linea,
          Subscriber,
          Cuenta,
          Customer,
          Justificacion,
          Id_Usuario,
          FechaSolicitud,
          Estado,
          FechaInicio,
          FechaFin,
          ResultadoJson,
          Resultado,
          ErrorDetalle
        FROM ${schema}.Servicios_ITAS
        ORDER BY IdPedido DESC
      `);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error("💥 ERROR OBTENIENDO PEDIDOS:", error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// EndPoint Mis Pedidos

router.get("/integraciones_grilla_mis_pedidos", async (req, res) => {

  try {

    const pool = await poolPromise;

    const Id_Usuario =
      req.session?.user?.ID_Usuario;

    const result = await pool
      .request()
      .input(
        "Id_Usuario",
        sql.Int,
        Id_Usuario
      )
      .query(`
        SELECT
          IdPedido,
          Servicio,
          Linea,
          Subscriber,
          Cuenta,
          Customer,
          Justificacion,
          Id_Usuario,
          ParametrosJson,
          FechaSolicitud,
          Estado,
          FechaInicio,
          FechaFin,
          ResultadoJson,
          Resultado,
          ErrorDetalle
        FROM ${schema}.Servicios_ITAS
        WHERE Id_Usuario = @Id_Usuario
        ORDER BY IdPedido DESC
      `);

    res.json({
      success: true,
      data: result.recordset,
    });

  } catch (error) {

    console.error(
      "💥 ERROR OBTENIENDO MIS PEDIDOS:",
      error
    );

    res.status(500).json({
      success: false,
      error: error.message,
    });

  }

});
//EndPoint Ejecutar Pedido

router.post("/integraciones", async (req, res) => {
  try {
    console.log(req.body);

    const pool = await poolPromise;

    const {
      Servicio,
      Linea,
      Subscriber,
      Cuenta,
      Customer,
      Justificacion,
      TipoUbicacion,
      City,
      Locality,
      StateOrProvince,
      StreetName,
      StreetNr,
      Departamento,
      Piso
    } = req.body;
    let ParametrosJson = {};
    if (
      Servicio === "S020" ||
      Servicio === "S039"
    ) {
    
      let TipoBusqueda = null;
      let Valor = null;
    
      if (Linea) {
        TipoBusqueda = "Linea";
        Valor = Linea;
      }
    
      if (Subscriber) {
        TipoBusqueda = "Subscriber";
        Valor = Subscriber;
      }
    
      if (Cuenta) {
        TipoBusqueda = "Cuenta";
        Valor = Cuenta;
      }
    
      if (Customer) {
        TipoBusqueda = "Customer";
        Valor = Customer;
      }
    
      ParametrosJson = {
        TipoBusqueda,
        Valor
      };
    
    }
    if (Servicio === "S623") {

      ParametrosJson = {
        TipoUbicacion,
        City,
        Locality,
        StateOrProvince,
        StreetName,
        StreetNr,
        Departamento,
        Piso
      };
    
    }
    ParametrosJson =
    JSON.stringify(ParametrosJson);
    const Id_Usuario = req.session?.user?.ID_Usuario;

    const result = await pool
      .request()
      .input("Servicio", sql.VarChar(10), Servicio)
      .input("Linea", sql.VarChar(50), Linea || null)
      .input("Subscriber", sql.VarChar(50), Subscriber || null)
      .input("Cuenta", sql.VarChar(50), Cuenta || null)
      .input("Customer", sql.VarChar(50), Customer || null)
      .input("Justificacion", sql.VarChar(500), Justificacion)
      .input("Id_Usuario", sql.Int, Id_Usuario)
      .input("Estado", sql.VarChar(20), "Pendiente")
      .input("FechaInicio", sql.DateTime, new Date())
      .input("ParametrosJson",sql.NVarChar(sql.MAX),
        ParametrosJson 
      )
      .query(`
      INSERT INTO ${schema}.Servicios_ITAS (
        Servicio,
        Linea,
        Subscriber,
        Cuenta,
        Customer,
        Justificacion,
        Id_Usuario,
        ParametrosJson,
        FechaSolicitud,
        Estado,
        FechaInicio
    )
    VALUES (
        @Servicio,
        @Linea,
        @Subscriber,
        @Cuenta,
        @Customer,
        @Justificacion,
        @Id_Usuario,
        @ParametrosJson,
        GETDATE(),
        @Estado,
        @FechaInicio
    );
  
          SELECT SCOPE_IDENTITY() AS newId;
        `);

    const newId = result.recordset[0].newId;

    res.json({
      success: true,
      idPedido: newId,
    });
  } catch (error) {
    console.error("💥 ERROR CREANDO PEDIDO:", error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
