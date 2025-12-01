document.addEventListener("DOMContentLoaded", () => {
  const tabla = document.getElementById("tablaEjecuciones");
  const filtroSolicitante = document.getElementById("filtroSolicitante");
  const filtroRegistro = document.getElementById("filtroRegistro");

  let ejecuciones = [];

  // 🔹 Reiniciar tooltips correctamente
  function reiniciarTooltips() {
    // Eliminar instancias anteriores
    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => {
      const instance = bootstrap.Tooltip.getInstance(el);
      if (instance) instance.dispose();
    });

    // Crear nuevas instancias
    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => {
      new bootstrap.Tooltip(el);
    });
  }

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
          ? (item.id.toString().includes(registro) ||
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
                  <!-- Columna izquierda -->
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
                  </td>

                  <!-- Fechas -->
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

                  <!-- Estado -->
                  <td class="text-start">
                    <div class="small fw-bold mb-1">
                      <i class="fas fa-flag-checkered text-success me-1"></i>
                      Estado: <span class="text-success fw-bold">${ejec.estado}</span>
                    </div>
                    <div class="small fw-bold mb-2">
                      <i class="fas fa-clipboard-check text-success me-1"></i>
                      Resultado: <span class="fw-bold">${ejec.resultado || "-"}</span>
                    </div>
                  </td>

                  <!-- Totales -->
                  <td class="text-start">
                    ${crearFilaTotal("Total", ejec.total)}
                    ${crearFilaTotal("Ok", ejec.ok)}
                    ${crearFilaTotal("Error", ejec.error)}
                  </td>

                  <!-- Avance + botones -->
                  <td class="text-start">
                    <div class="small fw-semibold mb-1">Avance: ${ejec.avance}%</div>
                    <div class="progress mb-2" style="height: 10px;">
                      <div class="progress-bar bg-success" role="progressbar"
                           style="width: ${ejec.avance}%;" aria-valuenow="${ejec.avance}"
                           aria-valuemin="0" aria-valuemax="100"></div>
                    </div>

                    <div class="d-flex flex-wrap gap-2 mt-2">
                      <button class="btn btn-outline-secondary btn-sm" data-bs-toggle="modal" data-bs-target="#modalCerrar"><i class="bi bi-x-circle"></i></button>
                      <button class="btn btn-outline-secondary btn-sm" data-bs-toggle="modal" data-bs-target="#modalBuscar"><i class="bi bi-search"></i></button>
                      <button class="btn btn-outline-secondary btn-sm" data-bs-toggle="modal" data-bs-target="#modalFlecha"><i class="bi bi-arrow-right"></i></button>
                      <button class="btn btn-outline-secondary btn-sm" data-bs-toggle="modal" data-bs-target="#modalCarpeta"><i class="bi bi-folder"></i></button>
                      <button class="btn btn-outline-secondary btn-sm" data-bs-toggle="modal" data-bs-target="#modalRetroceder"><i class="bi bi-arrow-counterclockwise"></i></button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        `;

        tabla.appendChild(row);
      });

    reiniciarTooltips(); // ⬅ SOLUCIÓN REAL ✔
  }

  // 🔹 Helper: filas de totales con modal
  function crearFilaTotal(nombre, valor) {
    return `
      <div class="small mb-1 d-flex align-items-center gap-2">
        <span>
          <span class="fw-semibold">${nombre}:</span> ${valor ?? "-"}
        </span>
        <button
          type="button"
          class="btn btn-outline-secondary btn-sm p-1"
          data-bs-toggle="modal"
          data-bs-target="#detalleItemModal"
          data-title="Detalle de ${nombre}"
          data-body="${nombre}: ${valor ?? '-'}">
          <i class="bi bi-eye"></i>
        </button>
      </div>
    `;
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

  setTimeout(() => {
    alerta.classList.remove("show");
    alerta.classList.add("hide");
    setTimeout(() => alerta.remove(), 300);
  }, 3000);
}

// 🔹 Acciones de botones
function verTotal(id) { mostrarAlerta("primary", `Total de registros para ejecución ${id}: 2`); }
function verOk(id) { mostrarAlerta("success", `Registros OK para ejecución ${id}: 2`); }
function verErrores(id) { mostrarAlerta("danger", `Registros con error para ejecución ${id}: 0`); }
function verEstado(id) { mostrarAlerta("warning", `Estado detallado para ejecución ID: ${id}`); }

const btnSolicitar = document.getElementById("btnSolicitar");
btnSolicitar.addEventListener("click", () => {
  window.location.href = "SolicitarEjecucion.html";
});
