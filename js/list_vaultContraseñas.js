// list_vaultContraseñas.js
// Listar todas las contraseñas de la bóveda

document.addEventListener('DOMContentLoaded', () => {
  cargarContraseñas();
});

async function cargarContraseñas() {
  try {
    const res = await fetch(basePath + '/vault/listar', {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await res.json();

    if (data.success && data.credenciales) {
      mostrarContraseñas(data.credenciales);
    } else {
      mostrarError('No se pudieron cargar las contraseñas');
    }
  } catch (err) {
    console.error('Error al cargar contraseñas:', err);
    mostrarError('Error de conexión con el servidor');
  }
}

function mostrarContraseñas(credenciales) {
  const tableBody = document.getElementById('vaultTableBody');
  
  if (credenciales.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="4" class="text-center">No hay contraseñas almacenadas</td></tr>';
    return;
  }

  tableBody.innerHTML = credenciales.map(cred => `
    <tr>
      <td><strong>${escaparHTML(cred.sistema)}</strong></td>
      <td>${escaparHTML(cred.usuario)}</td>
      <td>
        <div class="input-group input-group-sm">
          <input type="password" class="form-control form-control-sm" id="pass-${cred.id}" value="••••••••" readonly>
          <button class="btn btn-outline-secondary btn-sm" type="button" onclick="togglePassword(${cred.id})">
            <i class="bi bi-eye"></i> Ver
          </button>
          <button class="btn btn-outline-primary btn-sm" type="button" onclick="copiarAlPortapapeles(${cred.id})">
            Copiar
          </button>
        </div>
      </td>
      <td>
        <button class="btn btn-danger btn-sm" onclick="eliminarCredencial(${cred.id})">Eliminar</button>
      </td>
    </tr>
  `).join('');
}

function mostrarError(mensaje) {
  const tableBody = document.getElementById('vaultTableBody');
  tableBody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">${mensaje}</td></tr>`;
}

function escaparHTML(texto) {
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}

function togglePassword(id) {
  const input = document.getElementById(`pass-${id}`);
  
  if (input.type === 'password') {
    // Mostrar la contraseña descifrada
    desencriptarYMostrar(id);
  } else {
    // Ocultar la contraseña
    input.type = 'password';
    input.value = '••••••••';
  }
}

async function desencriptarYMostrar(id) {
  try {
    const input = document.getElementById(`pass-${id}`);
    
    // Mostrar que estamos cargando
    input.value = 'Cargando...';
    
    const res = await fetch(basePath + `/vault/desencriptar/${id}`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await res.json();

    if (data.success) {
      input.value = data.password;
      input.type = 'text';
    } else {
      input.value = 'Error al desencriptar';
      console.error('Error:', data.error);
    }
  } catch (err) {
    console.error('Error al desencriptar:', err);
    document.getElementById(`pass-${id}`).value = 'Error de conexión';
  }
}

function copiarAlPortapapeles(id) {
  const input = document.getElementById(`pass-${id}`);
  const texto = input.value;
  
  navigator.clipboard.writeText(texto).then(() => {
    alert('Contraseña copiada al portapapeles');
  }).catch(err => {
    console.error('Error al copiar:', err);
    alert('Error al copiar la contraseña');
  });
}

function eliminarCredencial(id) {
  if (confirm('¿Estás seguro de que deseas eliminar esta credencial?')) {
    // Aquí se podría implementar un DELETE si se necesita
    alert('Función de eliminación aún no implementada');
  }
}
