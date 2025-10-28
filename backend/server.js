const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const https = require("https");
const fs = require("fs");
const session = require("express-session");
const { sql, poolPromise } = require("./db");

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

// 🔐 CONFIGURACIÓN DE SESIÓN
app.use(
  session({
    secret: "clave-super-secreta",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // si usás HTTPS con proxy nginx, puede ser true
  })
);

// ------------------- RUTAS API -------------------

// 🚪 LOGIN
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("email", sql.VarChar, email)
      .query(
        "SELECT u.ID_Usuario, w.Password FROM a002103.USUARIO u INNER JOIN a002103.WEB_PORTAL_ITAS_USR w ON u.ID_Usuario = w.ID_Usuario WHERE u.Email = @email"
      );

    if (result.recordset.length === 0) {
      return res.json({ success: false, error: "Usuario o contraseña incorrectos" });
    }

    const user = result.recordset[0];
    if (user.Password !== password) {
      return res.json({ success: false, error: "Usuario o contraseña incorrectos" });
    }

    req.session.user = {
      email,
      ID_Usuario: user.ID_Usuario,
    };

    return res.json({
      success: true,
      message: "Login correcto",
      ID_Usuario: user.ID_Usuario,
      Email: email,
    });
  } catch (err) {
    console.error("Error en login:", err.message, err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 🚪 LOGOUT
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/ingreso.html");
  });
});

// API adicionales
app.get("/flujos", listaEjecuciones);
app.post("/crearEjecucion", crearEjecucion);
app.get("/ejecuciones", obtenerEjecuciones);
app.use("/", generarUsuario);

// ------------------- PROTECCIÓN DE PÁGINAS -------------------
function checkAuth(req, res, next) {
  if (req.session.user) return next();
  res.redirect("/ingreso.html");
}

// Archivos estáticos públicos (solo CSS, JS, imágenes)
app.use("/css", express.static(path.join(__dirname, "..", "css")));
app.use("/js", express.static(path.join(__dirname, "..", "js")));
app.use("/images", express.static(path.join(__dirname, "..", "images")));

// Páginas internas protegidas
app.get("/pages/Front_APPs.html", checkAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "..", "pages", "Front_APPs.html"));
});

// Podés agregar más páginas internas así:
// app.get("/pages/otraPagina.html", checkAuth, (req, res) => {...})

// Ruta principal del login
app.get("/ingreso.html", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "ingreso.html"));
});

// ------------------- HTTPS -------------------
const httpsOptions = {
  key: fs.readFileSync("/etc/nginx/ssl/test-web.key"),
  cert: fs.readFileSync("/etc/nginx/ssl/test-web.crt"),
};

const PORT = 8080;
https.createServer(httpsOptions, app).listen(PORT, () => {
  console.log(`Servidor HTTPS corriendo en https://10.4.48.116:${PORT}`);
});

