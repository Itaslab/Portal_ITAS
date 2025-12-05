document.addEventListener("DOMContentLoaded", () => {
  const tabla = document.getElementById("tablaEjecuciones");
  const filtroSolicitante = document.getElementById("filtroSolicitante");
  const filtroRegistro = document.getElementById("filtroRegistro");
 
  let ejecuciones = [];
 
  // 🔹 Cargar datos desde backend
  async function cargarEjecuciones() {
    try {
      const res = await fetch("/ejecuciones");
      const data = await res.json();
 
      if (!data.success) {
        console.error("Error en backend:", data.error);
        return;
      }
 
      ejecuciones = data.data.map(item => ({
        id: item.Id_Tasklist,
        flujo: item.Titulo_Tasklist,
        identificador: item.Identificador,
        usuario: item.Email,
        estado: item.Estado,
        avance: item.Avance,
        resultado: item.Resultado,
        fechaInicio: item.Fecha_Inicio,
        fechaFin: item.Fecha_Fin,
        total: item.Reg_Totales,
        ok: item.Reg_Proc_OK,
        error: item.Reg_Proc_NOK
      }));
 
      llenarFiltroSolicitante();
      renderTabla();
    } catch (err) {
      console.error("Error al obtener ejecuciones:", err);
    }
  }
 
  // 🔹 Llenar select de solicitantes dinámicamente
  function llenarFiltroSolicitante() {
    const emailsUnicos = [...new Set(ejecuciones.map(e => e.usuario))].sort();
    filtroSolicitante.innerHTML = `<option value="">Todos</option>`;
    emailsUnicos.forEach(email => {
      const option = document.createElement("option");
      option.value = email;
      option.textContent = email;
      filtroSolicitante.appendChild(option);
    });
  }
 
  // 🔹 Renderizar tabla con filtros
  function renderTabla() {
    const solicitante = filtroSolicitante.value.toLowerCase();
    const registro = filtroRegistro.value.toLowerCase();
 
    tabla.innerHTML = "";
 
    ejecuciones
      .filter(item => {
        const coincideSolicitante = solicitante ? item.usuario.toLowerCase().includes(solicitante) : true;
        const coincideRegistro = registro
          ? (item.id.toString().toLowerCase().includes(registro) ||
             (item.identificador || "").toLowerCase().includes(registro) ||
             (item.usuario || "").toLowerCase().includes(registro) ||
             (item.flujo || "").toLowerCase().includes(registro))
          : true;
        return coincideSolicitante && coincideRegistro;
      })
      .forEach(ejec => {
        const duracion = calcularDuracion(ejec.fechaInicio, ejec.fechaFin);
        const row = document.createElement("tr");
 
        row.innerHTML = `
          <td colspan="6">
            <table class="table table-bordered align-middle mb-0">
              <tbody>
                <tr>
                  <td class="text-start">
                    <div class="mb-2">
                      <i class="fas fa-hashtag text-primary me-2" data-bs-toggle="tooltip" title="ID de ejecución"></i>
                      <span class="fw-bold text-primary">[${ejec.id}]</span>
                    </div>
                    <div class="mb-2">
                      <i class="fas fa-terminal text-secondary me-2" data-bs-toggle="tooltip" title="Nombre del proceso"></i>
                      <span class="small">${ejec.flujo}</span>
                    </div>
                    <div class="mb-2">
                      <i class="fas fa-id-card text-info me-2" data-bs-toggle="tooltip" title="Identificador interno"></i>
                      <span class="small">Identificador:</span>
                      <span class="fw-semibold">${ejec.identificador || "-"}</span>
                    </div>
                    <div class="mb-2">
                      <i class="fas fa-envelope text-warning me-2" data-bs-toggle="tooltip" title="Usuario solicitante"></i>
                      <span class="small">De:</span>
                      <span class="fw-semibold">${ejec.usuario}</span>
                    </div>
                    <div>
                      <i class="fas fa-project-diagram text-success me-2" data-bs-toggle="tooltip" title="Flujo de ejecución"></i>
                      <span class="small">Flujo:</span>
                      <span class="fw-semibold">${ejec.flujo}</span>
                      <span class="badge bg-secondary ms-2">RPA</span>
                    </div>
                  </td>
 
                 
<td class="text-start">
  <div class="p-3 border rounded bg-light" style="width: 280px;">
    <!-- Estado -->
    <div class="mb-3 text-center">
      <span class="badge bg-${ejec.estado.includes('Error') ? 'danger' : 'success'} px-3 py-2">
        ${ejec.estado}
      </span>
    </div>
 
    <!-- Fechas y duración -->
    <div class="mb-2">
      <i class="fas fa-play text-primary me-2"></i>
      <span class="small">Inicio:</span>
      <span class="fw-semibold">${formatearFecha(ejec.fechaInicio)}</span>
    </div>
    <div class="mb-2">
      <i class="fas fa-stop text-danger me-2"></i>
      <span class="small">Fin:</span>
      <span class="fw-semibold">${formatearFecha(ejec.fechaFin)}</span>
    </div>
    <div class="mb-3">
      <i class="fas fa-clock text-warning me-2"></i>
      <span class="small">Duración:</span>
      <span class="fw-bold text-dark">${duracion}</span>
    </div>
 
    <!-- Resultado -->
    <div class="text-truncate small" style="max-width: 240px;" title="${ejec.resultado || '-'}">
      Resultado: <span class="fw-bold">${ejec.resultado || '-'}</span>
    </div>
  </div>
</td>
 

<td class="text-start">
  <div class="d-flex flex-column gap-2 border rounded p-2 bg-light">
    
    <!-- Total -->
    <button type="button"
            class="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2 btn-detalle"
            data-idtasklist="${ejec.id}"
            data-detalle="total"
            data-bs-toggle="modal"
            data-bs-target="#detalleItemModal"
            title="Ver registros Total">
      <i class="bi bi-eye text-primary"></i>
      <span class="text-primary fw-semibold">Total:</span>
      <span class="text-primary fw-bold">${ejec.total ?? 0}</span>
    </button>

    <!-- OK -->
    <button type="button"
            class="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2 btn-detalle"
            data-idtasklist="${ejec.id}"
            data-detalle="ok"
            data-bs-toggle="modal"
            data-bs-target="#detalleItemModal"
            title="Ver registros OK">
      <i class="bi bi-eye text-success"></i>
      <span class="text-success fw-semibold">OK:</span>
      <span class="text-success fw-bold">${ejec.ok ?? 0}</span>
    </button>

    <!-- Error -->
    <button type="button"
            class="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2 btn-detalle"
            data-idtasklist="${ejec.id}"
            data-detalle="error"
            data-bs-toggle="modal"
            data-bs-target="#detalleItemModal"
            title="Ver registros con Error">
      <i class="bi bi-eye text-danger"></i>
      <span class="text-danger fw-semibold">Error:</span>
      <span class="text-danger fw-bold">${ejec.error ?? 0}</span>
    </button>

    <!-- Buscar -->
    <button class="btn btn-outline-secondary btn-sm btn-log"
            data-idtasklist="${ejec.id}"
            data-bs-toggle="modal"
            data-bs-target="#modalBuscar"
            title="Buscar en log">
      <i class="bi bi-search"></i>
    </button>
  </div>
</td>

 
                  <td class="text-start">
                    <div class="small fw-semibold mb-1">Avance: ${ejec.avance}%</div>
                    <div class="progress mb-2" style="height: 10px;">
                      <div class="progress-bar bg-success" role="progressbar" style="width: ${ejec.avance}%;" aria-valuenow="${ejec.avance}" aria-valuemin="0" aria-valuemax="100"></div>
                    </div>
 
                    <div class="d-flex flex-wrap gap-2 mt-2">
                      <!-- Botón con ícono de cruz -->
                      <button class="btn btn-outline-secondary btn-sm" data-bs-toggle="modal" data-bs-target="#modalCerrar">
                        <i class="bi bi-x-circle"></i>
                      </button>

 
                     
 
                      <!-- Botón con ícono de flecha -->
                      <button class="btn btn-outline-secondary btn-sm" data-bs-toggle="modal" data-bs-target="#modalFlecha">
                        <i class="bi bi-arrow-right"></i>
                      </button>
 
                      <!-- Botón con ícono de carpeta -->
                      <button class="btn btn-outline-secondary btn-sm" data-bs-toggle="modal" data-bs-target="#modalCarpeta">
                        <i class="bi bi-folder"></i>
                      </button>
 
                      <!-- Botón con ícono de retroceder -->
                      <button class="btn btn-outline-secondary btn-sm" data-bs-toggle="modal" data-bs-target="#modalRetroceder">
                        <i class="bi bi-arrow-counterclockwise"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        `;
        tabla.appendChild(row);
      });
 
   
 
  }
 
  function formatearFecha(fecha) {
    if (!fecha) return "-";
    const d = new Date(fecha);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
  }
 
  function calcularDuracion(inicio, fin) {
    if (!inicio || !fin) return "-";
    const diff = new Date(fin) - new Date(inicio);
    if (diff <= 0) return "-";
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `${mins}'${secs < 10 ? "0" : ""}${secs}"`;
  }
 
  // 🔹 Eventos filtros
  filtroSolicitante.addEventListener("change", renderTabla);
  filtroRegistro.addEventListener("input", renderTabla);
 
  cargarEjecuciones();
  setInterval(cargarEjecuciones, 10000);
});
 
// 🔹 Función de alertas Bootstrap
function mostrarAlerta(tipo, mensaje) {
  const alertContainer = document.getElementById("alertContainer");
 
  const iconos = {
    success: "check-circle-fill",
    info: "info-fill",
    warning: "exclamation-triangle-fill",
    danger: "exclamation-triangle-fill",
    primary: "info-fill"
  };
 
  const alerta = document.createElement("div");
  alerta.className = `alert alert-${tipo} d-flex align-items-center shadow fade show`;
  alerta.setAttribute("role", "alert");
  alerta.innerHTML = `
    <svg class="bi flex-shrink-0 me-2" width="24" height="24" role="img">
      <use xlink:href="#${iconos[tipo]}"/>
    </svg>
    <div>${mensaje}</div>
  `;
 
  alertContainer.appendChild(alerta);
 
  // Desaparece después de 3 segundos
  setTimeout(() => {
    alerta.classList.remove("show");
    alerta.classList.add("hide");
    setTimeout(() => alerta.remove(), 300);
  }, 3000);
}
 
// 🔹 Funciones auxiliares de los botones usando Bootstrap alerts
function verTotal(id) { mostrarAlerta("primary", `Total de registros para ejecución ${id}: 2`); }
function verOk(id) { mostrarAlerta("success", `Registros OK para ejecución ${id}: 2`); }
function error(id) { mostrarAlerta("danger", `Registros con error para ejecución ${id}: 0`); }
function verEstado(id) { mostrarAlerta("warning", `Estado detallado para ejecución ID: ${id}`); }
 
// 🔹 Botón "Solicitar ejecución"
const btnSolicitar = document.getElementById("btnSolicitar");
btnSolicitar.addEventListener("click", () => {
  window.location.href = "SolicitarEjecucion.html";
});
 
// ------------------------------
// BOTÓN OJO → DETALLE (TOTAL/OK/ERROR) + DESCARGA CSV
// ------------------------------
$(document).on("click", ".btn-detalle", async function () {
  const id = $(this).data("idtasklist");
  const tipoDetalle = $(this).data("detalle"); // "total" | "ok" | "error"
 
  // Limpiar cualquier backdrop residual
  $(".modal-backdrop").remove();
  $("body").removeClass("modal-open");
 
  // Mostrar cargando
  $("#detalleItemModalTitle").text("Cargando...");
  $("#detalleItemModalBody").html(`
    <div class="text-center p-4">
      <div class="spinner-border text-primary" role="status"></div>
      <p class="mt-2">Obteniendo datos...</p>
    </div>
  `);
 
  // Mostrar modal (reutilizando instancia)
  const modalEl = document.getElementById("detalleItemModal");
  const modal = bootstrap.Modal.getInstance(modalEl) ?? new bootstrap.Modal(modalEl);
  modal.show();
 
  // Pedido al backend
  try {
    const res = await fetch(`/api/ejecuciones/detalle/${id}`);
    const data = await res.json();
 
    if (!data || !Array.isArray(data) || data.length === 0) {
      $("#detalleItemModalTitle").text("Sin datos");
      $("#detalleItemModalBody").html("<p>No hay información disponible para este registro.</p>");
      return;
    }
 
    // --- Filtrado según el tipo de detalle ---
    // Ajustá estas condiciones a tu esquema real de datos.
    let filtrados = data;
    if (tipoDetalle === "ok") {
      // Ejemplos de match: "OK", "Ok", "ok", "proceso ok"
      filtrados = data.filter(r => (r.Resultado ?? "").toLowerCase().includes("ok"));
    } else if (tipoDetalle === "error") {
      // Ejemplos de match: "ERROR", "error", "NOK"
      const val = (s) => (s ?? "").toLowerCase();
      filtrados = data.filter(r => {
        const res = val(r.Resultado);
        return res.includes("error") || res.includes("nok");
      });
    }
    // Si es "total", no se cambia nada.
 
    // Si no hay registros bajo ese filtro, lo indicamos
    const tituloBase =
      tipoDetalle === "ok" ? "Detalle OK" :
      tipoDetalle === "error" ? "Detalle ERROR" :
      "Detalle TOTAL";
 
    if (!filtrados.length) {
      $("#detalleItemModalTitle").text(`${tituloBase} (0)`);
      $("#detalleItemModalBody").html("<p>No hay registros para este filtro.</p>");
      return;
    }
 
    // Encabezados (provenientes del primer registro)
    const first = filtrados[0];
    const col1 = first.Campos ?? "Columna 1";
    const col2 = first.Campos_Accion ?? "Columna 2";
    const col3 = first.Campos_Resultado ?? "Columna 3";
 
    // Render tabla
    let html = `
      <table class="table table-bordered table-striped">
        <thead class="table-dark">
          <tr>
            <th>${col1}</th>
            <th>${col2}</th>
            <th>${col3}</th>
          </tr>
        </thead>
        <tbody>
    `;
 
    filtrados.forEach(r => {
      html += `
        <tr>
          <td>${r.Dato ?? "-"}</td>
          <td>${r.Accion ?? "-"}</td>
          <td>${r.Resultado ?? "-"}</td>
        </tr>`;
    });
 
    html += `</tbody></table>`;
 
    $("#detalleItemModalTitle").text(`${tituloBase} (${filtrados.length})`);
    $("#detalleItemModalBody").html(html);
 
    // --------------------------
    // Botón para descargar CSV
    // --------------------------
    $("#detalleItemModalBody").append(`
      <div class="text-end mt-3">
        <button id="btnDescargarCSV" class="btn btn-outline-primary btn-sm">
          <i class="bi bi-download"></i> Descargar CSV
        </button>
      </div>
    `);
 
   
// Evento descarga CSV
$("#btnDescargarCSV").on("click", function () {
  // Si el backend ya trae los encabezados y datos con ';', los usamos tal cual
  const encabezados = [col1, col2, col3]; // O si tu backend trae un string con todos los nombres, usalo directamente
  // Pero en tu caso, parece que cada registro ya tiene los datos concatenados con ';'
  // Entonces armamos el CSV sin modificar el separador
 
  let csv = "";
  // Si el backend trae los nombres en un solo string (como en tu imagen), usalo:
  // Ejemplo: "CARGNUSE;CARGCONC;CARGCODO;CARGCUCO;CARGSIGN;CARGVALO"
  if (first.CamposEncabezado) {
    csv += first.CamposEncabezado + "\n";
  } else {
    // Si no, usamos los 3 campos como antes
    csv += `${col1};${col2};${col3}\n`;
  }
 
  filtrados.forEach(r => {
    // Si el backend ya trae la fila lista (ej: "61689135;9207;43362515;2006377963;CR;1178.72")
    if (r.FilaCompleta) {
      csv += r.FilaCompleta + "\n";
    } else {
      // Si no, concatenamos los campos manualmente
      csv += `${r.Dato ?? "-"};${r.Accion ?? "-"};${r.Resultado ?? "-"}\n`;
    }
  });
 
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `detalle_${tipoDetalle}_${id}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
});
 
  } catch (err) {
    $("#detalleItemModalTitle").text("Error");
    $("#detalleItemModalBody").html("<p>No se pudo obtener la información.</p>");
    console.error(err);
  }
});
 
 
// ejecuciones.js
 
// Delegación: al click del botón .btn-log abrimos modal y pedimos el log
$(document).on("click", ".btn-log", async function () {
  const idTasklist = $(this).data("idtasklist");
 
  // Estado inicial del modal
  $("#modalBuscarLabel").text(`Log de orquestación (ID ${idTasklist})`);
  $("#modalBuscarBody").html(`
    <div class="text-center p-4">
      <div class="spinner-border text-primary" role="status"></div>
      <p class="mt-2">Cargando log...</p>
    </div>
  `);
 
  try {
    // Llamada al backend nuevo
    const res = await fetch(`/api/logs/${idTasklist}`);
    const json = await res.json();
 
    if (!json.success || !Array.isArray(json.data) || json.data.length === 0) {
      $("#modalBuscarBody").html(`
        <div class="alert alert-warning" role="alert">
          No hay entradas de log para este Id_Tasklist.
        </div>
      `);
      return;
    }
 
    // Render: tabla simple con Fecha_Hora y Detalle
    const rows = json.data
      .map(
        (r) => `
        <tr>
          <td class="text-nowrap">${formatearFecha(r.Fecha_Hora)}</td>
          <td>${escapeHtml(r.Detalle ?? "-")}</td>
        </tr>
      `
      )
      .join("");
 
    const tableHtml = `
      <table class="table table-sm table-striped table-bordered align-middle">
        <thead class="table-light">
          <tr>
            <th style="width:200px">Fecha y hora</th>
            <th>Detalle</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;
 
    $("#modalBuscarBody").html(tableHtml);
 
    // Botón Descargar CSV del modal
    $("#btnDescargarLogCSV").off("click").on("click", () => {
      const encabezado = "Fecha_Hora;Detalle\n";
      const cuerpo = json.data
        .map((r) => `${toCsvDate(r.Fecha_Hora)};${toCsvField(r.Detalle)}`)
        .join("\n");
      const csv = encabezado + cuerpo;
      descargarCSV(csv, `log_${idTasklist}.csv`);
    });
  } catch (err) {
    console.error("Error cargando logs:", err);
    $("#modalBuscarBody").html(`
      <div class="alert alert-danger" role="alert">
        No se pudo obtener el log. Intente nuevamente.
      </div>
    `);
  }
});
 
// Utilidades (colocalas cerca de tus helpers existentes)
function formatearFecha(fecha) {
  if (!fecha) return "-";
  const d = new Date(fecha);
  // tu función ya existe con este estilo en ejecuciones.js
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
}
 
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
 
function toCsvField(str) {
  // Escapar comillas y envolver en comillas por si hay ';' o saltos de línea
  const s = (str ?? "-").toString().replace(/"/g, '""');
  return `"${s}"`;
}
 
function toCsvDate(d) {
  const date = new Date(d);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}
 
function descargarCSV(csv, nombre) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}