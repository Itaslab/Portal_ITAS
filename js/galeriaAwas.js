// galeriaAwas.js

let awasGlobal = [];
let awaPendienteAccion = null;
let usuarioEsAdmin = false;
let esAdminAwas = false;
let idAwaGrillaActual = null;
let grillaHorariaActual = [];

let frecuenciaRPAActual = null;
let frecuenciaRPA2Actual = null;

// ============================
// Helpers
// ============================

function setSelectValue(id, value) {
  const select = document.getElementById(id);
  if (!select) return;

  const normalizedValue = value == null ? "" : String(value).trim().toLowerCase();
  const match = [...select.options].find(opt => String(opt.value).trim().toLowerCase() === normalizedValue)
    || [...select.options].find(opt => String(opt.text).trim().toLowerCase() === normalizedValue);

  select.value = match ? match.value : select.options[0]?.value || "";
}

function formatDate(d) {
  return d ? d.split("T")[0] : "";
}

function getNumber(value) {
  return value === "" ? 0 : Number(value);
}




// ============================
// Permisos usuario
// ============================

async function cargarPermisosUsuario() {
  try {

    const res = await fetch(`${basePath}/permisos`);

    const data = await res.json();

    usuarioEsAdmin = data.esAdmin === true;

  } catch (error) {

    console.error("Error obteniendo permisos:", error);

    // seguridad: si falla, NO admin
    usuarioEsAdmin = false;
  }
}



// ============================
// URL visual
// ============================

function editarUrl() {
  document.getElementById("urlView").classList.add("d-none");
  document.getElementById("urlEdit").classList.remove("d-none");
}

function guardarUrlVisual() {

  const input = document.getElementById("inputUrl");
  const link = document.getElementById("urlLink");

  let url = input.value.trim();

  // Agrega https:// automáticamente
  if (url && !url.startsWith("http")) {
    url = "https://" + url;
    input.value = url;
  }

  link.href = url || "#";
  link.textContent = url || "Sin URL";

  document.getElementById("urlEdit").classList.add("d-none");
  document.getElementById("urlView").classList.remove("d-none");
}

function cancelarEdicionUrl() {
  document.getElementById("urlEdit").classList.add("d-none");
  document.getElementById("urlView").classList.remove("d-none");
}








// ============================
// Cargar tabla
// ============================


async function cargarPermisosAwas() {

  try {

    const res = await fetch(`${basePath}/permisos`);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();

    console.log("PERMISOS AWAS:", data);

    const esSuperAdmin = data.esAdmin === true;

    esAdminAwas =
      esSuperAdmin ||
      (data.permisos || []).some(p =>
        Number(p.ID_Perfil) === 39 &&
        Number(p.ID_Aplicacion) === 14
      );

    console.log("esAdminAwas:", esAdminAwas);

  } catch (err) {

    console.error("Error permisos AWAS:", err);

    esAdminAwas = false;
  }
}




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
          : awa.Estado === "Backlog" || awa.Estado === "Desarrollo" || awa.Estado === "Pendiente"
          ? "text-warning"
          : "text-secondary";

      const row = document.createElement("tr");

    // Determinar si el botón debe estar deshabilitado
      const deshabilitadoPorEstado =["Backlog", "Desarrollo", "Pendiente"].includes(awa.Estado);

    // nueva lógica permisos
      const deshabilitadoPorPermiso = !esAdminAwas;

// si alguna condición se cumple → disabled
      const botonDeshabilitado =deshabilitadoPorEstado || deshabilitadoPorPermiso;
      const disabledAttr = botonDeshabilitado ? "disabled" : "";
      const btnClass = botonDeshabilitado ? "btn-secondary" : (awa.Estado === "Activo" ? "btn-danger" : "btn-success");
      const btnTexto = awa.Estado === "Activo" ? "Desactivar" : "Activar";

row.innerHTML = `
  <td>${awa.ID_WA ?? "-"}</td>
  <td>${awa.ID_AWA ?? "-"}</td>
  <td>${awa.Titulo ?? "-"}</td>
  <td class="${estadoColor} fw-bold">${awa.Estado ?? "-"}</td>

  <td>
    <div class="d-flex justify-content-end flex-wrap gap-2 acciones-awa">

      <button 
        class="btn ${btnClass} btn-sm text-white"
        onclick="activarAWA(${awa.ID})"
        ${disabledAttr}>
        ${btnTexto}
      </button>

      <button 
        class="btn btn-primary btn-sm text-white"
        onclick="configurarAWA(${awa.ID})"
        ${!esAdminAwas  ? "disabled" : ""}>
        Configurar
      </button>

    </div>
  </td>
`;

      tbody.appendChild(row);
    });
    aplicarFiltros();
    
  } catch (error) {
    console.error("Error cargando AWAS:", error);
  }
}




// ============================
// Abrir modal
// ============================

function nuevoAWA() {
  // Limpiar solo los inputs del modal de creación
  document.getElementById("inputIdWaNuevo").value = "";
  document.getElementById("inputTituloNuevo").value = "";
  document.getElementById("inputOrigenNuevo").value = "Ordenes";
  document.getElementById("inputSistemaNuevo").value = "";
  document.getElementById("inputNegocioNuevo").value = "Hogar";
  document.getElementById("inputErrNuevo").value = "";
  document.getElementById("inputJiraNuevo").value = "";
  document.getElementById("inputDetalleNuevo").value = "";
  document.getElementById("inputUrlNuevo").value = "";
  document.getElementById("inputVolumenNuevo").value = "";
  document.getElementById("inputEsfuerzoNuevo").value = "";
  // Nota: inputIdRegistro pertenece al modal de configuración, no se toca aquí

  const modal = new bootstrap.Modal(document.getElementById("modalAwaNuevo"));
  modal.show();
}

function configurarAWA(id) {
  const awa = awasGlobal.find(a => a.ID == id);

  if (!awa) {
    console.error("AWA no encontrada:", id);
    return;
  }

  // 🟦 Identificación
  document.getElementById("inputIdRegistro").value = awa.ID;
  document.getElementById("inputIdAwa").value = awa.ID_AWA;
  document.getElementById("inputIdAwaVisible").value = awa.ID_AWA;
  document.getElementById("inputIdWa").value = awa.ID_WA ?? "";
  document.getElementById("inputTitulo").value = awa.Titulo ?? "";

  // 🟩 Operativo
  document.getElementById("inputSistema").value = awa.Sistema ?? "";
  setSelectValue("inputEstado", awa.Estado);
  setSelectValue("inputOrigen", awa.Origen);
  setSelectValue("inputNegocio", awa.Negocio);
  document.getElementById("inputDetalle").value = awa.Detalle ?? "";
  const url = awa.Url_Wa ?? "";

      document.getElementById("inputUrl").value = url;

      const urlLink = document.getElementById("urlLink");

      urlLink.href = url || "#";
      urlLink.textContent = url || "Sin URL";

// Siempre mostrar vista link al abrir
  document.getElementById("urlView").classList.remove("d-none");
  document.getElementById("urlEdit").classList.add("d-none");
  document.getElementById("inputSistemaAnalisis").value = awa.Sistemas_Analisis ?? "";
  document.getElementById("inputSistemaAccion").value = awa.Sistemas_Accion ?? "";
  document.getElementById("inputErr").value = awa.ERR_AppORD ?? "";
  document.getElementById("inputJira").value = awa.Jira_Tarea ?? "";

  // 🟨 Fechas
  document.getElementById("inputDesde").value = formatDate(awa.Fdesde);
  document.getElementById("inputHasta").value = formatDate(awa.Fhasta);

  // Setear min en inputHasta si hay fecha desde
  const inputDesde = document.getElementById("inputDesde");
  const inputHasta = document.getElementById("inputHasta");
  if (inputDesde.value) {
    inputHasta.min = inputDesde.value;
  }

  // 🟧 RPA
  document.getElementById("inputFlujo").value = awa.Id_Flujo_RPA ?? "";
  document.getElementById("inputPrioridad").value = awa.Prioridad_RPA ?? "";
  document.getElementById("inputMaxCola").value = awa.Max_Encoladas_RPA ?? "";
  document.getElementById("inputFrecuencia").value = awa.FrecuenciaRPA ?? "";
  document.getElementById("inputFrecuencia2").value = awa.FrecuenciaRPA2 ?? "";
  document.getElementById("inputLimiteBajada").value = awa.Limite_Bajada ?? "";

  // 🟪 Métricas
  document.getElementById("inputVolumen").value = awa.Volumen_Diario ?? "";
  document.getElementById("inputEsfuerzo").value = awa.Esfuerzo ?? "";
  document.getElementById("inputHS").value = awa.HS_Antiguedad_Bajada ?? "";
  document.getElementById("inputRev100").value = awa.RevITSS_x100 ?? "";
  document.getElementById("inputRevMax").value = awa.RevITSS_Max ?? "";
  document.getElementById("inputTKTResolutionCategory").value = awa.TKT_Resolution_Category ?? "";
  document.getElementById("inputTKTResolutionCategoryTier2").value = awa.TKT_Resolution_Category_Tier_2 ?? "";

  // 🔥 abrir modal
  const modal = new bootstrap.Modal(document.getElementById("modalAwa"));
  modal.show();
}



// ============================
// Grilla Horaria
// ============================

async function abrirGrillaHoraria() {

  idAwaGrillaActual =
    document.getElementById("inputIdAwa").value;

  const awa = awasGlobal.find(
    x => x.ID_AWA == idAwaGrillaActual
  );

  if (awa) {
    frecuenciaRPAActual = awa.FrecuenciaRPA;
    frecuenciaRPA2Actual = awa.FrecuenciaRPA2;
  }

  console.log("AWA seleccionado:", idAwaGrillaActual);
  console.log("Frecuencia 1:", frecuenciaRPAActual);
console.log("Frecuencia 2:", frecuenciaRPA2Actual);

  await cargarGrillaHoraria(idAwaGrillaActual);
  renderizarGrillaHoraria();

  const modalConfiguracion =
    bootstrap.Modal.getInstance(
      document.getElementById("modalAwa")
    );

  if (modalConfiguracion) {
    modalConfiguracion.hide();
  }

  const modalGrilla = new bootstrap.Modal(
    document.getElementById("modalGrillaHoraria")
  );

  document.getElementById("tituloGrillaAwa").innerText =
    `Configuración horaria AWA ${idAwaGrillaActual}`;

  modalGrilla.show();
}

async function cargarGrillaHoraria(idAwa) {

  try {

    const res = await fetch(
      `${basePath}/api/awas/grilla/${idAwa}`
    );

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    grillaHorariaActual = data;

    console.log("GRILLA:", data);

  } catch (err) {

    console.error(err);

  }

}

function renderizarGrillaHoraria() {

  const dias = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado"
  ];

let html = `
  <div class="alert alert-light border mb-3">

    <strong>Leyenda:</strong>

    <span class="ms-3">
      <span style="color:#f1979e;font-weight:bold;">0</span>
      = No ejecutar
    </span>

    <span class="ms-3">
      <span style="color:#86ddb6;font-weight:bold;">1</span>
      = Cada ${frecuenciaRPAActual} hs
    </span>

    <span class="ms-3">
      <span style="color:#89b7fc;font-weight:bold;">2</span>
      = Cada ${frecuenciaRPA2Actual} hs
    </span>

  </div>

  <div class="table-responsive">
`;

  for (let hora = 0; hora < 24; hora++) {
    html += `<th>${hora}</th>`;
  }

  html += `
          </tr>
        </thead>
        <tbody>
  `;

  for (let dia = 0; dia < 7; dia++) {

    html += `<tr>`;
    html += `<td><strong>${dias[dia]}</strong></td>`;

    for (let hora = 0; hora < 24; hora++) {

      const registro = grillaHorariaActual.find(
        x =>
          x.Dia_Semana === dia &&
          x.Hora_Dia === hora
      );

const frecuencia = registro
  ? registro.Frecuencia
  : "";

let colorFondo = "";

if (frecuencia === 0) {
  colorFondo = "#f1979e"; // rojo suave
}
else if (frecuencia === 1) {
  colorFondo = "#86ddb6"; // verde suave
}
else if (frecuencia === 2) {
  colorFondo = "#89b7fc"; // azul suave
}

html += `
  <td
    style="background-color:${colorFondo};cursor:pointer"
    onclick="cambiarFrecuencia(${registro.Id})">
    ${frecuencia}
  </td>
`;
    }

    html += `</tr>`;
  }

  html += `
        </tbody>
      </table>
    </div>
  `;

  document.getElementById("contenidoGrillaHoraria").innerHTML = html;
}

function cambiarFrecuencia(idRegistro) {

  const registro = grillaHorariaActual.find(
    x => x.Id === idRegistro
  );

  if (!registro) {
    return;
  }

  if (registro.Frecuencia === 0) {
    registro.Frecuencia = 1;
  }
  else if (registro.Frecuencia === 1) {
    registro.Frecuencia = 2;
  }
  else {
    registro.Frecuencia = 0;
  }

  renderizarGrillaHoraria();
}



// ============================
// Guardar
// ============================

async function guardarAWA() {
  try {
    const idRegistro = document.getElementById("inputIdRegistro").value;

const isNew =
  idRegistro === null ||
  idRegistro === undefined ||
  idRegistro === "";
    

    const payload = {
      
        ID: isNew ? null : Number(idRegistro),
        ID_AWA: document.getElementById("inputIdAwa").value || null,

      // Básico
      ID_WA: document.getElementById("inputIdWa").value,
      Titulo: document.getElementById("inputTitulo").value,

      // Operativo
      Estado: document.getElementById("inputEstado").value,
      Origen: document.getElementById("inputOrigen").value,
      Sistema: document.getElementById("inputSistema").value,
      Negocio: document.getElementById("inputNegocio").value,
      Detalle: document.getElementById("inputDetalle").value || null,
      URL: document.getElementById("inputUrl").value.trim() || null,
      Sistemas_Analisis: document.getElementById("inputSistemaAnalisis").value,
      Sistemas_Accion: document.getElementById("inputSistemaAccion").value,
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
      Limite_Bajada: getNumber(document.getElementById("inputLimiteBajada").value),

      // Métricas
      Volumen_Diario: getNumber(document.getElementById("inputVolumen").value),
      Esfuerzo: document.getElementById("inputEsfuerzo").value,
      HS_Antiguedad_Bajada: getNumber(document.getElementById("inputHS").value),
      RevITSS_x100: getNumber(document.getElementById("inputRev100").value),
      RevITSS_Max: getNumber(document.getElementById("inputRevMax").value),
      TKT_Resolution_Category: document.getElementById("inputTKTResolutionCategory").value || null,
      TKT_Resolution_Category_Tier_2: document.getElementById("inputTKTResolutionCategoryTier2").value || null
    };

    const method = isNew ? "POST" : "PUT";
    const res = await fetch(`${basePath}/api/awas`, {
      method: method,
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

    // Mensaje según operación
    if (isNew) {
      mostrarToast("El AWA ha sido creado", "success");
    } else {
      mostrarToast("El AWA ha sido actualizado", "success");
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

async function guardarNuevoAWA() {
  try {
    const payload = {
      ID_AWA: null,
      ID_WA: document.getElementById("inputIdWaNuevo").value,
      Titulo: document.getElementById("inputTituloNuevo").value,
      Estado: "Pendiente",
      Origen: document.getElementById("inputOrigenNuevo").value,
      Sistema: document.getElementById("inputSistemaNuevo").value,
      Negocio: document.getElementById("inputNegocioNuevo").value,
      Detalle: document.getElementById("inputDetalleNuevo").value,
      URL: document.getElementById("inputUrlNuevo").value,
      Sistemas_Analisis: "",
      Sistemas_Accion: "",
      ERR_AppORD: document.getElementById("inputErrNuevo").value,
      Jira_Tarea: document.getElementById("inputJiraNuevo").value,
      Fdesde: null,
      Fhasta: null,
      Id_Flujo_RPA: 0,
      Prioridad_RPA: 0,
      Max_Encoladas_RPA: 0,
      FrecuenciaRPA: 0,
      FrecuenciaRPA2: 0,
      Limite_Bajada: 0,
      Volumen_Diario: getNumber(document.getElementById("inputVolumenNuevo").value),
      Esfuerzo: document.getElementById("inputEsfuerzoNuevo").value,
      HS_Antiguedad_Bajada: 0,
      RevITSS_x100: 0,
      RevITSS_Max: 0
    };

    const res = await fetch(`${basePath}/api/awas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = await res.json();

    if (!res.ok) {
      console.error("Error:", result);
      alert("Error al crear el AWA");
      return;
    }

    mostrarToast("El AWA ha sido creado", "success");
    bootstrap.Modal.getInstance(document.getElementById("modalAwaNuevo")).hide();
    await cargarAWAS();
  } catch (error) {
    console.error("Error guardando nuevo AWA:", error);
    alert("Error inesperado");
  }
}

// ============================
// Activar / Desactivar (placeholder)
// ============================

function activarAWA(id) {
  const awa = awasGlobal.find(a => a.ID == id);
  if (!awa) return;
  if (["Backlog", "Desarrollo", "Pendiente"].includes(awa.Estado)) return;

  awaPendienteAccion = awa;

  const accion = awa.Estado === "Activo" ? "desactivar" : "activar";

  document.getElementById("textoConfirmacion").innerText =
    `¿Seguro que querés ${accion} el AWA "${awa.Titulo}"?`;

  const modal = new bootstrap.Modal(document.getElementById("modalConfirmacion"));
  modal.show();
}

document.getElementById("btnConfirmarAccion").addEventListener("click", async () => {
  if (!awaPendienteAccion) return;

  try {
    const res = await fetch(
      `${basePath}/api/awas/toggle/${awaPendienteAccion.ID}`,
      { method: "PUT" }
    );

    const data = await res.json();

    if (!res.ok) {
      console.error("Error backend:", data);
      mostrarToast("Error al cambiar estado", "danger");
      return;
    }

    // cerrar modal
    bootstrap.Modal.getInstance(document.getElementById("modalConfirmacion")).hide();

    // refrescar tabla
    await cargarAWAS();

    mostrarToast("Estado actualizado correctamente", "success");

  } catch (err) {
    console.error(err);
    mostrarToast("Error de conexión", "danger");
  }

  awaPendienteAccion = null;
});

function mostrarToast(mensaje, tipo = "success") {
  const toastEl = document.getElementById("toastMsg");

  toastEl.className = `toast align-items-center text-white bg-${tipo} border-0`;

  document.getElementById("toastTexto").innerText = mensaje;

  const toast = new bootstrap.Toast(toastEl);
  toast.show();
}

// ============================
// Filtros
// ============================

function aplicarFiltros() {
  const filtroTitulo = document.getElementById("filtroTitulo").value.toLowerCase();
  const filtroEstado = document.getElementById("filtroEstado").value;

  const filas = document.querySelectorAll("#tablaAwas tbody tr");

  filas.forEach(fila => {
    const titulo = fila.children[2].textContent.toLowerCase();
    const estado = fila.children[3].textContent;

    let mostrar = true;

    // Filtrar por título
    if (filtroTitulo && !titulo.includes(filtroTitulo)) {
      mostrar = false;
    }

    // Filtrar por estado
    if (filtroEstado && estado !== filtroEstado) {
      mostrar = false;
    }

    fila.style.display = mostrar ? "" : "none";
  });
}
function inicializarFiltros() {
  document.getElementById("filtroTitulo")
    .addEventListener("input", aplicarFiltros);

  document.getElementById("filtroEstado")
    .addEventListener("change", aplicarFiltros);
}

// ============================
// Init
// ============================

// Agregar validaciones de longitud y fecha
document.getElementById("inputDesde").addEventListener("change", function() {
  const desde = this.value;
  const hastaInput = document.getElementById("inputHasta");
  if (desde) {
    hastaInput.min = desde;
  } else {
    hastaInput.removeAttribute("min");
  }
});

(async () => {

await cargarPermisosAwas();

  await cargarAWAS();

  inicializarFiltros();

})();