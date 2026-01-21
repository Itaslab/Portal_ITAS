// blanqueoPasswordAdmin.js
// Maneja la búsqueda de usuarios y el blanqueo de contraseña

let usuariosOriginal = []; // Almacenar lista original de usuarios
let usuarioSeleccionado = null; // Usuario actualmente seleccionado

document.addEventListener('DOMContentLoaded', () => {
  cargarUsuarios();
  configurarEventos();
});

// ===== CARGAR USUARIOS =====
async function cargarUsuarios() {
  try {
    const response = await fetch(`${basePath}/usuarios-blanquear`);
    const data = await response.json();

    if (!data.success) {
      mostrarError('Error al cargar usuarios: ' + data.error);
      return;
    }

    usuariosOriginal = data.usuarios;
    mostrarUsuariosEnTabla(usuariosOriginal);

  } catch (err) {
    console.error('Error cargando usuarios:', err);
    mostrarError('Error de conexión al cargar usuarios');
  }
}

// ===== MOSTRAR USUARIOS EN TABLA =====
function mostrarUsuariosEnTabla(usuarios) {
  const tabla = document.getElementById('tablaUsuarios');

  if (usuarios.length === 0) {
    tabla.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No se encontraron usuarios</td></tr>';
    return;
  }

  tabla.innerHTML = usuarios.map(usuario => `
    <tr class="usuario-row" data-id="${usuario.id_usuario}">
      <td>${usuario.legajo || '-'}</td>
      <td>${usuario.nombre_completo}</td>
      <td>${usuario.email}</td>
      <td>
        ${usuario.blanquear_pass ? 
          '<span class="badge bg-warning badge-estado">Cambio Pendiente</span>' : 
          '<span class="badge bg-success badge-estado">Activo</span>'
        }
      </td>
    </tr>
  `).join('');

  // Agregar event listeners a las filas
  tabla.querySelectorAll('.usuario-row').forEach(fila => {
    fila.addEventListener('click', () => seleccionarUsuario(fila));
  });
}

// ===== SELECCIONAR USUARIO =====
function seleccionarUsuario(fila) {
  // Remover selección anterior
  document.querySelectorAll('.usuario-row.seleccionado').forEach(f => {
    f.classList.remove('seleccionado');
  });

  // Marcar nueva selección
  fila.classList.add('seleccionado');

  // Obtener datos del usuario
  const idUsuario = fila.dataset.id;
  const usuario = usuariosOriginal.find(u => u.id_usuario == idUsuario);

  if (!usuario) return;

  usuarioSeleccionado = usuario;

  // Mostrar información del usuario
  document.getElementById('nombreSeleccionado').textContent = usuario.nombre_completo;
  document.getElementById('emailSeleccionado').textContent = usuario.email;
  document.getElementById('legajoSeleccionado').textContent = usuario.legajo || '-';
  document.getElementById('estadoSeleccionado').textContent = usuario.blanquear_pass ? 
    'Cambio de contraseña pendiente' : 'Activo';

  // Mostrar panel de información
  document.getElementById('infoUsuario').classList.add('mostrar');

  // Habilitar botón de blanqueo
  document.getElementById('btnBlanquear').disabled = false;
}

// ===== CONFIGURAR EVENTOS =====
function configurarEventos() {
  // Búsqueda en tiempo real
  document.getElementById('inputBuscar').addEventListener('input', (e) => {
    const texto = e.target.value.toLowerCase().trim();
    
    if (texto === '') {
      mostrarUsuariosEnTabla(usuariosOriginal);
      return;
    }

    const usuariosFiltrados = usuariosOriginal.filter(usuario => {
      return (
        usuario.nombre_completo.toLowerCase().includes(texto) ||
        usuario.email.toLowerCase().includes(texto) ||
        (usuario.legajo && usuario.legajo.toString().includes(texto))
      );
    });

    mostrarUsuariosEnTabla(usuariosFiltrados);
  });

  // Botón Blanquear
  document.getElementById('btnBlanquear').addEventListener('click', () => {
    if (!usuarioSeleccionado) {
      mostrarError('Por favor seleccione un usuario');
      return;
    }

    mostrarModalConfirmacion();
  });

  // Confirmar blanqueo
  document.getElementById('btnConfirmarBlanqueo').addEventListener('click', () => {
    blanquearPassword();
  });
}

// ===== MOSTRAR MODAL DE CONFIRMACIÓN =====
function mostrarModalConfirmacion() {
  document.getElementById('usuarioConfirm').textContent = usuarioSeleccionado.nombre_completo;
  const modal = new bootstrap.Modal(document.getElementById('confirmModal'));
  modal.show();
}

// ===== BLANQUEAR CONTRASEÑA =====
async function blanquearPassword() {
  try {
    document.getElementById('btnBlanquear').disabled = true;
    document.getElementById('btnBlanquear').innerHTML = 
      '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Procesando...';

    const response = await fetch(`${basePath}/blanquear-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id_usuario: usuarioSeleccionado.id_usuario
      })
    });

    const data = await response.json();

    if (!data.success) {
      mostrarError(data.error || 'Error al blanquear la contraseña');
      document.getElementById('btnBlanquear').disabled = false;
      document.getElementById('btnBlanquear').innerHTML = 
        '<i class="bi bi-exclamation-circle"></i> Blanquear Contraseña';
      return;
    }

    // Mostrar modal de éxito
    document.getElementById('usuarioExito').textContent = usuarioSeleccionado.nombre_completo;
    const successModal = new bootstrap.Modal(document.getElementById('successModal'));
    successModal.show();

    // Recargar usuarios después de 2 segundos
    setTimeout(() => {
      cargarUsuarios();
      limpiarSeleccion();
    }, 2000);

  } catch (err) {
    console.error('Error blanqueando contraseña:', err);
    mostrarError('Error de conexión al blanquear la contraseña');
    document.getElementById('btnBlanquear').disabled = false;
    document.getElementById('btnBlanquear').innerHTML = 
      '<i class="bi bi-exclamation-circle"></i> Blanquear Contraseña';
  }
}

// ===== LIMPIAR SELECCIÓN =====
function limpiarSeleccion() {
  usuarioSeleccionado = null;
  document.querySelectorAll('.usuario-row.seleccionado').forEach(f => {
    f.classList.remove('seleccionado');
  });
  document.getElementById('infoUsuario').classList.remove('mostrar');
  document.getElementById('btnBlanquear').disabled = true;
  document.getElementById('inputBuscar').value = '';
}

// ===== MOSTRAR ERROR =====
function mostrarError(mensaje) {
  document.getElementById('errorMensaje').textContent = mensaje;
  const errorModal = new bootstrap.Modal(document.getElementById('errorModal'));
  errorModal.show();
}
