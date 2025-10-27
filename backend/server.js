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
const { sql, poolPromise } = require("./db");

const app = express();

// ------------------- MIDDLEWARE -------------------
app.use(cors());
app.use(bodyParser.json());

// Configurar sesiones
app.use(
  session({
    secret: "clave-super-secreta", // podés cambiarla
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // si tenés HTTPS con proxy/Nginx, se puede poner true
      maxAge: 1000 * 60 * 60, // 1 hora
    },
  })
);

// ------------------- RUTAS API -------------------

// Ruta de login
app.post("/login", async (req, res, next) => {
  try {
    // Ejecuta el login que ya tenés
    await login(req, res);

    // Si loginBack valida correctamente, agregá esto dentro del success de loginBack:
    // req.session.user = { usuario: req.body.usuario };
    // res.json({ success: true });

  } catch (err) {
    next(err);
  }
});

app.get("/flujos", listaEjecuciones);
app.post("/crearEjecucion", crearEjecucion);
app.get("/ejecuciones", obtenerEjecuciones);
app.use("/", generarUsuario);

// ------------------- SERVIR FRONTEND -------------------
app.use(express.static(path.join(__dirname, "..")));

// Middleware de protección para archivos HTML
app.use((req, res, next) => {
  if (
    req.path.endsWith(".html") &&
    req.path !== "/Front_APPs.html" &&
    !req.session.user
  ) {
    return res.redirect("/Front_APPs.html");
  }
  next();
});

// Redirigir raíz o index.html al archivo principal
app.get("/", (req, res) => {
  res.redirect("/Front_APPs.html");
});

app.get("/index.html", (req, res) => {
  res.redirect("/Front_APPs.html");
});

// ------------------------------------------------------

// Configuración HTTPS
const httpsOptions = {
  key: fs.readFileSync("/etc/nginx/ssl/test-web.key"),
  cert: fs.readFileSync("/etc/nginx/ssl/test-web.crt"),
};

const PORT = 8080;
https.createServer(httpsOptions, app).listen(PORT, () => {
  console.log(`Servidor HTTPS corriendo en https://10.4.48.116:${PORT}`);
});
