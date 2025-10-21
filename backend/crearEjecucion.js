const dropdown = document.getElementById("dropdownFlujos");
const detalle = document.getElementById("detalleFlujo");
const instrucciones = document.getElementById("instruccionesFlujo");
const datosSolicitados = document.getElementById("datosSolicitados");
const inputUsuario = document.getElementById("inputUsuario");
const identificadorInput = document.getElementById("identificador");

let flujos = [];

// Cargar flujos desde backend
fetch("/flujos")
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
        datosSolicitados.textContent = flujoSeleccionado.campos || "";
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
    identificadorInput.value = "";
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

    // ✅ Tomar solo el identificador corto del input
    const identificador = identificadorInput.value.trim();
    if (!identificador) {
        alert("Debe ingresar un identificador para la ejecución.");
        return;
    }

    // Limitar a 100 caracteres para que no dé error de truncamiento
    const identificadorLimitado = identificador.substring(0, 100);

    const payload = {
        flujoSeleccionado: flujo,
        nombreFlujo,
        datos: datosValor,
        tipoFlujo: flujoSeleccionadoObj.flujoTipo || "",
        prioridad,
        solicitante,
        identificador: identificadorLimitado,
        estado: "En proceso",
        FHInicio: new Date().toLocaleString()
    };

    fetch("/crearEjecucion", {
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
