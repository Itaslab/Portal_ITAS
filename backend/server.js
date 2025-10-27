const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const https = require("https");
const fs = require("fs");
const session = require("express-session");

// Importar rutas del backend
const login = require("./loginBack");
const listaEjecuciones = require("./listaEjecuciones");
const crearEjecucion = require("./crearEjecucion");
const obtenerEjecuciones = require("./galeriaEjecuciones");
const generarUsuario = require("./generarUsuario_tbUsuarios");
const { sql, poolPromise } = require("./db");

const app = express();

// ------------------- MIDDLEWARE -------------------
app.use(cors());
app.use(bodyParser.json());

// Configuración de sesiones
app.use(
  session({
    secret: "clave-super-secreta", // Cambiala por una frase aleatoria
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false, // true si usás HTTPS detrás de Nginx reverse proxy
      maxAge: 1000 * 60 * 60, // 1 hora
    },
  })
);

// ------------------- RUTAS API -------------------
app.post("/login", login);
app.get("/flujos", listaEjecuciones);
app.post("/crearEjecucion", crearEjecucion);
app.get("/ejecuciones", obtenerEjecuciones);
app.use("/", generarUsuario);

// ------------------- SERVIR FRONTEND -------------------

// Servir todos los archivos estáticos desde la raíz del proyecto
app.use(express.static(path.join(__dirname, "..")));

// Middleware para proteger las páginas internas
app.use((req, res, next) => {
  const isHTML = req.path.endsWith(".html");

  // Si no está logueado e intenta acceder a cualquier HTML excepto ingreso.html → redirigir
  if (isHTML && req.path !== "/ingreso.html" && !req.session.user) {
    return res.redirect("/ingreso.html");
  }

  next();
});

// Redirigir la raíz o /index.html al login
app.get("/", (req, res) => {
  res.redirect("/ingreso.html");
});

app.get("/index.html", (req, res) => {
  res.redirect("/ingreso.html");
});

// ------------------- HTTPS -------------------
const httpsOptions = {
  key: fs.readFileSync("/etc/nginx/ssl/test-web.key"),
  cert: fs.readFileSync("/etc/nginx/ssl/test-web.crt"),
};

const PORT = 8080;
https.createServer(httpsOptions, app).listen(PORT, () => {
  console.log(`✅ Servidor HTTPS corriendo en https://10.4.48.116:${PORT}`);
});
