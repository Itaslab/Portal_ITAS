const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const https = require("https");
const fs = require("fs");
const session = require("express-session");

// Importar módulos backend
const login = require("./loginBack");
const listaEjecuciones = require("./listaEjecuciones");
const crearEjecucion = require("./crearEjecucion");
const obtenerEjecuciones = require("./galeriaEjecuciones");
const generarUsuario = require("./generarUsuario_tbUsuarios");

const app = express();

// ------------------- MIDDLEWARE -------------------
app.use(cors());
app.use(bodyParser.json());

// Configurar sesiones
app.use(
  session({
    secret: "clave-super-secreta",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Si usás proxy HTTPS como Nginx, podés poner true
      maxAge: 1000 * 60 * 60, // 1 hora
    },
  })
);

// ------------------- RUTAS API -------------------

// Login (usa loginBack.js)
app.post("/login", async (req, res, next) => {
  try {
    await login(req, res);
  } catch (err) {
    next(err);
  }
});

// Rutas de tus otros módulos
app.get("/flujos", listaEjecuciones);
app.post("/crearEjecucion", crearEjecucion);
app.get("/ejecuciones", obtenerEjecuciones);
app.use("/", generarUsuario);

// ------------------- FRONTEND -------------------

// Servir archivos estáticos (desde la raíz del proyecto)
app.use(express.static(path.join(__dirname, "..")));

// 🔐 Middleware de protección
app.use((req, res, next) => {
  const rutaProtegida = req.path.endsWith("Front_APPs.html");

  if (rutaProtegida && !req.session.user) {
    console.log("⚠️ Intento de acceso sin login, redirigiendo a ingreso.html");
    return res.redirect("/ingreso.html");
  }

  next();
});

// 🔹 Ruta raíz → ingreso.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "ingreso.html"));
});

// 🔹 Asegurar acceso directo a Front_APPs.html (con protección)
app.get("/pages/Front_APPs.html", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/ingreso.html");
  }
  res.sendFile(path.join(__dirname, "..", "pages", "Front_APPs.html"));
});

// ------------------------------------------------------
// Configuración HTTPS (ajustá paths de tus certificados)
const httpsOptions = {
  key: fs.readFileSync("/etc/nginx/ssl/test-web.key"),
  cert: fs.readFileSync("/etc/nginx/ssl/test-web.crt"),
};

const PORT = 8080;

https.createServer(httpsOptions, app).listen(PORT, () => {
  console.log(`✅ Servidor HTTPS corriendo en https://10.4.48.116:${PORT}`);
});

