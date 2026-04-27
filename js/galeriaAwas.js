// galeriaAwas.js

let awasGlobal = [];

// ============================
// Helpers
// ============================

function setSelectValue(id, value) {
  const select = document.getElementById(id);
  const exists = [...select.options].some(opt => opt.value === value);
  select.value = exists ? value : select.options[0].value;
}

function formatDate(d) {
  return d ? d.split("T")[0] : "";
}

function getNumber(value) {
  return value === "" ? null : Number(value);
}

// ============================
// Cargar tabla
// ============================

async function cargarAWAS() {
  try {
    const res = await fetch(`${basePath}/api/awas`);
    const data = await res.json();

    if (!Array.isArray(data)) {
      console.error("Error backend:", data);
      return;
    }

    awasGlobal = data;

    const tbody = document.querySelector("#tablaAwas tbody");
    tbody.innerHTML = "";

    data.forEach(awa => {
      const estadoColor =
        awa.Estado === "Activo"
          ? "text-success"
          : awa.Estado === "Backlog"
          ? "text-warning"
          : "text-secondary";

      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${awa.ID_WA ?? "-"}</td>
        <td>${awa.ID_AWA ?? "-"}</td>
        <td>${awa.Titulo ?? "-"}</td>
        <td class="${estadoColor} fw-bold">${awa.Estado ?? "-"}</td>
        <td class="text-end">
          ${
            awa.Estado === "Activo"
              ? `<button class="btn btn-danger btn-sm me-2 text-white" onclick="activarAWA(${awa.ID_AWA})">Desactivar</button>`
              : `<button class="btn btn-success btn-sm me-2 text-white" onclick="activarAWA(${awa.ID_AWA})">Activar</button>`
          }
          <button class="btn btn-primary btn-sm text-white" onclick="configurarAWA(${awa.ID_AWA})">
            Configurar
          </button>
        </td>
      `;

      tbody.appendChild(row);
    });

  } catch (error) {
    console.error("Error cargando AWAS:", error);
  }
}

// ============================
// Abrir modal
// ============================

function configurarAWA(id) {
  const awa = awasGlobal.find(a => a.ID_AWA == id);

  if (!awa) {
    console.error("AWA no encontrada:", id);
    return;
  }

  // 🟦 Identificación
  document.getElementById("inputIdAwa").value = awa.ID_AWA;
  document.getElementById("inputIdAwaVisible").value = awa.ID_AWA;
  document.getElementById("inputIdWa").value = awa.ID_WA ?? "";
  document.getElementById("inputTitulo").value = awa.Titulo ?? "";

  // 🟩 Operativo
  document.getElementById("inputSistema").value = awa.Sistema ?? "";
  setSelectValue("inputEstado", awa.Estado);
  setSelectValue("inputOrigen", awa.Origen);
  setSelectValue("inputNegocio", awa.Negocio);
  document.getElementById("inputErr").value = awa.ERR_AppORD ?? "";
  document.getElementById("inputJira").value = awa.Jira_Tarea ?? "";

  // 🟨 Fechas
  document.getElementById("inputDesde").value = formatDate(awa.Fdesde);
  document.getElementById("inputHasta").value = formatDate(awa.Fhasta);

  // 🟧 RPA
  document.getElementById("inputFlujo").value = awa.Id_Flujo_RPA ?? "";
  document.getElementById("inputPrioridad").value = awa.Prioridad_RPA ?? "";
  document.getElementById("inputMaxCola").value = awa.Max_Encoladas_RPA ?? "";
  document.getElementById("inputFrecuencia").value = awa.FrecuenciaRPA ?? "";
  document.getElementById("inputFrecuencia2").value = awa.FrecuenciaRPA2 ?? "";

  // 🟪 Métricas
  document.getElementById("inputVolumen").value = awa.Volumen_Diario ?? "";
  document.getElementById("inputEsfuerzo").value = awa.Esfuerzo ?? "";
  document.getElementById("inputHS").value = awa.HS_Antiguedad_Bajada ?? "";
  document.getElementById("inputRev100").value = awa.RevITSS_x100 ?? "";
  document.getElementById("inputRevMax").value = awa.RevITSS_Max ?? "";

  // 🔥 abrir modal
  const modal = new bootstrap.Modal(document.getElementById("modalAwa"));
  modal.show();
}

// ============================
// Guardar
// ============================

async function guardarAWA() {
  try {
    const payload = {
      ID_AWA: document.getElementById("inputIdAwa").value,

      // Básico
      ID_WA: document.getElementById("inputIdWa").value,
      Titulo: document.getElementById("inputTitulo").value,

      // Operativo
      Estado: document.getElementById("inputEstado").value,
      Origen: document.getElementById("inputOrigen").value,
      Sistema: document.getElementById("inputSistema").value,
      Negocio: document.getElementById("inputNegocio").value,
      ERR_AppORD: document.getElementById("inputErr").value,
      Jira_Tarea: document.getElementById("inputJira").value,

      // Fechas
      Fdesde: document.getElementById("inputDesde").value || null,
      Fhasta: document.getElementById("inputHasta").value || null,

      // RPA
      Id_Flujo_RPA: getNumber(document.getElementById("inputFlujo").value),
      Prioridad_RPA: getNumber(document.getElementById("inputPrioridad").value),
      Max_Encoladas_RPA: getNumber(document.getElementById("inputMaxCola").value),
      FrecuenciaRPA: getNumber(document.getElementById("inputFrecuencia").value),
      FrecuenciaRPA2: getNumber(document.getElementById("inputFrecuencia2").value),

      // Métricas
      Volumen_Diario: getNumber(document.getElementById("inputVolumen").value),
      Esfuerzo: document.getElementById("inputEsfuerzo").value,
      HS_Antiguedad_Bajada: getNumber(document.getElementById("inputHS").value),
      RevITSS_x100: getNumber(document.getElementById("inputRev100").value),
      RevITSS_Max: getNumber(document.getElementById("inputRevMax").value)
    };

    const res = await fetch(`${basePath}/api/awas`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = await res.json();

    if (!res.ok) {
      console.error("Error:", result);
      alert("Error al guardar");
      return;
    }

    // cerrar modal
    bootstrap.Modal.getInstance(document.getElementById("modalAwa")).hide();

    // recargar tabla
    await cargarAWAS();

  } catch (error) {
    console.error("Error guardando AWA:", error);
    alert("Error inesperado");
  }
}

// ============================
// Activar / Desactivar (placeholder)
// ============================

function activarAWA(id) {
  alert("Después hacemos activar/desactivar 😄");
}

// ============================
// Init
// ============================

cargarAWAS();