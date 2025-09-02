// server.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

const login = require("./loginBack");
const listaEjecuciones = require("./listaEjecuciones");
const crearEjecucion = require("./crearEjecucion");
const obtenerEjecuciones = require("./galeriaEjecuciones");

const app = express();

app.use(cors());
app.use(bodyParser.json());

// Rutas API
app.post("/login", login);
app.get("/flujos", listaEjecuciones);
app.post("/crearEjecucion", crearEjecucion);
app.get("/ejecuciones", obtenerEjecuciones);

// Servir frontend: mapear carpetas individuales
app.use("/pages", express.static(path.join(__dirname, "../pages")));
app.use("/js", express.static(path.join(__dirname, "../js")));
app.use("/css", express.static(path.join(__dirname, "../css")));
app.use("/images", express.static(path.join(__dirname, "../images")));

app.use(express.static(path.join(__dirname, "../")));

const PORT = 8000;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));

