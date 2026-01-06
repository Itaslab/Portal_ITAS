const dropdown = document.getElementById("dropdownFlujos");
const detalle = document.getElementById("detalleFlujo");
const instrucciones = document.getElementById("instruccionesFlujo");
const datosSolicitados = document.getElementById("datosSolicitados");
const identificadorInput = document.getElementById("identificador"); // 👈 renombrado para evitar confusión

let flujos = [];

// Cargar flujos desde backend
fetch(basePath + "/flujos")
  .then(res => res.json())
  .then(data => {
      if (data.success) {
          flujos = data.flujos;
          flujos.forEach(f => {
              const option = document.createElement("option");
              option.value = f.Id_Flujo; 
              option.textContent = f.nombre;
              dropdown.appendChild(option);
          });
      }
  })
  .catch(err => console.error("Error al cargar flujos:", err));

dropdown.addEventListener("change", () => {
    const flujoSeleccionado = flujos.find(f => f.Id_Flujo == dropdown.value);
    if (flujoSeleccionado) {
        detalle.value = flujoSeleccionado.detalle;
        instrucciones.value = flujoSeleccionado.instrucciones;
        datosSolicitados.textContent = flujoSeleccionado.campos;
    } else {
        detalle.value = "";
        instrucciones.value = "";
        datosSolicitados.textContent = "";
    }
});

const btnLimpiar = document.getElementById("btnLimpiar");
const btnEnviar = document.getElementById("btnEnviar");

btnLimpiar.addEventListener("click", () => {
    dropdown.value = "";
    detalle.value = "";
    instrucciones.value = "";
    datosSolicitados.textContent = "";
    inputUsuario.value = "";
    identificadorInput.value = ""; // 👈 limpiar también el identificador
});

btnEnviar.addEventListener("click", () => {
    const flujoSeleccionadoObj = flujos.find(f => f.Id_Flujo == dropdown.value);
    if (!flujoSeleccionadoObj) {
        alert("Debe seleccionar un flujo antes de enviar.");
        return;
    }

    const flujo = parseInt(flujoSeleccionadoObj.Id_Flujo);
    const nombreFlujo = flujoSeleccionadoObj.nombre;
    const prioridad = flujoSeleccionadoObj.prio;
    const datosValor = inputUsuario.value;
    const solicitante = parseInt(localStorage.getItem("idUsuario")) || 0;
    const identificador = identificadorInput.value.trim(); // 👈 toma el valor del input correcto

    if (!identificador) {
        alert("Debe ingresar un identificador para esta ejecución.");
        return;
    }

    const payload = {
        flujoSeleccionado: flujo,
        nombreFlujo,
        datos: datosValor,
        tipoFlujo: flujoSeleccionadoObj.flujoTipo,
        prioridad,
        solicitante,
        identificador, // ✅ correcto ahora
        estado: "En proceso",
        FHInicio: new Date().toLocaleString()
    };

    fetch(basePath + "/crearEjecucion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert("Ejecución creada correctamente!");
            window.location.href = "EjecucionesPorRobot.html";
        } else {
            alert("Error al crear la ejecución: " + data.error);
        }
    })
    .catch(err => console.error("Error:", err));
});
