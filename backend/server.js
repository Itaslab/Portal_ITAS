const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const https = require("https");
const fs = require("fs");
const session = require("express-session");

// Importar rutas
const login = require("./loginBack");
const listaEjecuciones = require("./listaEjecuciones");
const crearEjecucion = require("./crearEjecucion");
const obtenerEjecuciones = require("./galeriaEjecuciones");
const generarUsuario = require("./generarUsuario_tbUsuarios");

const app = express();

// ------------------- MIDDLEWARE -------------------
app.use(cors());
app.use(bodyParser.json());

// Configuración de sesión
app.use(
  session({
    secret: "clave-super-secreta",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 1000 * 60 * 60 } // 1 hora
  })
);

// ------------------- RUTAS API -------------------
app.post("/login", login);
app.get("/flujos", listaEjecuciones);
app.post("/crearEjecucion", crearEjecucion);
app.get("/ejecuciones", obtenerEjecuciones);
app.use("/", generarUsuario);

// ------------------- SERVIR FRONTEND -------------------
app.use(express.static(path.join(__dirname, "..")));

// Middleware de protección para páginas internas
app.use((req, res, next) => {
  const paginasProtegidas = [
    "/pages/Front_APPs.html",
    // agregá aquí otras páginas internas que quieras proteger
  ];

  // Si la ruta solicitada es interna y no hay sesión iniciada, redirige al login
  if (paginasProtegidas.some(p => req.path.startsWith(p)) && (!req.session || !req.session.user)) {
    return res.redirect("/ingreso.html");
  }

  next();
});

// Ruta raíz e index
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "ingreso.html"));
});

app.get("/index.html", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "ingreso.html"));
});

// ------------------- CONFIGURACIÓN HTTPS -------------------
const httpsOptions = {
  key: fs.readFileSync("/etc/nginx/ssl/test-web.key"),
  cert: fs.readFileSync("/etc/nginx/ssl/test-web.crt"),
};

const PORT = 8080;
https.createServer(httpsOptions, app).listen(PORT, () => {
  console.log(`Servidor HTTPS corriendo en https://10.4.48.116:${PORT}`);
});
