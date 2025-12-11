// ejecucionesAux.js
// VARIABLES GLOBALES
// =========================
let ejecucionSeleccionada = null;
let usuarioActual = null; // esto lo tenés definido en tu login

// =========================
// HANDLERS PARA ABRIR MODALES
// (los llamás desde botones de la tabla)
// =========================

function abrirModalCancelar(id) {
  ejecucionSeleccionada = id;
  const modal = new bootstrap.Modal(document.getElementById("modalCancelar"));
  modal.show();
}

function abrirModalPausar(id) {
  ejecucionSeleccionada = id;
  const modal = new bootstrap.Modal(document.getElementById("modalPausar"));
  modal.show();
}

function abrirModalReanudar(id) {
  ejecucionSeleccionada = id;
  const modal = new bootstrap.Modal(document.getElementById("modalReanudar"));
  modal.show();
}

function abrirModalReenviar(id) {
  ejecucionSeleccionada = id;
  const modal = new bootstrap.Modal(document.getElementById("modalReenviar"));
  modal.show();
}

function abrirModalReenviarFallidos(id) {
  ejecucionSeleccionada = id;
  const modal = new bootstrap.Modal(document.getElementById("modalReenviarFallidos"));
  modal.show();
}


// =========================
// HANDLERS DE CONFIRMAR (BOTONES DEL MODAL)
// =========================

// CANCELAR
async function confirmarCancelar() {
  await ejecutarAccionBackend("cancelar");
}

// PAUSAR
async function confirmarPausar() {
  await ejecutarAccionBackend("pausar");
}

// REANUDAR
async function confirmarReanudar() {
  await ejecutarAccionBackend("reanudar");
}

// REENVIAR TODO
async function confirmarReenviar() {
  await ejecutarAccionBackend("reenviar-todo");
}

// REENVIAR FALLIDOS
async function confirmarReenviarFallidos() {
  await ejecutarAccionBackend("reenviar-fallidos");
}


// =========================
// FUNCIÓN CENTRAL: LLAMAR AL BACKEND
// =========================

async function ejecutarAccionBackend(accion) {
  try {
    const res = await fetch(`/api/acciones/${accion}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idTasklist: ejecucionSeleccionada,
        idUsuario: usuarioActual
      })
    });

    const data = await res.json();

    if (data.success) {
      // Cerrar todos los modales abiertos
      const modals = document.querySelectorAll(".modal.show");
      modals.forEach(m => bootstrap.Modal.getInstance(m)?.hide());

      // Refrescar la tabla
      if (typeof cargarEjecuciones === "function") {
        cargarEjecuciones();
      }

      alert("Operación realizada correctamente.");
    } else {
      alert("Error: " + data.error);
    }

  } catch (err) {
    console.error("Error ejecutando acción:", err);
    alert("Error al ejecutar la acción.");
  }
}


// =============================================
// INIT — REGISTRAR HANDLERS DE LOS BOTONES
// =============================================
document.addEventListener("DOMContentLoaded", () => {
  
  // usuarioActual viene del login
  usuarioActual = window.UsuarioActual || null;

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