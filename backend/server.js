const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const https = require("https");
const fs = require("fs");

// Importar rutas
const login = require("./loginBack");
const listaEjecuciones = require("./listaEjecuciones");
const crearEjecucion = require("./crearEjecucion");
const obtenerEjecuciones = require("./galeriaEjecuciones");
const { sql, poolPromise } = require("./db");

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// ------------------- RUTAS API -------------------
app.post("/login", login);
app.get("/flujos", listaEjecuciones);
app.post("/crearEjecucion", crearEjecucion);
app.get("/ejecuciones", obtenerEjecuciones);

// ------------------- RUTA DE TEST -------------------
app.get("/test", async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query("SELECT TOP 1 ID_Usuario, Email FROM A002103.USUARIO"); // simple
        res.json(result.recordset);
    } catch (err) {
        console.error("Error en /test:", err);
        res.status(500).json({ error: "Error de base de datos" });
    }
});
// ---------------------------------------------------


// ------------------- SERVIR FRONTEND -------------------

// Archivos estáticos (HTML, JS, CSS, imágenes)
app.use(express.static(path.join(__dirname, "..")));

// Ruta principal para el frontend
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "index.html"));
});
// ------------------------------------------------------


// Configuración HTTPS
const httpsOptions = {
    key: fs.readFileSync("/etc/nginx/ssl/test-web.key"),
    cert: fs.readFileSync("/etc/nginx/ssl/test-web.crt")
};

const PORT = 8080;
https.createServer(httpsOptions, app).listen(PORT, () => {
    console.log(`Servidor HTTPS corriendo en https://10.4.48.116:${PORT}`);
});


