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
        total: item.Reg_Totales ?? 0,
        ok: item.Reg_Proc_OK ?? 0,
        error: item.Reg_Proc_NOK ?? 0
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

  // 🔹 Inicializar tooltips (seguro)
  function inicializarTooltips() {
    // 1) destruir instancias previas
    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => {
      const inst = bootstrap.Tooltip.getInstance(el);
      if (inst) inst.dispose();
    });
    // 2) eliminar restos en DOM (defensivo)
    document.querySelectorAll('.tooltip').forEach(el => el.remove());
    // 3) crear nuevas instancias
    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => {
      new bootstrap.Tooltip(el, {
        container: 'body',
        trigger: 'hover focus',
        placement: 'top'
      });
    });
  }

  // 🔹 Renderizar tabla con filtros
  function renderTabla() {
    const solicitante = filtroSolicitante.value.toLowerCase();
    const registro = filtroRegistro.value.toLowerCase();

    tabla.innerHTML = "";

    ejecuciones
      .filter(item => {
        const coincideSolicitante = solicitante ? (item.usuario || "").toLowerCase().includes(solicitante) : true;
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

        // NOTE: usamos data-bs-title para que bootstrap administre el tooltip internamente
        row.innerHTML = `
          <td colspan="6">
            <table class="table table-bordered align-middle mb-0">
              <tbody>
                <tr>
                  <td class="text-start">
                    <div class="mb-2">
                      <i class="fas fa-hashtag text-primary me-2" data-bs-toggle="tooltip" data-bs-title="ID de ejecución"></i>
                      <span class="fw-bold text-primary">[${ejec.id}]</span>
                    </div>
                    <div class="mb-2">
                      <i class="fas fa-terminal text-secondary me-2" data-bs-toggle="tooltip" data-bs-title="Nombre del proceso"></i>
                      <span class="small">${escapeHtml(ejec.flujo)}</span>
                    </div>
                    <div class="mb-2">
                      <i class="fas fa-id-card text-info me-2" data-bs-toggle="tooltip" data-bs-title="Identificador interno"></i>
                      <span class="small">Identificador:</span>
                      <span class="fw-semibold">${escapeHtml(ejec.identificador || "-")}</span>
                    </div>
                    <div class="mb-2">
                      <i class="fas fa-envelope text-warning me-2" data-bs-toggle="tooltip" data-bs-title="Usuario solicitante"></i>
                      <span class="small">De:</span>
                      <span class="fw-semibold">${escapeHtml(ejec.usuario || "-")}</span>
                    </div>
                    <div>
                      <i class="fas fa-project-diagram text-success me-2" data-bs-toggle="tooltip" data-bs-title="Flujo de ejecución"></i>
                      <span class="small">Flujo:</span>
                      <span class="fw-semibold">${escapeHtml(ejec.flujo)}</span>
                      <span class="badge bg-secondary ms-2">RPA</span>
                    </div>
                  </td>

                  <td class="text-start">
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
                    <div>
                      <i class="fas fa-clock text-warning me-2"></i>
                      <span class="small">Duración:</span>
                      <span class="fw-bold text-dark">${duracion}</span>
                    </div>
                  </td>

                  <td class="text-start">
                    <div class="p-2 border rounded bg-light" style="width: 200px;">
                      <div class="mb-2">
                        <span class="badge bg-${(ejec.estado || "").includes('Error') ? 'danger' : 'success'}">
                          ${escapeHtml(ejec.estado || "")}
                        </span>
                      </div>
                      <div class="text-truncate small" style="max-width: 180px;" data-bs-toggle="tooltip" data-bs-title="${escapeHtml(ejec.resultado || '-')}">
                        Resultado: <span class="fw-bold">${escapeHtml(ejec.resultado || '-')}</span>
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
        data-bs-toggle="tooltip"
        data-bs-title="Total (${ejec.total})"
        data-bs-target="#detalleItemModal">
  <i class="bi bi-eye"></i> <span class="ms-1">${ejec.total}</span>
</button>

<!-- OJO OK -->
<button type="button"
        class="btn btn-outline-success btn-sm btn-detalle"
        data-idtasklist="${ejec.id}"
        data-detalle="ok"
        data-bs-toggle="tooltip"
        data-bs-title="OK (${ejec.ok})"
        data-bs-target="#detalleItemModal">
  <i class="bi bi-eye"></i> <span class="ms-1">${ejec.ok}</span>
</button>

<!-- OJO ERROR -->
<button type="button"
        class="btn btn-outline-danger btn-sm btn-detalle"
        data-idtasklist="${ejec.id}"
        data-detalle="error"
        data-bs-toggle="tooltip"
        data-bs-title="Error (${ejec.error})"
        data-bs-target="#detalleItemModal">
  <i class="bi bi-eye"></i> <span class="ms-1">${ejec.error}</span>
</button>

                    </div>
                  </td>

                  <td class="text-start">
                    <div class="small fw-semibold mb-1">Avance: ${ejec.avance}%</div>
                    <div class="progress mb-2" style="height: 10px;">
                      <div class="progress-bar bg-success" role="progressbar" style="width: ${ejec.avance}%" aria-valuenow="${ejec.avance}" aria-valuemin="0" aria-valuemax="100"></div>
                    </div>

                    <div class="d-flex flex-wrap gap-2 mt-2">
                      <!-- Botones adicionales -->
                      <button class="btn btn-outline-secondary btn-sm" data-bs-toggle="modal" data-bs-target="#modalCerrar">
                        <i class="bi bi-x-circle"></i>
                      </button>
                      <button class="btn btn-outline-secondary btn-sm" data-bs-toggle="modal" data-bs-target="#modalBuscar">
                        <i class="bi bi-search"></i>
                      </button>
                      <button class="btn btn-outline-secondary btn-sm" data-bs-toggle="modal" data-bs-target="#modalFlecha">
                        <i class="bi bi-arrow-right"></i>
                      </button>
                      <button class="btn btn-outline-secondary btn-sm" data-bs-toggle="modal" data-bs-target="#modalCarpeta">
                        <i class="bi bi-folder"></i>
                      </button>
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

    // Inicializar tooltips solo para los elementos creados en esta renderización
    inicializarTooltips();
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

  // escape básico para evitar que contenido en strings rompa el HTML
  function escapeHtml(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
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
    <div>${escapeHtml(mensaje)}</div>
  `;

  alertContainer.appendChild(alerta);

  // Desaparece después de 3 segundos
  setTimeout(() => {
    alerta.classList.remove("show");
    alerta.classList.add("hide");
    setTimeout(() => alerta.remove(), 300);
  }, 3000);
}

// 🔹 Botón "Solicitar ejecución"
const btnSolicitar = document.getElementById("btnSolicitar");
if (btnSolicitar) {
  btnSolicitar.addEventListener("click", () => {
    window.location.href = "SolicitarEjecucion.html";
  });
}

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

    // --- Filtrado según tipoDetalle (OK / ERROR / TOTAL) ---
    let filtrados = data;

    if (tipoDetalle === "ok") {
      // r.Ok viene como 0 o 1
      filtrados = data.filter(r => r.Ok === 1);
    } else if (tipoDetalle === "error") {
      // explícito: 0 (o null si existiera)
      filtrados = data.filter(r => r.Ok === 0 || r.Ok === null || r.Ok === undefined);
    }
    // total => no filtra

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
            <th>${escapeHtml(col1)}</th>
            <th>${escapeHtml(col2)}</th>
            <th>${escapeHtml(col3)}</th>
          </tr>
        </thead>
        <tbody>
    `;

    filtrados.forEach(r => {
      html += `
        <tr class="${r.Ok === 1 ? "table-success" : "table-danger"}">
          <td>${escapeHtml(r.Dato ?? "-")}</td>
          <td>${escapeHtml(r.Accion ?? "-")}</td>
          <td>${escapeHtml(r.Resultado ?? "-")}</td>
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
    $("#btnDescargarCSV").off("click").on("click", function () {
      let csv = "";
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
