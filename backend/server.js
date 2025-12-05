// server.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const https = require("https");
const fs = require("fs");
const session = require("express-session");
const { sql, poolPromise } = require("./db");
 
// ------------------- IMPORTAR RUTAS -------------------
const login = require("./loginBack");
const listaEjecuciones = require("./listaEjecuciones");
const crearEjecucion = require("./crearEjecucion");
const obtenerEjecuciones = require("./galeriaEjecuciones");
const generarUsuario = require("./generarUsuario_tbUsuarios");
const appOrdenesSFgaleriaUsuarios = require("./appOrdenesSF_GaleriaUsuarios");
const updateAsignar = require("./appOrdenesSF_updateAsignar");
const appOrdenesSFUsuarioDetalle = require("./appOrdenesSF_usuarioDetalle");
const actualizarUsuario = require("./appOrdenesSF_actualizarUsuario");
const modificarUsuario = require("./generarUsuario_modificarTbUsuarios");
const generarUsuarioOrdenes = require("./appOrdenesSF_AltaUsuario");
const usuarioMe = require('./usuarioMe');
const { obtenerPermisosUsuario } = require("./appPermisos");
const appOrdenesSFGaleriaAuto = require("./appOrdenesSF_galeriaMq");
const ejecucionesDetalle = require("./galeriaEjecucionesDetalles");
const logs = require("./logs"); // <-- importar el nuevo router

 
 
// 🔥 Tu nueva ruta unificada scripts
const rutasScripts = require("./appOrdenesSF_GaleriaScript");
 
const app = express();
 
// ------------------- MIDDLEWARE -------------------
app.use(cors());
app.use(bodyParser.json());
app.set("trust proxy", 1);
 
// ------------------- SESIÓN -------------------
app.use(
  session({
    secret: "clave-super-secreta",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 2
    },
  })
);
 
// ------------------- LOGIN -------------------
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
 
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("email", sql.VarChar, email)
      .query(`
        SELECT u.ID_Usuario, w.Password
        FROM a002103.USUARIO u
        INNER JOIN a002103.WEB_PORTAL_ITAS_USR w
        ON u.ID_Usuario = w.ID_Usuario
        WHERE u.Email = @email
      `);
 
    if (result.recordset.length === 0)
      return res.json({ success: false, error: "Usuario o contraseña incorrectos" });
 
    const user = result.recordset[0];
    if (user.Password !== password)
      return res.json({ success: false, error: "Usuario o contraseña incorrectos" });
 
    req.session.user = {
      email,
      ID_Usuario: user.ID_Usuario,
    };
 
    return res.json({
      success: true,
      message: "Login correcto",
      ID_Usuario: user.ID_Usuario,
      Email: email
    });
 
  } catch (err) {
    console.error("Error en login:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});
 
// ------------------- LOGOUT -------------------
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/ingreso.html");
  });
});
 
// ------------------- API REST -------------------
app.get("/flujos", listaEjecuciones);
app.post("/crearEjecucion", crearEjecucion);
app.get("/ejecuciones", obtenerEjecuciones);
app.use("/api/ejecuciones", ejecucionesDetalle);
app.get("/usuarios", appOrdenesSFgaleriaUsuarios);
app.get("/usuarios/:id_usuario", appOrdenesSFUsuarioDetalle);
app.post("/usuarios/:id_usuario/asignar", updateAsignar);
app.post("/usuarios/actualizar", actualizarUsuario);
app.use("/api/galeria-auto-mq", appOrdenesSFGaleriaAuto);
app.use("/api/logs", logs);
 
 
app.get("/permisos/:id_usuario", checkAuth, obtenerPermisosUsuario);
 
 
app.use("/", generarUsuario);
app.use("/", modificarUsuario);
app.use("/", generarUsuarioOrdenes);
app.use("/", usuarioMe);
 
// 🔥 NUEVA API DE SCRIPTS (funciona con tu JS)
app.use("/api/scripts", rutasScripts);
 


// ------------------- PROTECCIÓN -------------------
function checkAuth(req, res, next) {
  if (req.session.user) return next();
  res.redirect("/ingreso.html");
}
 
// Archivos estáticos
app.use("/css", express.static(path.join(__dirname, "..", "css")));
app.use("/js", express.static(path.join(__dirname, "..", "js")));
app.use("/images", express.static(path.join(__dirname, "..", "images")));
 
// Proteger páginas
app.use("/pages", checkAuth, express.static(path.join(__dirname, "..", "pages")));
 
app.get("/ingreso.html", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "ingreso.html"));
});
 
app.get("/", (req, res) => {
  res.redirect("/ingreso.html");
});
 
// ------------------- HTTPS -------------------
//const httpsOptions = {
//  key: fs.readFileSync("/etc/nginx/ssl/test-web.key"),
//  cert: fs.readFileSync("/etc/nginx/ssl/test-web.crt"),
//};
 
const httpsOptions = {
  key: fs.readFileSync("/app/cert/portal-itas.telecom.com.ar.key"),
  cert: fs.readFileSync("/app/cert/fullchain.crt"), // certificado + intermedio
};
 
const PORT = 8080;
https.createServer(httpsOptions, app).listen(PORT, () => {
 // console.log(`✅ HTTPS corriendo en https://10.4.48.116:${PORT}`);
  console.log(`✅ HTTPS corriendo en https://portal-itas.telecom.com.ar:${PORT}`);
});