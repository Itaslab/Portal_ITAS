// server.js

console.log("🔥 SERVER REAL:", __filename);


const path = require("path");
const express = require("express");


require("dotenv").config({
  path: process.env.NODE_ENV === "production"
    ? path.join(__dirname, '.env.production')  // Para producción
    : path.join(__dirname, '.env.test')  // Para test/local
});

const schema = process.env.DB_SCHEMA;



const bodyParser = require("body-parser");
const cors = require("cors");
const https = require("https");
const fs = require("fs");
const session = require("express-session");
const bcrypt = require("bcrypt");
const { sql, poolPromise } = require("./db");
 
// ------------------- IMPORTAR RUTAS -------------------
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
const { obtenerPermisosUsuarioActual, obtenerPermisosUsuario } = require("./appPermisos");
const appOrdenesSFGaleriaAuto = require("./appOrdenesSF_galeriaMq");
const ejecucionesDetalle = require("./galeriaEjecucionesDetalles");
const logs = require("./logs");
const accionesEjecuciones  = require("./galeriaEjecuciones_acciones");
const vaultContraseñas = require("./seginf_VaultContraseñas");
const blanqueoPasswordPortalItas = require("./blanqueoPasswordPortalITAS");



 
 
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
        SELECT u.ID_Usuario,
               w.PasswordHash,
               w.Blanquear_Pass
        FROM ${schema}.USUARIO u
        INNER JOIN ${schema}.WEB_PORTAL_ITAS_USR w
          ON u.ID_Usuario = w.ID_Usuario
        WHERE u.Email = @email
      `);

    if (result.recordset.length === 0) {
      return res.json({
        success: false,
        error: "Usuario o contraseña incorrectos"
      });
    }

    const user = result.recordset[0];

    const passwordOk = await bcrypt.compare(password, user.PasswordHash);
    if (!passwordOk) {
      return res.json({
        success: false,
        error: "Usuario o contraseña incorrectos"
      });
    }

    // 👉 Si Blanquear_Pass = 0 o false → obligar cambio de contraseña
    // Maneja BIT de SQL Server que puede ser 0, 1, true, false o null
    const blanquearValue = user.Blanquear_Pass;
    const forcePasswordChange = blanquearValue === 0 || blanquearValue === false;

    // guardar sesión
    req.session.user = {
      email,
      ID_Usuario: user.ID_Usuario,
      forcePasswordChange
    };

    // devolver respuesta al frontend
    return res.json({
      success: true,
      ID_Usuario: user.ID_Usuario,
      Email: email,
      forcePasswordChange
    });

  } catch (err) {
    console.error("Error en login:", err);
    return res.status(500).json({
      success: false,
      error: "Error interno"
    });
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
app.use("/api/acciones", accionesEjecuciones);
app.use("/api/logs", logs);
 
// ------------------- BÓVEDA DE CONTRASEÑAS (SEGURIDAD INFORMÁTICA) -------------------
app.post("/vault/guardar", vaultContraseñas.guardarCredencial);
app.get("/vault/listar", vaultContraseñas.listarContraseñas);
app.get("/vault/desencriptar/:id", vaultContraseñas.desencriptarContraseña);

// ------------------- BLANQUEO DE CONTRASEÑA (ADMIN) -------------------
app.use("/", blanqueoPasswordPortalItas);
 
// Obtener permisos del usuario actual (desde sesión)
app.get("/permisos", checkAuth, obtenerPermisosUsuarioActual);

// Obtener permisos de un usuario específico (para otros usos)
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
 
const PORT = process.env.PORT || 8080;

if (process.env.NODE_ENV === "production") {
  const httpsOptions = {
    key: fs.readFileSync(process.env.SSL_KEY_PATH),
    cert: fs.readFileSync(process.env.SSL_CERT_PATH)
  };

  https.createServer(httpsOptions, app).listen(PORT, () => {
    console.log(`🔐 HTTPS PROD corriendo en https://portal-itas.telecom.com.ar:${PORT}`);
  });

} else {
  app.listen(PORT,"127.0.0.1",() => {
    console.log(`🌐 HTTP TEST corriendo en http://127.0.0.1:${PORT}`);
  });
}