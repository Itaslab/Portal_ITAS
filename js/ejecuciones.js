document.addEventListener("DOMContentLoaded", () => {

  // 🔹 Referencias DOM
  const tabla = document.getElementById("tablaEjecuciones");
  const filtroSolicitante = document.getElementById("filtroSolicitante");
  const filtroRegistro = document.getElementById("filtroRegistro");

  const spanTotal = document.getElementById("cantTotal");
  const spanOk = document.getElementById("cantOk");
  const spanError = document.getElementById("cantError");

  const btnTotal = document.getElementById("btnTotal");
  const btnOk = document.getElementById("btnOk");
  const btnError = document.getElementById("btnError");
  const btnSolicitar = document.getElementById("btnSolicitar");

  let ejecuciones = [];

  // -------------------------------
  // 🔹 FUNCIONES AUXILIARES
  // -------------------------------

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

  function escapeHtml(str) {
    return String(str ?? "-")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function toCsvField(str) {
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

  function mostrarAlerta(tipo, mensaje) {
    const alertContainer = document.getElementById("alertContainer");
    if (!alertContainer) return;

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

  function actualizarContadores() {
    const totalSum = ejecuciones.reduce((acc, e) => acc + (e.total || 0), 0);
    const okSum = ejecuciones.reduce((acc, e) => acc + (e.ok || 0), 0);
    const errorSum = ejecuciones.reduce((acc, e) => acc + (e.error || 0), 0);

    spanTotal.innerText = totalSum;
    spanOk.innerText = okSum;
    spanError.innerText = errorSum;

    actualizarEstadoBotones();
  }

  function actualizarEstadoBotones() {
    const total = parseInt(spanTotal.textContent) || 0;
    const ok = parseInt(spanOk.textContent) || 0;
    const error = parseInt(spanError.textContent) || 0;

    if (btnTotal) btnTotal.disabled = total === 0;
    if (btnOk) btnOk.disabled = ok === 0;
    if (btnError) btnError.disabled = error === 0;
  }

  function normalizarOK(v) {
    if (v === 1 || v === "1" || v === true || v === "true") return 1;
    if (v === 0 || v === "0" || v === false || v === "false") return 0;
    return null;
  }

  // -------------------------------
  // 🔹 CARGAR EJECUCIONES
  // -------------------------------

  async function cargarEjecuciones() {
    try {
      const res = await fetch("/ejecuciones");
      const data = await res.json();
      if (!data.success) return console.error("Error backend:", data.error);

      ejecuciones = data.data.map(item => {
        const detalle = Array.isArray(item.Detalle) ? item.Detalle : [];
        const ok = detalle.filter(r => normalizarOK(r.Dato) === 1).length;
        const error = detalle.filter(r => normalizarOK(r.Dato) === 0 || normalizarOK(r.Dato) === null).length;
        const total = detalle.length;

        return {
          id: item.Id_Tasklist,
          flujo: item.Titulo_Tasklist,
          identificador: item.Identificador,
          usuario: item.Email,
          estado: item.Estado,
          avance: item.Avance,
          resultado: item.Resultado,
          fechaInicio: item.Fecha_Inicio,
          fechaFin: item.Fecha_Fin,
          total,
          ok,
          error
        };
      });

      llenarFiltroSolicitante();
      renderTabla();
      actualizarContadores();

    } catch (err) {
      console.error("Error al obtener ejecuciones:", err);
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

  // -------------------------------
  // 🔹 RENDERIZAR TABLA
  // -------------------------------

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
                    <div class="mb-2"><i class="fas fa-hashtag text-primary me-2"></i><span class="fw-bold text-primary">[${ejec.id}]</span></div>
                    <div class="mb-2"><i class="fas fa-terminal text-secondary me-2"></i><span class="small">${ejec.flujo}</span></div>
                    <div class="mb-2"><i class="fas fa-id-card text-info me-2"></i><span class="small">Identificador:</span> <span class="fw-semibold">${ejec.identificador || "-"}</span></div>
                    <div class="mb-2"><i class="fas fa-envelope text-warning me-2"></i><span class="small">De:</span> <span class="fw-semibold">${ejec.usuario}</span></div>
                    <div><i class="fas fa-project-diagram text-success me-2"></i><span class="small">Flujo:</span> <span class="fw-semibold">${ejec.flujo}</span><span class="badge bg-secondary ms-2">RPA</span></div>
                  </td>
                  <td class="text-start">
                    <div class="p-3 border rounded bg-light" style="width:280px;">
                      <div class="mb-3 text-center">
                        <span class="badge bg-${ejec.estado.includes('Error')?'danger':'success'} px-3 py-2">${ejec.estado}</span>
                      </div>
                      <div class="mb-2"><i class="fas fa-play text-primary me-2"></i><span class="small">Inicio:</span> <span class="fw-semibold">${formatearFecha(ejec.fechaInicio)}</span></div>
                      <div class="mb-2"><i class="fas fa-stop text-danger me-2"></i><span class="small">Fin:</span> <span class="fw-semibold">${formatearFecha(ejec.fechaFin)}</span></div>
                      <div class="mb-3"><i class="fas fa-clock text-warning me-2"></i><span class="small">Duración:</span> <span class="fw-bold text-dark">${duracion}</span></div>
                      <div class="text-truncate small" style="max-width:240px;" title="${ejec.resultado || '-'}">Resultado: <span class="fw-bold">${ejec.resultado || '-'}</span></div>
                    </div>
                  </td>
                  <td class="text-start">
                    <div class="d-flex flex-column gap-2 border rounded p-2 bg-light">
                      <button type="button" class="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2 btn-detalle" data-idtasklist="${ejec.id}" data-detalle="total" data-bs-toggle="modal" data-bs-target="#detalleItemModal" title="Ver registros Total">
                        <i class="bi bi-eye text-primary"></i> <span class="text-primary fw-semibold">Total:</span> <span class="text-primary fw-bold">${ejec.total ?? 0}</span>
                      </button>
                      <button type="button" class="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2 btn-detalle" data-idtasklist="${ejec.id}" data-detalle="ok" data-bs-toggle="modal" data-bs-target="#detalleItemModal" title="Ver registros OK">
                        <i class="bi bi-eye text-success"></i> <span class="text-success fw-semibold">OK:</span> <span class="text-success fw-bold">${ejec.ok ?? 0}</span>
                      </button>
                      <button type="button" class="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2 btn-detalle" data-idtasklist="${ejec.id}" data-detalle="error" data-bs-toggle="modal" data-bs-target="#detalleItemModal" title="Ver registros Error">
                        <i class="bi bi-eye text-danger"></i> <span class="text-danger fw-semibold">Error:</span> <span class="text-danger fw-bold">${ejec.error ?? 0}</span>
                      </button>
                    </div>
                  </td>
                  <td class="text-start">
                    <div class="small fw-semibold mb-1">Avance: ${ejec.avance}%</div>
                    <div class="progress mb-2" style="height:10px;"><div class="progress-bar bg-success" role="progressbar" style="width:${ejec.avance}%" aria-valuenow="${ejec.avance}" aria-valuemin="0" aria-valuemax="100"></div></div>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        `;
        tabla.appendChild(row);

        row.querySelectorAll(".btn-detalle").forEach(btn => {
          const valor = Number(btn.querySelector("span.fw-bold")?.textContent) || 0;
          if (valor === 0) {
            btn.classList.add("disabled");
            btn.style.pointerEvents = "none";
            btn.style.opacity = "0.5";
          }
        });
      });
  }

  // -------------------------------
  // 🔹 EVENTOS
  // -------------------------------

  filtroSolicitante.addEventListener("change", renderTabla);
  filtroRegistro.addEventListener("input", renderTabla);

  if (btnSolicitar) {
    btnSolicitar.addEventListener("click", () => {
      window.location.href = "SolicitarEjecucion.html";
    });
  }

  // Detalle modal y descarga CSV
  $(document).on("click", ".btn-detalle", async function(e){
    const total = Number($(this).find("span.fw-bold").text() || 0);
    if (total === 0) return e.stopImmediatePropagation();

    const id = $(this).data("idtasklist");
    const tipoDetalle = $(this).data("detalle");

    $("#detalleItemModalTitle").text("Cargando...");
    $("#detalleItemModalBody").html(`
      <div class="text-center p-4">
        <div class="spinner-border text-primary" role="status"></div>
        <p class="mt-2">Obteniendo datos...</p>
      </div>
    `);

    const modalEl = document.getElementById("detalleItemModal");
    const modal = bootstrap.Modal.getInstance(modalEl) ?? new bootstrap.Modal(modalEl);
    modal.show();

    try {
      const res = await fetch(`/api/ejecuciones/detalle/${id}`);
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        $("#detalleItemModalTitle").text("Sin datos");
        $("#detalleItemModalBody").html("<p>No hay registros para este detalle.</p>");
        return;
      }

      data.forEach(r => r.Ok = normalizarOK(r.Ok));
      let filtrados = data;
      if(tipoDetalle === "ok") filtrados = data.filter(r => r.Ok === 1);
      if(tipoDetalle === "error") filtrados = data.filter(r => r.Ok === 0 || r.Ok === null);

      const tituloBase = tipoDetalle === "ok" ? "Detalle OK" : tipoDetalle === "error" ? "Detalle ERROR" : "Detalle TOTAL";

      if(filtrados.length === 0){
        $("#detalleItemModalTitle").text(`${tituloBase} (0)`);
        $("#detalleItemModalBody").html(`<p>No hay registros para mostrar.</p>`);
        return;
      }

      const first = filtrados[0];
      const col1 = first.Campos ?? "Columna 1";
      const col2 = first.Campos_Accion ?? "Columna 2";
      const col3 = first.Campos_Resultado ?? "Columna 3";

      let html = `<table class="table table-bordered table-striped">
        <thead class="table-dark">
          <tr><th>${col1}</th><th>${col2}</th><th>${col3}</th></tr>
        </thead>
        <tbody>`;
      filtrados.forEach(r=>{
        html += `<tr><td>${r.Dato ?? "-"}</td><td>${r.Accion ?? "-"}</td><td>${r.Resultado ?? "-"}</td></tr>`;
      });
      html += "</tbody></table>";

      $("#detalleItemModalTitle").text(`${tituloBase} (${filtrados.length})`);
      $("#detalleItemModalBody").html(html);
      
      $("#detalleItemModalBody").append(`
        <div class="text-end mt-3">
          <button id="btnDescargarCSV" class="btn btn-outline-primary btn-sm">
            <i class="bi bi-download"></i> Descargar CSV
          </button>
        </div>
      `);

      $("#btnDescargarCSV").on("click", function () {
        let csv = first.CamposEncabezado ? first.CamposEncabezado + "\n" : `${col1};${col2};${col3}\n`;
        filtrados.forEach(r => {
          if (r.FilaCompleta) csv += r.FilaCompleta + "\n";
          else csv += `${r.Dato ?? "-"};${r.Accion ?? "-"};${r.Resultado ?? "-"}\n`;
        });
        descargarCSV(csv, `detalle_${tipoDetalle}_${id}.csv`);
      });

    } catch(err){
      $("#detalleItemModalTitle").text("Error");
      $("#detalleItemModalBody").html("<p>No se pudo obtener la información.</p>");
      console.error(err);
    }
  });

  // -------------------------------
  // 🔹 INICIALIZAR
  // -------------------------------

  cargarEjecuciones();
  setInterval(cargarEjecuciones, 10000);
});
