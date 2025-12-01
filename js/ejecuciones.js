document.addEventListener("DOMContentLoaded", () => {

  const contenedor = document.getElementById("contenedorEjecuciones");
  const filtroSolicitante = document.getElementById("filtroSolicitante");
  const filtroRegistro = document.getElementById("filtroRegistro");

  let ejecuciones = [];

  async function cargarEjecuciones() {
    try {
      const res = await fetch("/ejecuciones");
      const data = await res.json();

      ejecuciones = data.data.map(e => ({
        id: e.Id_Tasklist,
        flujo: e.Titulo_Tasklist,
        identificador: e.Identificador,
        usuario: e.Email,
        estado: e.Estado,
        avance: e.Avance,
        resultado: e.Resultado,
        inicio: e.Fecha_Inicio,
        fin: e.Fecha_Fin,
        total: e.Reg_Totales,
        ok: e.Reg_Proc_OK,
        error: e.Reg_Proc_NOK
      }));

      llenarFiltros();
      renderCards();
    } catch (err) {
      console.error("Error:", err);
    }
  }

  function llenarFiltros() {
    const emails = [...new Set(ejecuciones.map(e => e.usuario))].sort();
    filtroSolicitante.innerHTML = `<option value="">Todos</option>`;
    emails.forEach(mail => {
      filtroSolicitante.innerHTML += `<option>${mail}</option>`;
    });
  }

  function renderCards() {
    const fSolicit = filtroSolicitante.value.toLowerCase();
    const fReg = filtroRegistro.value.toLowerCase();

    contenedor.innerHTML = "";

    ejecuciones
      .filter(e =>
        (!fSolicit || e.usuario.toLowerCase().includes(fSolicit)) &&
        (!fReg || Object.values(e).join(" ").toLowerCase().includes(fReg))
      )
      .forEach(e => crearCard(e));
  }

  function crearCard(e) {
    const dur = calcularDuracion(e.inicio, e.fin);
    const estadoClass =
      e.estado.includes("OK") ? "estado-success" :
      e.estado.includes("Error") ? "estado-danger" : "estado-warning";

    const card = document.createElement("div");
    card.className = "col-12";
    card.innerHTML = `
      <div class="card card-ejecucion shadow-sm p-3">

        <div class="d-flex justify-content-between">
          <h5 class="card-title">#${e.id} — ${e.flujo}</h5>
          <span class="${estadoClass}">${e.estado}</span>
        </div>

        <div class="text-secondary small mb-2">
          ${e.usuario} — Identificador: <strong>${e.identificador || "-"}</strong>
        </div>

        <div class="row mb-3">
          <div class="col-sm">
            <i class="bi bi-clock"></i> Inicio: <strong>${formatearFecha(e.inicio)}</strong><br>
            <i class="bi bi-flag"></i> Fin: <strong>${formatearFecha(e.fin)}</strong><br>
            <i class="bi bi-hourglass-split"></i> Duración: <strong>${dur}</strong>
          </div>

          <div class="col-sm">
            <strong>Total:</strong> ${e.total ?? "-"}<br>
            <strong>OK:</strong> ${e.ok ?? "-"}<br>
            <strong>Error:</strong> ${e.error ?? "-"}
          </div>

          <div class="col-sm">
            <div class="fw-semibold mb-1">Avance: ${e.avance}%</div>
            <div class="progress" style="height: 8px;">
              <div class="progress-bar bg-success" style="width: ${e.avance}%;"></div>
            </div>
          </div>
        </div>

        <div class="d-flex gap-2">
          <button class="btn btn-outline-primary btn-accion" onclick="mostrarModal('Detalle', 'Detalles de ejecución #${e.id}')">
            <i class="bi bi-eye"></i>
          </button>

          <button class="btn btn-outline-secondary btn-accion" onclick="mostrarModal('Carpeta', 'Mostrando carpeta de ejecución')">
            <i class="bi bi-folder"></i>
          </button>

          <button class="btn btn-outline-danger btn-accion" onclick="mostrarModal('Cerrar', '¿Desea cerrar la ejecución?')">
            <i class="bi bi-x-circle"></i>
          </button>
        </div>

      </div>
    `;

    contenedor.appendChild(card);
  }

  function formatearFecha(f) {
    if (!f) return "-";
    const d = new Date(f);
    return d.toLocaleDateString() + " " + d.toLocaleTimeString();
  }

  function calcularDuracion(i, f) {
    if (!i || !f) return "-";
    const diff = new Date(f) - new Date(i);
    const min = Math.floor(diff / 60000);
    const sec = Math.floor((diff % 60000) / 1000);
    return `${min}'${sec < 10 ? "0" : ""}${sec}"`;
  }

  filtroSolicitante.onchange = renderCards;
  filtroRegistro.oninput = renderCards;

  cargarEjecuciones();
  setInterval(cargarEjecuciones, 10000);
});

// Modal global
function mostrarModal(titulo, cuerpo) {
  document.getElementById("modalGeneralTitle").textContent = titulo;
  document.getElementById("modalGeneralBody").textContent = cuerpo;
  new bootstrap.Modal(document.getElementById("modalGeneral")).show();
}
