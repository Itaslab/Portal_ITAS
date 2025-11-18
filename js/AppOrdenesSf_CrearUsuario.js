// AppOrdenesSf_CrearUsuario.js

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("entidadForm");
  const resultado = document.getElementById("resultado");
  const usuarioBaseSelect = document.getElementById("usuarioBase");
  const nombreInput = document.getElementById("nombre");
  const apellidoInput = document.getElementById("apellido");

  // Llenar el select de usuarios base
  fetch("/usuarios_base")
    .then(res => res.json())
    .then(data => {
      if (data.success && Array.isArray(data.usuarios)) {
        data.usuarios.forEach(u => {
          const opt = document.createElement("option");
          opt.value = u.Legajo;
          opt.textContent = `${u.Legajo} - ${u.Apellido}, ${u.Nombre}`;
          opt.dataset.nombre = u.Nombre;
          opt.dataset.apellido = u.Apellido;
          usuarioBaseSelect.appendChild(opt);
        });
      }
    });

  // Al seleccionar usuario base, autocompletar nombre y apellido
  usuarioBaseSelect.addEventListener("change", function() {
    const selected = usuarioBaseSelect.options[usuarioBaseSelect.selectedIndex];
    nombreInput.value = selected.dataset.nombre || "";
    apellidoInput.value = selected.dataset.apellido || "";
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Validar selección de usuario base
    const usuarioBase = usuarioBaseSelect.value;
    if (!usuarioBase) {
      resultado.innerHTML = `<div class="alert alert-warning">Debe seleccionar un usuario base.</div>`;
      return;
    }

    // Obtener valores del formulario
    const nombre = nombreInput.value.trim();
    const apellido = apellidoInput.value.trim();
    const grupo = document.getElementById("grupo").value;
    const grupo2 = document.getElementById("grupoBkp").value;
    const modo = document.getElementById("modo").value;
    const Max_Por_Trabajar = document.getElementById("maxPorTrabajar").value;
    const horaDe = document.getElementById("horaDe").value;
    const horaA = document.getElementById("horaA").value;

    // Validación básica
    if (!nombre || !apellido || !grupo || !grupo2 || !modo || !horaDe || !horaA) {
      resultado.innerHTML = `<div class="alert alert-warning">Por favor complete todos los campos obligatorios.</div>`;
      return;
    }

    // Crear objeto para enviar al backend
    const nuevaEntidad = {
      Nombre: nombre,
      Apellido: apellido,
      Grupo: grupo,
      Grupo_BKP: grupo2,
      Modo: modo,
      MaxPorTrabajar: parseInt(Max_Por_Trabajar),
      HoraDe: horaDe,
      HoraA: horaA
    };

    try {
      // Petición al backend
      const response = await fetch("/usuariosordenes", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevaEntidad)
      });

      const data = await response.json();

      if (response.ok) {
        resultado.innerHTML = `<div class="alert alert-success">${data.mensaje || "Entidad creada correctamente."}</div>`;
        form.reset();
        nombreInput.value = "";
        apellidoInput.value = "";
      } else {
        resultado.innerHTML = `<div class="alert alert-danger">Error: ${data.mensaje || "No se pudo guardar."}</div>`;
      }
    } catch (error) {
      console.error("Error al guardar:", error);
      resultado.innerHTML = `<div class="alert alert-danger">Error al conectar con el servidor.</div>`;
    }
  });
});
