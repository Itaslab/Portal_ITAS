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
                    <div class="small fw-bold mb-1">
                      <i class="fas fa-flag-checkered text-success me-1"></i>
                      Estado: <span class="text-success fw-bold">${ejec.estado}</span>
                    </div>
                    <div class="small fw-bold mb-2">
                      <i class="fas fa-clipboard-check text-success me-1"></i>
                      Resultado: <span class="fw-bold">${ejec.resultado || "-"}</span>
                    </div>
                    <button class="btn btn-sm btn-outline-secondary" onclick="verEstado(${ejec.id})">
                      <i class="fas fa-info-circle me-1"></i> Detalles
                    </button>
                  </td>

                 

<td class="text-start">
  <div class="small mb-1">
    <i class="bi bi-eye text-info me-1" data-bs-toggle="tooltip" title="Total: ${ejec.total ?? '-'}"></i>
     <span class="fw-semibold">Total:</span> ${ejec.total ?? '-'}
  </div>
  <div class="small mb-1">
    <i class="bi bi-eye text-success me-1" data-bs-toggle="tooltip" title="Ok: ${ejec.ok ?? '-'}"></i>
    <span class="fw-semibold">Ok:</span> ${ejec.ok ?? '-'}
  </div>
  <div class="small">
    <i class="bi bi-eye text-danger me-1" data-bs-toggle="tooltip" title="Error: ${ejec.error ?? '-'}"></i>
    <span class="fw-semibold">Error:</span> ${ejec.error ?? '-'}
  </div>
</td>



                  <td class="text-start">
                    <div class="small fw-semibold mb-1">Avance: ${ejec.avance}%</div>
                    <div class="progress mb-2" style="height: 10px;">
                      <div class="progress-bar bg-success" role="progressbar" style="width: ${ejec.avance}%;" aria-valuenow="${ejec.avance}" aria-valuemin="0" aria-valuemax="100"></div>
                    </div>
                    <button class="btn btn-outline-primary btn-sm" onclick="verDetalles(${ejec.id})">
                      <i class="bi bi-eye me-1"></i> Ver detalles
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        `;
        tabla.appendChild(row);
      });

    // inicializa tooltips
    const tooltipTriggerList = Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.forEach(el => new bootstrap.Tooltip(el));
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
function verDetalles(id) { mostrarAlerta("info", `Mostrando detalles para ejecución ID: ${id}`); }
function verTotal(id) { mostrarAlerta("primary", `Total de registros para ejecución ${id}: 2`); }
function verOk(id) { mostrarAlerta("success", `Registros OK para ejecución ${id}: 2`); }
function verErrores(id) { mostrarAlerta("danger", `Registros con error para ejecución ${id}: 0`); }
function verEstado(id) { mostrarAlerta("warning", `Estado detallado para ejecución ID: ${id}`); }

// 🔹 Botón "Solicitar ejecución"
const btnSolicitar = document.getElementById("btnSolicitar");
btnSolicitar.addEventListener("click", () => {
  window.location.href = "SolicitarEjecucion.html";
});
