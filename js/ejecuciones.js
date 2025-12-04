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
                    <div class="small mb-1 d-flex align-items-center gap-1 border p-2 mb-2">
                     
<!-- OJO TOTAL -->
<button type="button"
        class="btn btn-outline-secondary btn-sm btn-detalle"
        data-idtasklist="${ejec.id}"
        data-detalle="total"
        data-bs-toggle="modal"
        data-bs-target="#detalleItemModal"
        title="Ver registros Total">
  <i class="bi bi-eye"></i>
</button>
 
<!-- OJO OK -->
<button type="button"
        class="btn btn-outline-secondary btn-sm btn-detalle"
        data-idtasklist="${ejec.id}"
        data-detalle="ok"
        data-bs-toggle="modal"
        data-bs-target="#detalleItemModal"
        title="Ver registros OK">
  <i class="bi bi-eye"></i>
</button>
 
<!-- OJO ERROR -->
<button type="button"
        class="btn btn-outline-secondary btn-sm btn-detalle"
        data-idtasklist="${ejec.id}"
        data-detalle="error"
        data-bs-toggle="modal"
        data-bs-target="#detalleItemModal"
        title="Ver registros con Error">
  <i class="bi bi-eye"></i>
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
 
                      <!-- Botón con ícono de buscar -->
                      <button class="btn btn-outline-secondary btn-sm" data-bs-toggle="modal" data-bs-target="#modalBuscar">
                        <i class="bi bi-search"></i>
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
function verErrores(id) { mostrarAlerta("danger", `Registros con error para ejecución ${id}: 0`); }
function verEstado(id) { mostrarAlerta("warning", `Estado detallado para ejecución ID: ${id}`); }
 
// 🔹 Botón "Solicitar ejecución"
const btnSolicitar = document.getElementById("btnSolicitar");
btnSolicitar.addEventListener("click", () => {
  window.location.href = "SolicitarEjecucion.html";
});
 
// ------------------------------
// -----------------------------------------------------
// BOTÓN OJO → DETALLE (TOTAL | OK | ERROR) + DESCARGA CSV
// -----------------------------------------------------
$(document).on("click", ".btn-detalle", async function () {

    const id = $(this).data("idtasklist");
    const tipoDetalle = $(this).data("detalle"); // total | ok | error

    // Limpiar backdrop trabado
    $(".modal-backdrop").remove();
    $("body").removeClass("modal-open");

    // Mostrar cargando
    $("#detalleItemModalTitle").text("Cargando...");
    $("#detalleItemModalBody").html(`
        <div class="text-center p-4">
            <div class="spinner-border text-primary"></div>
            <p class="mt-2">Obteniendo datos...</p>
        </div>
    `);

    // Mostrar modal
    const modalEl = document.getElementById("detalleItemModal");
    const modal = bootstrap.Modal.getInstance(modalEl) ?? new bootstrap.Modal(modalEl);
    modal.show();

    try {
        const res = await fetch(`/api/ejecuciones/detalle/${id}`);
        const data = await res.json();

        if (!data || !Array.isArray(data) || data.length === 0) {
            $("#detalleItemModalTitle").text("Sin datos");
            $("#detalleItemModalBody").html("<p>No hay registros para este detalle.</p>");
            return;
        }

        // Normalizar OK
        function normalizarOK(v) {
            if (v === 1 || v === "1" || v === true || v === "true") return 1;
            if (v === 0 || v === "0" || v === false || v === "false") return 0;
            return null;
        }
        data.forEach(r => r.Ok = normalizarOK(r.Ok));

        // Filtrado según botón
        let filtrados = data;
        if (tipoDetalle === "ok") filtrados = data.filter(r => r.Ok === 1);
        if (tipoDetalle === "error") filtrados = data.filter(r => r.Ok === 0 || r.Ok === null);

        const tituloBase =
            tipoDetalle === "ok" ? "Detalle OK" :
            tipoDetalle === "error" ? "Detalle ERROR" :
            "Detalle TOTAL";

        if (filtrados.length === 0) {
            $("#detalleItemModalTitle").text(`${tituloBase} (0)`);
            $("#detalleItemModalBody").html(`<p>No hay registros para mostrar.</p>`);
            return;
        }

        // Encabezados desde backend
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
                </tr>
            `;
        });

        html += "</tbody></table>";

        $("#detalleItemModalTitle").text(`${tituloBase} (${filtrados.length})`);
        $("#detalleItemModalBody").html(html);

        // Botón CSV
        $("#detalleItemModalBody").append(`
            <div class="text-end mt-3">
                <button id="btnDescargarCSV" class="btn btn-outline-primary btn-sm">
                    <i class="bi bi-download"></i> Descargar CSV
                </button>
            </div>
        `);

        // Evento para descargar CSV
        $("#btnDescargarCSV").on("click", function () {

            let csv = "";

            // Si backend manda encabezado ya concatenado
            if (first.CamposEncabezado) {
                csv += first.CamposEncabezado + "\n";
            } else {
                csv += `${col1};${col2};${col3}\n`;
            }

            filtrados.forEach(r => {
                if (r.FilaCompleta) {
                    csv += r.FilaCompleta + "\n";
                } else {
                    csv += `${r.Dato ?? "-"};${r.Accion ?? "-"};${r.Resultado ?? "-"}\n`;
                }
            });

            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `detalle_${tipoDetalle}_${id}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        });

    } catch (err) {
        $("#detalleItemModalTitle").text("Error");
        $("#detalleItemModalBody").html("<p>No se pudo obtener la información.</p>");
        console.error(err);
    }
});
