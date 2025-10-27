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
const generarUsuario = require("./generarUsuario_tbUsuarios");
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
app.use("/", generarUsuario);

// ------------------- SERVIR FRONTEND -------------------

// Servir todos los archivos estáticos (HTML, JS, CSS, imágenes)
app.use(express.static(path.join(__dirname, "..")));

// Página principal → ingreso.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "ingreso.html"));
});

// Si alguien va a /index.html, lo mandamos también a ingreso.html
app.get("/index.html", (req, res) => {
  res.redirect("/ingreso.html");
});

// ------------------------------------------------------

// Configuración HTTPS
const httpsOptions = {
  key: fs.readFileSync("/etc/nginx/ssl/test-web.key"),
  cert: fs.readFileSync("/etc/nginx/ssl/test-web.crt")
};

const PORT = 8080;
https.createServer(httpsOptions, app).listen(PORT, () => {
  console.log(`✅ Servidor HTTPS corriendo en https://10.4.48.116:${PORT}`);
});

