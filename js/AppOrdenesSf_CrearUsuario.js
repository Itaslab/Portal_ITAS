// AppOrdenesSf_CrearUsuario.js

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("entidadForm");
  const resultado = document.getElementById("resultado");
  const usuarioBaseSelect = document.getElementById("usuarioBase");
  const nombreInput = document.getElementById("nombre");
  const apellidoInput = document.getElementById("apellido");

  // Llenar el select de usuarios base
  fetch(basePath + "/usuarios_base")
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

  // Salto rápido por letra en el select: al presionar una letra va al siguiente apellido que empieza con esa letra
  usuarioBaseSelect.addEventListener('keydown', function(e) {
    const key = e.key;
    if (!key || key.length !== 1) return; // no es una letra simple
    const ch = key.toUpperCase();
    if (ch < 'A' || ch > 'Z') return;
    e.preventDefault();
    const options = Array.from(usuarioBaseSelect.options);
    const start = usuarioBaseSelect.selectedIndex >= 0 ? usuarioBaseSelect.selectedIndex + 1 : 0;
    // buscar desde start hasta final, luego desde 0 hasta start-1
    let foundIndex = -1;
    for (let i = start; i < options.length; i++) {
      const opt = options[i];
      const apellido = (opt.dataset.apellido || '').toUpperCase();
      if (apellido.startsWith(ch)) { foundIndex = i; break; }
    }
    if (foundIndex === -1) {
      for (let i = 0; i < start; i++) {
        const opt = options[i];
        const apellido = (opt.dataset.apellido || '').toUpperCase();
        if (apellido.startsWith(ch)) { foundIndex = i; break; }
      }
    }
    if (foundIndex !== -1) {
      usuarioBaseSelect.selectedIndex = foundIndex;
      usuarioBaseSelect.dispatchEvent(new Event('change'));
    }
  });

  // Referencias a nuevos campos
  const sfUserIdInput = document.getElementById('sfUserId');
  const formaSelect = document.getElementById('forma');
  const modoSelect = document.getElementById('modo');
  const scriptTextarea = document.getElementById('scriptText');

  // Habilitar/deshabilitar textarea según Modo
  function updateScriptState() {
    const modoVal = modoSelect.value;
    if (modoVal === 'SCRIPT') {
      scriptTextarea.disabled = false;
      scriptTextarea.classList.remove('bg-light');
      scriptTextarea.required = true;
    } else {
      scriptTextarea.disabled = true;
      scriptTextarea.value = '';
      scriptTextarea.classList.add('bg-light');
      scriptTextarea.required = false;
    }
  }

  modoSelect.addEventListener('change', updateScriptState);
  // Inicializar estado
  updateScriptState();

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
    if (!nombre || !apellido || !grupo || !modo || !horaDe || !horaA) {
      resultado.innerHTML = `<div class="alert alert-warning">Por favor complete todos los campos obligatorios (Grupo BKP es opcional).</div>`;
      return;
    }

    // Si modo = SCRIPT, script es obligatorio
    const scriptVal = scriptTextarea.value.trim();
    if (modo === 'SCRIPT' && !scriptVal) {
      resultado.innerHTML = `<div class="alert alert-warning">Modo SCRIPT requiere que ingrese el script.</div>`;
      return;
    }

    // Asegurar MaxPorTrabajar como entero y ≤ 99
    let maxInt = parseInt(Max_Por_Trabajar, 10);
    if (isNaN(maxInt) || maxInt < 0) maxInt = 0;
    if (maxInt > 99) {
      maxInt = 99;
      // reflejar en el input
      document.getElementById("maxPorTrabajar").value = maxInt;
      resultado.innerHTML = `<div class="alert alert-warning">Max por trabajar ajustado a 99.</div>`;
    }

    // Crear objeto para enviar al backend
    const nuevaEntidad = {
      Nombre: nombre,
      Apellido: apellido,
      UsuarioBase: usuarioBase,
      Grupo: grupo,
      Grupo_BKP: grupo2 || null,
      Modo: modo,
      MaxPorTrabajar: maxInt,
      HoraDe: horaDe,
      HoraA: horaA,
      SF_UserID: sfUserIdInput?.value?.trim() || null,
      Asc_desc: formaSelect?.value || null,
      Script: scriptVal || null
    };

    try {
      // Petición al backend
      const response = await fetch(basePath + "/usuariosordenes", { 
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
