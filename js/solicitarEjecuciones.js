const dropdown = document.getElementById("dropdownFlujos");
const detalle = document.getElementById("detalleFlujo");
const instrucciones = document.getElementById("instruccionesFlujo");
const flujoTipoSpan = document.getElementById("flujoTipo");
const prioSpan = document.getElementById("prioFlujo");
const datosSolicitados = document.getElementById("datosSolicitados");

let flujos = []; // Array que se llenará desde la DB

// Traer los flujos desde el backend
fetch("http://localhost:8000/flujos")
  .then(res => res.json())
  .then(data => {
      if(data.success){
          flujos = data.flujos; // Guardamos los flujos
          // Poblar dropdown
          flujos.forEach(f => {
              const option = document.createElement("option");
              option.value = f.nombre;
              option.textContent = f.nombre;
              dropdown.appendChild(option);
          });
      }
  })
  .catch(err => console.error("Error al cargar flujos:", err));

// Cambiar detalle, instrucciones y demás al seleccionar un flujo
dropdown.addEventListener("change", () => {
    const flujoSeleccionado = flujos.find(f => f.nombre === dropdown.value);
    if(flujoSeleccionado){
        detalle.value = flujoSeleccionado.detalle;
        instrucciones.value = flujoSeleccionado.instrucciones;
        datosSolicitados.textContent = flujoSeleccionado.campos;
        flujoTipoSpan.textContent = flujoSeleccionado.flujoTipo;
        prioSpan.textContent = flujoSeleccionado.prio;
    } else {
        detalle.value = "";
        instrucciones.value = "";
        datosSolicitados.textContent = "";
        flujoTipoSpan.textContent = "";
        prioSpan.textContent = "";
    }
});



//botones de Enviar y Limpiar 

const btnLimpiar = document.getElementById("btnLimpiar");
const btnEnviar = document.getElementById("btnEnviar");

btnLimpiar.addEventListener("click", () => {
    // Limpiar dropdown
    dropdown.value = "";
    // Limpiar detalle, instrucciones
    detalle.value = "";
    instrucciones.value = "";
    // Limpiar datos solicitados y texto adicional
    document.getElementById("datosSolicitados").textContent = "";
    document.getElementById("inputUsuario").value = "";
    // Limpiar tipo y prioridad
    flujoTipoSpan.textContent = "";
    prioSpan.textContent = "";
});

btnEnviar.addEventListener("click", () => {
    const flujo = dropdown.value;
    const datosValor = datosSolicitados.textContent;
    const tipoFlujo = flujoTipo.textContent;
    const prioFlujoValor = prioSpan.textContent;
    const solicitante = localStorage.getItem("usuario") || "UsuarioDemo";
    const identificador = inputUsuario.value;

    const payload = {
        flujoSeleccionado: flujo,
        datos: datosValor,
        tipoFlujo,
        prioridad: prioFlujoValor,
        solicitante,
        identificador,
        estado: "En proceso",
        FHInicio: new Date().toLocaleString()
    };

    fetch("http://localhost:8000/crearEjecucion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        if(data.success){
            alert("Ejecución creada correctamente!");
            window.location.href = "EjecucionesPorRobot.html";
        } else {
            alert("Error al crear la ejecución: " + data.error);
        }
    })
    .catch(err => console.error("Error:", err));
});


