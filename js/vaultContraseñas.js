// vaultContraseñas.js
// Gestión de la Bóveda de Contraseñas

document.addEventListener('DOMContentLoaded', () => {
  const vaultForm = document.getElementById('vaultForm');
  
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
            contrasena
          })
        });

        const data = await res.json();

        if (data.success) {
          alert('Credencial guardada correctamente.');
          vaultForm.reset(); // Limpiar el formulario
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