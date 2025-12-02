document.addEventListener("DOMContentLoaded", () => {
  const tabla = document.getElementById("tablaEjecuciones");
  const filtroSolicitante = document.getElementById("filtroSolicitante");
  const filtroRegistro = document.getElementById("filtroRegistro");

  let ejecuciones = [];

  // Cargar datos
  async function cargarEjecuciones() {
    try {
      const res = await fetch("/ejecuciones");
      const data = await res.json();

      if (!data.success) {
        console.error("Error backend:", data.error);
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
      console.error("Error:", err);
    }
  }

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

                    <!-- LEFT COLUMN INFO -->
                    <div class="mb-2"><i class="fas fa-hashtag text-primary me-2"></i><span class="fw-bold text-primary">[${ejec.id}]</span></div>
                    <div class="mb-2"><i class="fas fa-terminal text-secondary me-2"></i><span class="small">${ejec.flujo}</span></div>
                    <div class="mb-2"><i class="fas fa-id-card text-info me-2"></i><span class="small">Identificador:</span> <span class="fw-semibold">${ejec.identificador || "-"}</span></div>
                    <div class="mb-2"><i class="fas fa-envelope text-warning me-2"></i><span class="small">De:</span> <span class="fw-semibold">${ejec.usuario}</span></div>
                    <div><i class="fas fa-project-diagram text-success me-2"></i><span class="small">Flujo:</span> <span class="fw-semibold">${ejec.flujo}</span><span class="badge bg-secondary ms-2">RPA</span></div>

                  </td>

                  <!-- TIME -->
                  <td class="text-start">
                    <div class="mb-2"><i class="fas fa-play text-primary me-2"></i><span class="small">Inicio:</span> <span class="fw-semibold">${formatearFecha(ejec.fechaInicio)}</span></div>
                    <div class="mb-2"><i class="fas fa-stop text-danger me-2"></i><span class="small">Fin:</span> <span class="fw-semibold">${formatearFecha(ejec.fechaFin)}</span></div>
                    <div><i class="fas fa-clock text-warning me-2"></i><span class="small">Duración:</span> <span class="fw-bold">${duracion}</span></div>
                  </td>

                  <!-- ESTADO -->
                  <td class="text-start">
                    <div class="p-2 border rounded bg-light" style="width: 200px;">
                      <div class="mb-2">
                        <span class="badge bg-${ejec.estado.includes('Error') ? 'danger' : 'success'}">${ejec.estado}</span>
                      </div>
                      <div class="text-truncate small" style="max-width:180px;">Resultado: <span class="fw-bold">${ejec.resultado || '-'}</span></div>
                    </div>
                  </td>

                  <!-- TOTAL / OK / ERROR -->
                  <td class="text-start">

                    <!-- TOTAL -->
                    <div class="small mb-1 d-flex align-items-center justify-content-between border p-2 mb-2" style="width:150px;">
                      <!-- NUEVO BOTON PARA DETALLE -->
                      <button 
                        class="btn btn-outline-secondary btn-sm btn-detalle"
                        data-idtasklist="${ejec.id}"
                        data-tipo="TOTAL"
                      >
                        <i class="bi bi-eye"></i>
                      </button>

                      <span><i class="fas fa-database text-info me-1"></i><span class="fw-semibold">Total:</span> ${ejec.total ?? "-"}</span>
                    </div>

                    <!-- OK -->
                    <div class="small mb-1 d-flex align-items-center justify-content-between border p-2 mb-2" style="width:150px;">

                      <!-- NUEVO BOTON DETALLE -->
                      <button 
                        class="btn btn-outline-secondary btn-sm btn-detalle"
                        data-idtasklist="${ejec.id}"
                        data-tipo="OK"
                      >
                        <i class="bi bi-eye"></i>
                      </button>

                      <span><i class="fas fa-check-circle text-success me-1"></i><span class="fw-semibold">Ok:</span> ${ejec.ok ?? "-"}</span>
                    </div>

                    <!-- ERROR -->
                    <div class="small mb-2 d-flex align-items-center justify-content-between border p-2 mb-2" style="width:150px;">

                      <!-- NUEVO BOTON DETALLE -->
                      <button 
                        class="btn btn-outline-secondary btn-sm btn-detalle"
                        data-idtasklist="${ejec.id}"
                        data-tipo="ERROR"
                      >
                        <i class="bi bi-eye"></i>
                      </button>

                      <span><i class="fas fa-exclamation-triangle text-danger me-1"></i><span class="fw-semibold">Error:</span> ${ejec.error ?? "-"}</span>
                    </div>
                  </td>

                  <!-- AVANCE -->
                  <td class="text-start">
                    <div class="small fw-semibold mb-1">Avance: ${ejec.avance}%</div>
                    <div class="progress mb-2" style="height:10px;"><div class="progress-bar bg-success" style="width:${ejec.avance}%;"></div></div>
                  </td>

                </tr>
              </tbody>
            </table>
          </td>
        `;

        tabla.appendChild(row);
      });

    Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
      .forEach(el => new bootstrap.Tooltip(el));
  }

  function formatearFecha(f) {
    if (!f) return "-";
    const d = new Date(f);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
  }

  function calcularDuracion(i, f) {
    if (!i || !f) return "-";
    const diff = new Date(f) - new Date(i);
    if (diff <= 0) return "-";
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `${mins}'${secs < 10 ? "0" : ""}${secs}"`;
  }

  filtroSolicitante.addEventListener("change", renderTabla);
  filtroRegistro.addEventListener("input", renderTabla);

  cargarEjecuciones();
  setInterval(cargarEjecuciones, 10000);
});

// -------------------------------------------
// NUEVO: BOTÓN OJO → DETALLE DEL BACKEND
// -------------------------------------------
$(document).on("click", ".btn-detalle", async function () {

    const id = $(this).data("idtasklist");

    const res = await fetch(`/api/ejecuciones/detalle/${id}`);
    const data = await res.json();

    if (!data.length) {
        $("#detalleItemModalTitle").text("Sin datos");
        $("#detalleItemModalBody").html("<p>No hay información disponible.</p>");
        return;
    }

    const col1 = data[0].Campos;
    const col2 = data[0].Campos_Accion;
    const col3 = data[0].Campos_Resultado;

    let html = `
      <table class="table table-bordered table-striped">
        <thead>
          <tr>
            <th>${col1}</th>
            <th>${col2}</th>
            <th>${col3}</th>
          </tr>
        </thead>
        <tbody>
    `;

    data.forEach(r => {
      html += `
        <tr>
          <td>${r.Dato}</td>
          <td>${r.Accion}</td>
          <td>${r.Resultado}</td>
        </tr>`;
    });

    html += "</tbody></table>";

    $("#detalleItemModalTitle").text("Detalle de resultados");
    $("#detalleItemModalBody").html(html);

    const modal = new bootstrap.Modal(document.getElementById("detalleItemModal"));
    modal.show();
});
