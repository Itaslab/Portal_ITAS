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
        fechaFin: item.Fecha_Fin
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
                    <button class="btn btn-sm btn-outline-info mb-2" onclick="verTotal(${ejec.id})">
                      <i class="fas fa-database me-1"></i> Total
                    </button><br>
                    <button class="btn btn-sm btn-outline-success mb-2" onclick="verOk(${ejec.id})">
                      <i class="fas fa-check-circle me-1"></i> OK
                    </button><br>
                    <button class="btn btn-sm btn-outline-danger" onclick="verErrores(${ejec.id})">
                      <i class="fas fa-exclamation-triangle me-1"></i> Error
                    </button>
                  </td>

                  <td class="text-start">
                    <div class="small fw-semibold mb-1">Avance: ${ejec.avance}%</div>
                    <div class="progress mb-2" style="height: 10px;">
                      <div class="progress-bar bg-success" role="progressbar" style="width: ${ejec.avance}%;" aria-valuenow="${ejec.avance}" aria-valuemin="0" aria-valuemax="100"></div>
                    </div>
                    <button class="btn btn-outline-primary btn-sm" onclick="verDetalles(${ejec.id})">
                      <i class="fas fa-eye me-1"></i> Ver detalles
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

// 🔹 Funciones auxiliares de los botones
function verDetalles(id) { alert(`Mostrando detalles para ejecución ID: ${id}`); }
function verTotal(id) { alert(`Total de registros para ejecución ${id}: 2`); }
function verOk(id) { alert(`Registros OK para ejecución ${id}: 2`); }
function verErrores(id) { alert(`Registros con error para ejecución ${id}: 0`); }
function verEstado(id) { alert(`Estado detallado para ejecución ID: ${id}`); }

// 🔹 Botón "Solicitar ejecución"
const btnSolicitar = document.getElementById("btnSolicitar");
btnSolicitar.addEventListener("click", () => {
  window.location.href = "SolicitarEjecucion.html";
});
