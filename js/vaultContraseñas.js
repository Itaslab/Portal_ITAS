// vaultContraseñas.js
// Gestión de la Bóveda de Contraseñas

let modoEdicion = false;
let idCredencialEditando = null;

document.addEventListener('DOMContentLoaded', () => {
  const vaultForm = document.getElementById('vaultForm');
  
  // Verificar si viene de "Modificar"
  const urlParams = new URLSearchParams(window.location.search);
  const sistema = urlParams.get('sistema');
  const usuario = urlParams.get('usuario');
  const id = urlParams.get('id');
  
  if (sistema && usuario && id) {
    modoEdicion = true;
    idCredencialEditando = id;
    
    document.getElementById('formTitle').textContent = 'Modificar Contraseña';
    document.getElementById('sistema').value = sistema;
    document.getElementById('usuario').value = usuario;
    document.getElementById('sistema').readOnly = true;
    document.getElementById('usuario').readOnly = true;
    document.getElementById('contrasena').placeholder = 'Ingresa la nueva contraseña';
    document.getElementById('btnSubmit').textContent = 'Actualizar';
  }
  
  if (vaultForm) {
    vaultForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const sistema = document.getElementById('sistema').value.trim();
      const usuario = document.getElementById('usuario').value.trim();
      const contrasena = document.getElementById('contrasena').value.trim();

      // Validaciones básicas
      if (!sistema || !usuario || !contrasena) {
        alert('Por favor completa todos los campos.');
        return;
      }

      try {
        // Enviar datos al backend
        const res = await fetch(basePath + '/vault/guardar', {
          method: 'POST',
          credentials: 'include', // Enviar cookies de sesión
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sistema,
            usuario,
            contrasena,
            modoEdicion,
            id: idCredencialEditando
          })
        });

        const data = await res.json();

        if (data.success) {
          alert(modoEdicion ? 'Contraseña actualizada correctamente.' : 'Credencial guardada correctamente.');
          
          if (modoEdicion) {
            // Volver a la galería
            window.location.href = '../pages/SeguridadInformatica.html';
          } else {
            // Limpiar el formulario
            vaultForm.reset();
          }
        } else {
          alert('Error: ' + (data.error || 'Error desconocido'));
        }
      } catch (err) {
        alert('Error de conexión con el servidor');
        console.error('Error:', err);
      }
    });
  }
});