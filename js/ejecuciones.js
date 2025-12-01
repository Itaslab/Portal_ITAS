document.addEventListener("DOMContentLoaded", () => {
  const tabla = document.getElementById("tablaEjecuciones");
  const filtroSolicitante = document.getElementById("filtroSolicitante");
  const filtroRegistro = document.getElementById("filtroRegistro");

  let ejecuciones = [];

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

  function llenarFiltroSolicitante() {
    const emails = [...new Set(ejecuciones.map(e => e.usuario))].sort();
    filtroSolicitante.innerHTML = `<option value="">Todos</option>`;
    emails.forEach(email => {
      const op = document.createElement("option");
      op.value = email;
      op.textContent = email;
      filtroSolicitante.appendChild(op);
    });
  }

  function renderTabla() {
    tabla.innerHTML = "";

    const sol = filtroSolicitante.value.toLowerCase();
    const reg = filtroRegistro.value.toLowerCase();

    ejecuciones
      .filter(e =>
        (!sol || e.usuario.toLowerCase().includes(sol)) &&
        (!reg || e.id.toString().toLowerCase().includes(reg) ||
         (e.identificador || "").toLowerCase().includes(reg) ||
         (e.usuario || "").toLowerCase().includes(reg) ||
         (e.flujo || "").toLowerCase().includes(reg))
      )
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
                      <i class="fas fa-hashtag text-primary me-2"></i>
                      <span class="fw-bold text-primary">[${ejec.id}]</span>
                    </div>
                    <div class="mb-2">
                      <i class="fas fa-terminal text-secondary me-2"></i>
                      ${ejec.flujo}
                    </div>
                    <div class="mb-2">
                      <i class="fas fa-id-card text-info me-2"></i>
                      Identificador: <strong>${ejec.identificador || "-"}</strong>
                    </div>
                    <div class="mb-2">
                      <i class="fas fa-envelope text-warning me-2"></i>
                      De: <strong>${ejec.usuario}</strong>
                    </div>
                  </td>

                  <td class="text-start">
                    <div class="mb-2">
                      <i class="fas fa-play text-primary me-2"></i>
                      Inicio: <strong>${formatearFecha(ejec.fechaInicio)}</strong>
                    </div>

                    <div class="mb-2">
                      <i class="fas fa-stop text-danger me-2"></i>
                      Fin: <strong>${formatearFecha(ejec.fechaFin)}</strong>
                    </div>

                    <div>
                      <i class="fas fa-clock text-warning me-2"></i>
                      Duración: <strong>${duracion}</strong>
                    </div>
                  </td>

                  <td class="text-start">
                    <div class="small fw-bold mb-1">
                      <i class="fas fa-flag-checkered text-success me-1"></i>
                      Estado: <span class="text-success">${ejec.estado}</span>
                    </div>

                    <div class="small fw-bold mb-2">
                      <i class="fas fa-clipboard-check text-success me-1"></i>
                      Resultado: <strong>${ejec.resultado || "-"}</strong>
                    </div>
                  </td>

                  <td class="text-start">

                    <div class="d-flex align-items-center mb-2">
                      <i class="fas fa-database icono-accion" onclick="modalTotal(${ejec.id}, ${ejec.total})"></i>
                      <span class="ms-2">Total: ${ejec.total}</span>
                    </div>

                    <div class="d-flex align-items-center mb-2">
                      <i class="fas fa-check-circle icono-accion" onclick="modalOk(${ejec.id}, ${ejec.ok})"></i>
                      <span class="ms-2">OK: ${ejec.ok}</span>
                    </div>

                    <div class="d-flex align-items-center">
                      <i class="fas fa-exclamation-triangle icono-accion" onclick="modalError(${ejec.id}, ${ejec.error})"></i>
                      <span class="ms-2">Error: ${ejec.error}</span>
                    </div>

                  </td>

                  <td class="text-start">
                    <div class="small fw-semibold mb-2">Avance: ${ejec.avance}%</div>

                    <div class="progress mb-2" style="height: 10px;">
                      <div class="progress-bar bg-success" role="progressbar" style="width: ${ejec.avance}%"></div>
                    </div>

                    <div class="d-flex align-items-center">
                      <i class="fas fa-search icono-accion" onclick="modalDetalles(${ejec.id})"></i>
                      <i class="fas fa-sync icono-accion" onclick="modalRefresh(${ejec.id})"></i>
                      <i class="fas fa-arrow-right icono-accion" onclick="modalEstado(${ejec.id})"></i>
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

  filtroSolicitante.addEventListener("change", renderTabla);
  filtroRegistro.addEventListener("input", renderTabla);

  cargarEjecuciones();
  setInterval(cargarEjecuciones, 10000);
});

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

/* --------------------------- MODALES --------------------------- */

function abrirModal(titulo, contenido) {
  document.getElementById("modalInfoTitulo").textContent = titulo;
  document.getElementById("modalInfoContenido").innerHTML = contenido;

  const modal = new bootstrap.Modal(document.getElementById("modalInfo"));
  modal.show();
}

function modalTotal(id, total) {
  abrirModal("Total de registros", `
    <p>La ejecución <strong>${id}</strong> contiene un total de <strong>${total}</strong> registros.</p>
  `);
}

function modalOk(id, ok) {
  abrirModal("Registros OK", `
    <p>La ejecución <strong>${id}</strong> finalizó con <strong>${ok}</strong> registros correctos.</p>
  `);
}

function modalError(id, error) {
  abrirModal("Registros con error", `
    <p>La ejecución <strong>${id}</strong> generó <strong>${error}</strong> registros con error.</p>
  `);
}

function modalDetalles(id) {
  abrirModal("Detalles de la ejecución", `
    <p>Mostrando detalles completos para la ejecución <strong>${id}</strong>.</p>
  `);
}

function modalRefresh(id) {
  abrirModal("Actualizar ejecución", `
    <p>Se solicitaría refrescar o recargar la ejecución <strong>${id}</strong>.</p>
  `);
}

function modalEstado(id) {
  abrirModal("Estado detallado", `
    <p>Mostrando estado detallado de la ejecución <strong>${id}</strong>.</p>
  `);
}

/* --------------------------------------------------------------- */
