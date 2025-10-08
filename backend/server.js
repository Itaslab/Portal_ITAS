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
 
const app = express();
 
// Middleware
app.use(cors());
app.use(bodyParser.json());
 
// Rutas API
app.post("/login", login);
app.get("/flujos", listaEjecuciones);
app.post("/crearEjecucion", crearEjecucion);
app.get("/ejecuciones", obtenerEjecuciones);
 
// Servir frontend
app.use("/pages", express.static(path.join(__dirname, "../pages")));
app.use("/js", express.static(path.join(__dirname, "../js")));
app.use("/css", express.static(path.join(__dirname, "../css")));
app.use("/images", express.static(path.join(__dirname, "../images")));
app.use(express.static(path.join(__dirname, "../")));
 
// Configuración HTTPS
const httpsOptions = {
            key: fs.readFileSync("/etc/nginx/ssl/test-web.key"),
            cert: fs.readFileSync("/etc/nginx/ssl/test-web.crt")
};
 
const PORT = 8080;
https.createServer(httpsOptions, app).listen(PORT, () => {
    console.log(`Servidor HTTPS corriendo en https://10.4.48.116:${PORT}`);
});

