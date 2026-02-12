//ejecuciones.js



function formatearFecha(fechaISO) {
         if (!fechaISO) return "-";
         const d = new Date(fechaISO);
         
         // Sumar 3 horas para ajuste de zona horaria
         d.setHours(d.getHours() + 3);

         const dia = String(d.getDate()).padStart(2, "0");
         const mes = String(d.getMonth() + 1).padStart(2, "0");
         const año = d.getFullYear();

         const horas = String(d.getHours()).padStart(2, "0");
         const minutos = String(d.getMinutes()).padStart(2, "0");
         const segundos = String(d.getSeconds()).padStart(2, "0");


         return `${dia}/${mes}/${año} ${horas}:${minutos}:${segundos}`;
     }
     
let cargandoEjecuciones = false;
const cacheContadores = {};

let paginaActual = 1;
const LIMITE = 50;


document.addEventListener("DOMContentLoaded", () => {
  const tabla = document.getElementById("tablaEjecuciones");
  const filtroSolicitante = document.getElementById("filtroSolicitante");
  const filtroRegistro = document.getElementById("filtroRegistro");
  const btnAnterior = document.getElementById("btnPaginaAnterior");
  const btnSiguiente = document.getElementById("btnPaginaSiguiente");
  const lblPagina = document.getElementById("paginaActualLabel");
  const overlayCarga = document.getElementById("overlayCarga");


  btnAnterior.addEventListener("click", () => {
  if (paginaActual === 1) return;
  paginaActual--;
      lblPagina.textContent = paginaActual;
      cargarEjecuciones(true);
      });

  btnSiguiente.addEventListener("click", () => {
      paginaActual++;
      lblPagina.textContent = paginaActual;
      cargarEjecuciones(true);
      });


  let ejecuciones = [];

    // ⬇️ PRIMERO: función obtenerContadores
async function obtenerContadores(id) {

    // 🔹 si ya lo pedimos antes, devolvemos cache
    if (cacheContadores[id]) {
        return cacheContadores[id];
    }

    try {
        const res = await fetch(`${basePath}/api/ejecuciones/detalle/${id}`);
        
        // Verificar si la sesión es válida
        await verificarSesionValida(res, '/api/ejecuciones/detalle');
        
        const data = await res.json();

        if (!Array.isArray(data)) {
            return { total: 0, ok: 0, error: 0 };
        }

        // Normalizar OK igual que el modal
        function normalizarOK(v) {
            if (v === 1 || v === "1" || v === true || v === "true") return 1;
            if (v === 0 || v === "0" || v === false || v === "false") return 0;
            return null;
        }

        data.forEach(r => r.Ok = normalizarOK(r.Ok));

        const ok = data.filter(r => r.Ok === 1).length;
        const error = data.filter(r => r.Ok === 0).length;
        const total = data.length;

        const contadores = { total, ok, error };

        // 🔹 guardamos en cache
        cacheContadores[id] = contadores;

        return contadores;

    } catch (e) {
        console.error("Error obteniendo contadores:", e);
        return { total: 0, ok: 0, error: 0 };
    }
}

 
  // 🔹 Cargar datos desde backend
async function cargarEjecuciones(scrollear = false) {

    if (cargandoEjecuciones) return;
    cargandoEjecuciones = true;
    if (scrollear) {
    overlayCarga.classList.remove("d-none");
    }


      // 🔒 Bloquear paginación mientras carga
  btnPaginaAnterior.disabled = true;
  btnPaginaSiguiente.disabled = true;

    try {

        Object.keys(cacheContadores).forEach(k => delete cacheContadores[k]);

      const solicitante = encodeURIComponent(filtroSolicitante.value || "");
      const registro = encodeURIComponent(filtroRegistro.value || "");
      

      const res = await fetch(
        `${basePath}/ejecuciones-paginadas?page=${paginaActual}&limit=${LIMITE}&solicitante=${solicitante}&registro=${registro}`
      );
        
        // Verificar si la sesión es válida
        await verificarSesionValida(res, '/ejecuciones');
        
        const data = await res.json();

        if (!data.success) {
            console.error("Error en backend:", data.error);
            return;
        }

        ejecuciones = await Promise.all(
            data.data.map(async item => {

                const { total, ok, error } =
                    await obtenerContadores(item.Id_Tasklist);

                return {
                    id: item.Id_Tasklist,
                    titulo:item.Titulo_Tasklist,
                    flujo: item.Titulo_Flujo,
                    identificador: item.Identificador,
                    usuario: item.Email,
                    estado: item.Estado,
                    colorEstado: item.Color,
                    avance: item.Avance,
                    resultado: item.Resultado,
                    fechaInicio: item.Fecha_Inicio,
                    fechaFin: item.Fecha_Fin,
                    total,
                    ok,
                    error
                };
            })
        );

        // Guardar el filtro actual ANTES de actualizar las opciones
        const filtroSolicitanteActual = filtroSolicitante.value;
        
        llenarFiltroSolicitante();
        
        // Restaurar el filtro DESPUÉS de llenar las opciones
        if (filtroSolicitanteActual) {
            filtroSolicitante.value = filtroSolicitanteActual;
        }
        
        renderTabla();
        if (scrollear) {
          window.scrollTo({
          top: 0,
          behavior: "smooth"
         });
        }

    } catch (err) {
        console.error("Error al obtener ejecuciones:", err);

    } finally {
        cargandoEjecuciones = false;
            // 🔓 Habilitar paginación
        btnPaginaAnterior.disabled = false;
        btnPaginaSiguiente.disabled = false;
        btnPaginaAnterior.disabled = paginaActual === 1;
        if (scrollear) {
        overlayCarga.classList.add("d-none");
        }
      }
}
 
 
let cacheSolicitantes = [];

function llenarFiltroSolicitante() {

  const emailsUnicos = [...new Set(ejecuciones.map(e => e.usuario))].sort();

  // si no cambió, no tocar el select
  if (JSON.stringify(emailsUnicos) === JSON.stringify(cacheSolicitantes)) {
    return;
  }

  cacheSolicitantes = emailsUnicos;

  const seleccionado = filtroSolicitante.value;
  filtroSolicitante.innerHTML = `<option value="">Todos</option>`;

  emailsUnicos.forEach(email => {
    const option = document.createElement("option");
    option.value = email;
    option.textContent = email;
    filtroSolicitante.appendChild(option);
  });

  if (emailsUnicos.includes(seleccionado)) {
    filtroSolicitante.value = seleccionado;
  }
}
 
  
  function renderTabla() {

    // 🔴 DESTRUIR TOOLTIPS EXISTENTES antes de limpiar la tabla
    // Esto evita que queden "clavados"
    document.querySelectorAll(".btn-accion").forEach(btn => {
      const tooltip = bootstrap.Tooltip.getInstance(btn);
      if (tooltip) {
        tooltip.dispose();
      }
    });

    tabla.innerHTML = "";


      ejecuciones.forEach(ejec => {
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
                      <span class="small">${ejec.titulo}</span>
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
            <span class="badge px-3 py-2 fs-6" style="background-color: #${ejec.colorEstado || '6c757d'}; color: white; text-shadow: -1px -1px 0 black, 1px -1px 0 black, -1px 1px 0 black, 1px 1px 0 black, 0 0 3px black;">
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
        data-valor="${ejec.total ?? 0}"
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
        data-valor="${ejec.ok ?? 0}"
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
        data-valor="${ejec.error ?? 0}"
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
      <i class="bi-clipboard-data"></i>
       <span class="text-dark fw-semibold">Ver Log</span>
    </button>
  </div>
</td>
 
            <td class="text-center">
                      <div class="small fw-semibold mb-1">Avance: ${ejec.avance}%</div>
                    <div class="progress mb-2" style="height: 10px;">
                      <div class="progress-bar bg-success" role="progressbar" style="width: ${ejec.avance}%;" aria-valuenow="${ejec.avance}" aria-valuemin="0" aria-valuemax="100"></div>
                    </div>
  <!-- Cancelar -->
  <button class="btn btn-outline-secondary btn-sm btn-accion"
          data-idtasklist="${ejec.id}"
          data-bs-toggle="modal" 
          data-bs-target="#modalCancelar"
          title="Cancela la ejecución actual">
    <i class="bi bi-x-circle"></i>
  </button>

  <!-- Pausar -->
<button class="btn btn-outline-secondary btn-sm btn-accion"
        data-idtasklist="${ejec.id}"
        data-bs-toggle="modal"
        data-bs-target="#modalPausar"
        title="Pausa la ejecución actual">
  <i class="bi bi-pause-circle"></i>
</button>

  <!-- Reanudar -->
  <button class="btn btn-outline-secondary btn-sm btn-accion" 
          data-idtasklist="${ejec.id}"
          data-bs-toggle="modal" 
          data-bs-target="#modalReanudar"
          title="Reanuda una ejecución pausada">
    <i class="bi bi-arrow-clockwise"></i>
  </button>

  <!-- Reenviar -->
  <button class="btn btn-outline-secondary btn-sm btn-accion" 
        data-idtasklist="${ejec.id}"
          data-bs-toggle="modal" 
          data-bs-target="#modalReenviar"
          title="Reenvía toda la ejecución nuevamente">
    <i class="bi bi-send"></i>
  </button>

  <!-- Reenviar Fallidos -->
  <button class="btn btn-outline-secondary btn-sm btn-accion" 
        data-idtasklist="${ejec.id}"
          data-bs-toggle="modal" 
          data-bs-target="#modalReenviarFallidos"
          title="Reenvía solo los items que fallaron">
    <i class="bi bi-arrow-counterclockwise"></i>
  </button>
</td>
                </tr>
              </tbody>
            </table>
          </td>
        `;
        tabla.appendChild(row);
        row.querySelectorAll(".btn-detalle").forEach(btn => {
    const valor = Number(btn.dataset.valor || 0);
      if (valor === 0) {
        btn.classList.add("disabled");
        btn.style.pointerEvents = "none";
        btn.style.opacity = "0.5";
        }
        });
        
        // Inicializar tooltips para los botones de acción
        // Usar delay para que no aparezcan tan rápido y sean más estables
        row.querySelectorAll(".btn-accion").forEach(btn => {
          const tooltip = new bootstrap.Tooltip(btn, {
            delay: { show: 500, hide: 100 },
            trigger: 'hover'
          });
        });
      });
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
filtroSolicitante.addEventListener("change", () => {
  paginaActual = 1;
  lblPagina.textContent = paginaActual;
  cargarEjecuciones(true);
});

filtroRegistro.addEventListener("input", () => {
  paginaActual = 1;
  lblPagina.textContent = paginaActual;
  cargarEjecuciones(true);
});
 
  // Obtener usuario actual desde sesión
  async function inicializarUsuario() {
    try {
      const resMe = await fetch(basePath + "/me", { credentials: "include" });
      
      // Verificar si la sesión es válida
      await verificarSesionValida(resMe, '/me');
      
      const datMe = await resMe.json();
      if (datMe.success && datMe.usuario) {
        usuarioActual = datMe.usuario.ID_Usuario;
      } else {
        usuarioActual = 0;
      }
    } catch (err) {
      console.error("Error obteniendo usuario:", err);
      usuarioActual = 0;
    }

    if (!usuarioActual) {
      alert("Error: no se encontró el usuario logueado");
      console.error("Usuario no detectado");
    }
  }

  // Inicializar usuario y luego cargar ejecuciones
  inicializarUsuario().then(() => {
    cargarEjecuciones();
    setInterval(cargarEjecuciones, 4000);
  });

  document.getElementById("btnCancelarConfirmar")
    .addEventListener("click", confirmarCancelar);

  document.getElementById("btnConfirmarPausar")
    .addEventListener("click", confirmarPausar);

  document.getElementById("btnConfirmarReanudar")
    .addEventListener("click", confirmarReanudar);

  document.getElementById("btnConfirmarReenviar")
    .addEventListener("click", confirmarReenviar);

  document.getElementById("btnConfirmarReenviarFallidos")
    .addEventListener("click", confirmarReenviarFallidos);

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

//mensaje de @msg desde el servidor 

function mostrarMensajeModal(tipo, mensaje) {
  const titulo = document.getElementById("modalMensajeTitulo");
  const body = document.getElementById("modalMensajeBody");

  const iconos = {
    success: "bi-check-circle-fill text-success",
    error: "bi-x-circle-fill text-danger",
    warning: "bi-exclamation-triangle-fill text-warning",
    info: "bi-info-circle-fill text-primary"
  };

  titulo.innerHTML = `
    <i class="bi ${iconos[tipo] || iconos.info} me-2"></i>
    Mensaje
  `;

  body.innerHTML = `<p class="mb-0">${mensaje}</p>`;

  const modalEl = document.getElementById("modalMensaje");
  const modal = new bootstrap.Modal(modalEl);
  modal.show();
}



 
// 🔹 Funciones auxiliares de los botones usando Bootstrap alerts
function verTotal(id) { mostrarAlerta("primary", `Total de registros para ejecución ${id}: 2`); }
function verOk(id) { mostrarAlerta("success", `Registros OK para ejecución ${id}: 2`); }
function error(id) { mostrarAlerta("danger", `Registros con error para ejecución ${id}: 0`); }
function verEstado(id) { mostrarAlerta("warning", `Estado detallado para ejecución ID: ${id}`); }
 
// 🔹 Botón "Solicitar ejecución"
const btnSolicitar = document.getElementById("btnSolicitar");
btnSolicitar.addEventListener("click", () => {
  window.location.href = basePath + "/pages/SolicitarEjecucion.html";
});
 
// ------------------------------
// BOTÓN OJO → DETALLE (TOTAL/OK/ERROR) + DESCARGA CSV
// ------------------------------
 
 
 
$(document).on("click", ".btn-detalle", async function (e) {
 
  // 🚫 NUEVO: si el valor es 0 no abrimos nada
  const total = Number($(this).find("span.fw-bold").text() || 0);
  if (total === 0) {
    e.stopImmediatePropagation(); // frena cualquier otra acción
    return; // no abrir modal
  }
 
  const id = $(this).data("idtasklist");
  const tipoDetalle = $(this).data("detalle"); // "total" | "ok" | "error"
 
 
 
  // Mostrar cargando
  $("#detalleItemModalTitle").text("Cargando...");
  $("#detalleItemModalBody").html(`
    <div class="text-center p-4">
      <div class="spinner-border text-primary" role="status"></div>
      <p class="mt-2">Obteniendo datos...</p>
    </div>
  `);
 
     // Mostrar modal
    const modalEl = document.getElementById("detalleItemModal");
    const modal = bootstrap.Modal.getInstance(modalEl) ?? new bootstrap.Modal(modalEl);
    modal.show();
 
    try {
        const res = await fetch(`${basePath}/api/ejecuciones/detalle/${id}`);
        
        // Verificar si la sesión es válida
        await verificarSesionValida(res, '/api/ejecuciones/detalle');
        
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
        if (tipoDetalle === "error") filtrados = data.filter(r => r.Ok === 0 );
 
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

        const col4 = "Fecha / Hora";
        const col5 = "Status";
        const col6 = "Status Anterior";
        const col7 = "Intentos";
        const col8 = "Ultimo Error";
      


// Render tabla
        let html = `
        <table class="table table-bordered table-striped">
            <thead class="table-dark">
                <tr>
                    <th>${col1}</th>
                    <th>${col2}</th>
                    <th>${col3}</th>
                    <th>${col4}</th>
                    <th>${col5}</th>
                    <th>${col6}</th>
                    <th>${col7}</th>
                    <th>${col8}</th>
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
                    <td>${formatearFecha(r.Fecha_Hora)}</td>
                    <td>${r.Status ?? "-"}</td>
                    <td>${r.Status_Anterior ?? "-"}</td>
                    <td>${r.Intentos ?? "-"}</td>
                    <td>${r.Ultimo_Error ?? "-"}</td>
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
                csv += `${col1};${col2};${col3};${col4};${col5};${col6};${col7};${col8}\n`;
            }
 
            filtrados.forEach(r => {
                if (r.FilaCompleta) {
                    csv += r.FilaCompleta + "\n";
                } else {
                    csv += `${r.Dato ?? "-"};${r.Accion ?? "-"};${r.Resultado ?? "-"};${r.Fecha_Hora ?? "-"};${r.Status ?? "-"};${r.Status_Anterior ?? "-"};${r.Intentos ?? "-"};${r.Ultimo_Error ?? "-"}\n`;
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
    const res = await fetch(`${basePath}/api/logs/${idTasklist}`);
    
    // Verificar si la sesión es válida
    await verificarSesionValida(res, '/api/logs');
    
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
 
  
 

// =====================================
// VARIABLES GLOBALES
// =====================================
let ejecucionSeleccionada = null;
let usuarioActual = null;

$(document).on("click", ".btn-accion", function () {
  // 🔴 Limpiar tooltip cuando se hace click
  const tooltip = bootstrap.Tooltip.getInstance(this);
  if (tooltip) {
    tooltip.hide();
  }
  
  ejecucionSeleccionada = $(this).data("idtasklist");
  console.log("👉 Ejecución seleccionada:", ejecucionSeleccionada);
});

// 🔴 Manejador global para limpiar tooltips cuando se dejan los botones
$(document).on("mouseleave", ".btn-accion", function () {
  const tooltip = bootstrap.Tooltip.getInstance(this);
  if (tooltip) {
    tooltip.hide();
  }
});


// =====================================
// HANDLERS DE CONFIRMAR (BOTONES DENTRO DEL MODAL)
// =====================================

async function confirmarCancelar() {
  await ejecutarAccionBackend("cancelar");
}

async function confirmarPausar() {
  await ejecutarAccionBackend("pausar");
}

async function confirmarReanudar() {
  await ejecutarAccionBackend("reanudar");
}

async function confirmarReenviar() {
  await ejecutarAccionBackend("reenviar-todo");
}

async function confirmarReenviarFallidos() {
  await ejecutarAccionBackend("reenviar-fallidos");
}


// =====================================
// FUNCIÓN CENTRAL QUE LLAMA AL BACKEND
// =====================================

async function ejecutarAccionBackend(accion) {

  // 🔴 VALIDACIÓN CLAVE
  if (!ejecucionSeleccionada) {
    mostrarMensajeModal("error", "No hay ejecución seleccionada");
    console.error("ID Tasklist inválido:", ejecucionSeleccionada);
    return;
  }

  try {
    const res = await fetch(`${basePath}/api/acciones/${accion}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idTasklist: ejecucionSeleccionada,
        idUsuario: usuarioActual
      })
    });

    // Verificar si la sesión es válida
    await verificarSesionValida(res, `/api/acciones/${accion}`);

    const data = await res.json();
    console.log("Respuesta backend:", data);

    if (data.success) {

      document.querySelectorAll(".modal.show").forEach(m => {
        const instance = bootstrap.Modal.getInstance(m);
        if (instance) instance.hide();
      });

      if (typeof cargarEjecuciones === "function") {
        cargarEjecuciones();
      }

        mostrarMensajeModal("success", data.message);


    } else {
      mostrarMensajeModal("error", data.error || "Ocurrió un error");
    }

  } catch (err) {
    console.error("Error ejecutando acción:", err);
    mostrarMensajeModal("error", "No se pudo ejecutar la acción. Intente nuevamente o contacte a soporte.");
  }
}

