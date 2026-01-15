// modificarUsuarioAbm.js

document.addEventListener("DOMContentLoaded", async () => {
  // Llenar el select de referentes al cargar la página
  const referenteSelect = document.getElementById('referente');
  fetch(basePath + '/referentes')
    .then(res => res.json())
    .then(data => {
      if (data.success && Array.isArray(data.referentes)) {
        data.referentes.forEach(ref => {
          const opt = document.createElement('option');
          opt.value = ref.Referente;
          opt.textContent = ref.NombreCompleto ? `${ref.Referente} - ${ref.NombreCompleto}` : ref.Referente;
          referenteSelect.appendChild(opt);
        });
      }
    })
    .catch(err => {
      console.error('Error al cargar referentes:', err);
    });
  // ...sin código de llenado de legajos...
  const selectUsuario = document.getElementById("selectUsuario");
  const btnCargar = document.getElementById("btnCargar");
  const form = document.getElementById("userForm");

  // Helper: validaciones de caracteres "no raros"
  const regexName = /^[A-Za-zÀ-ÖØ-öø-ÿ\s'\-\.]+$/u; // letras, espacios, guiones, apóstrofe, punto
  const regexAlias = /^[A-Za-z0-9À-ÖØ-öø-ÿ\s'\-\.]+$/u; // añade números
  const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // básico

  function validarCamposNoRarosModificar(vals) {
    const errores = [];
    if (vals.apellido && !regexName.test(vals.apellido)) errores.push('apellido');
    if (vals.nombre && !regexName.test(vals.nombre)) errores.push('nombre');
    if (vals.email && !regexEmail.test(vals.email)) errores.push('email');
    if (vals.alias && !regexAlias.test(vals.alias)) errores.push('alias');
    return errores;
  }

  // Crear contenedor para mensajes
  const resultado = document.createElement("div");
  resultado.id = "resultado";
  resultado.className = "mt-3";
  form.appendChild(resultado);

  // Inicializar modal de éxito si existe (Bootstrap debe estar cargado antes)
  let successModal = null;
  const successModalEl = document.getElementById('successModal');
  if (successModalEl && typeof bootstrap !== 'undefined') {
    successModal = new bootstrap.Modal(successModalEl);
  }

  // ---------------------------------------------------------
  // 1️⃣ CARGAR LISTA DE USUARIOS EN EL SELECT
  // ---------------------------------------------------------
  try {
    const res = await fetch(basePath + "/abm_usuarios");
    const data = await res.json();

    if (res.ok && data.usuarios) {
      data.usuarios.forEach((u) => {
        const opt = document.createElement("option");
        opt.value = u.Legajo;
        opt.textContent = `${u.Apellido}, ${u.Nombre}`;
        selectUsuario.appendChild(opt);
      });
    } else {
      resultado.textContent = "No se encontraron usuarios.";
      resultado.style.color = "orange";
    }
  } catch (error) {
    console.error("Error:", error);
    resultado.textContent = "Error cargando usuarios.";
    resultado.style.color = "red";
  }

  // ---------------------------------------------------------
 // ---------------------------------------------------------
// 2️⃣ CARGAR DATOS DEL USUARIO
// ---------------------------------------------------------
btnCargar.addEventListener("click", async () => {
  const legajo = selectUsuario.value;
  if (!legajo) {
    resultado.textContent = "Seleccione un usuario.";
    resultado.style.color = "orange";
    return;
  }

  try {
    // === 1) Cargar datos básicos del usuario ===
    const res = await fetch(basePath + `/abm_usuarios/${legajo}`);
    const data = await res.json();

    if (!res.ok) {
      resultado.textContent = "No se encontró el usuario.";
      resultado.style.color = "red";
      return;
    }

    // Rellenar formulario
    document.getElementById("legajo").value = data.Legajo || "";
    document.getElementById("apellido").value = data.Apellido || "";
    document.getElementById("nombre").value = data.Nombre || "";
    document.getElementById("email").value = data.Email || "";
    document.getElementById("referente").value = data.Referente || "";
    document.getElementById("fecha_nacimiento").value =
      data.Fecha_Nacimiento ? data.Fecha_Nacimiento.split("T")[0] : "";
    document.getElementById("empresa").value = data.Empresa || "";
    document.getElementById("alias").value = data.Alias || "";
    document.getElementById("convenio").value = data.Convenio || "";
    document.getElementById("ciudad").value = data.Ciudad || "";

    // ---------------------------------------------------------
    // 2) Cargar PERMISOS desde SQL (USUARIO_PERFIL_APP)
    // ---------------------------------------------------------
    try {
      // Preferimos usar ID_Usuario cuando esté disponible (devuelto por /abm_usuarios/:legajo)
      const idUsuario = data.ID_Usuario || data.id_usuario || null;
      const permisosRes = await fetch(basePath + `/permisos/${idUsuario || legajo}`);
      const permisosData = await permisosRes.json();

      // Lista de apps asignadas al usuario — manejamos distintos formatos de respuesta
      let appsAsignadas = [];
      if (Array.isArray(permisosData)) {
        // Puede ser un array de objetos { ID_Aplicacion } o un array de números
        if (permisosData.length > 0 && typeof permisosData[0] === 'object') {
          appsAsignadas = permisosData.map(p => p.ID_Aplicacion || p.ID_aplicacion || p.id_aplicacion || p.id);
        } else {
          appsAsignadas = permisosData.map(p => p);
        }
      } else if (permisosData && Array.isArray(permisosData.aplicacionesPermitidas)) {
        appsAsignadas = permisosData.aplicacionesPermitidas;
      } else {
        // Si el backend devolvió un objeto con clave inesperada, intentar extraer números
        // No hacemos nada; appsAsignadas seguirá como []
      }

      // Relación entre checkbox → ID_Aplicacion
      const permisosMap = {
        perm_robot: 3,        // Robot Itas
        perm_appordenes: 2,   // APP Órdenes
        perm_grafana: 5,      // Grafana
        perm_abm: 6           // ABM Usuarios
      };

      // Marcar checkbox según BD
      for (const [checkboxId, appId] of Object.entries(permisosMap)) {
        const cb = document.getElementById(checkboxId);
        if (cb) cb.checked = appsAsignadas.includes(appId);
      }
    } catch (permErr) {
      console.error("Error obteniendo permisos:", permErr);
    }

    resultado.textContent = "Datos cargados correctamente.";
    resultado.style.color = "green";

  } catch (error) {
    console.error("Error:", error);
    resultado.textContent = "Error cargando usuario.";
    resultado.style.color = "red";
  }
});


  // ---------------------------------------------------------
  // 3️⃣ GUARDAR CAMBIOS (PUT)
  // ---------------------------------------------------------
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const legajo = document.getElementById("legajo").value;
    const email = document.getElementById("email").value;
    if (!legajo) {
      resultado.textContent = "Debe seleccionar un usuario.";
      resultado.style.color = "orange";
      return;
    }

    // Validación de caracteres no permitidos antes de enviar
    const valoresAV = {
      apellido: document.getElementById("apellido").value.trim(),
      nombre: document.getElementById("nombre").value.trim(),
      email: document.getElementById("email").value.trim(),
      alias: document.getElementById("alias").value.trim(),
    };
    const camposInvalidos = validarCamposNoRarosModificar(valoresAV);
    if (camposInvalidos.length > 0) {
      resultado.textContent = `Campos con caracteres no permitidos: ${camposInvalidos.join(', ')}`;
      resultado.style.color = 'red';
      return;
    }

    // Sanitiza vacíos -> null
    const clean = (v) => (v && v.trim() !== "" ? v.trim() : null);

    // Validar legajo/email únicos (excepto el usuario actual)
    try {
      const resVerif = await fetch(basePath + `/verificar_legajo_email?legajo=${encodeURIComponent(legajo)}&email=${encodeURIComponent(email)}&actual=${encodeURIComponent(selectUsuario.value)}`);
      const dataVerif = await resVerif.json();
      if (dataVerif.success && dataVerif.existe) {
        resultado.textContent = "El legajo o email ya existen en otro usuario.";
        resultado.style.color = "red";
        return;
      }
    } catch (err) {
      resultado.textContent = "No se pudo validar legajo/email.";
      resultado.style.color = "red";
      return;
    }

    const body = {
      Apellido: clean(document.getElementById("apellido").value),
      Nombre: clean(document.getElementById("nombre").value),
      Alias: clean(document.getElementById("alias").value),
      Email: clean(document.getElementById("email").value),
      Referente: clean(document.getElementById("referente").value),
      Fecha_Nacimiento: document.getElementById("fecha_nacimiento").value || null,
      Empresa: clean(document.getElementById("empresa").value),
      Convenio: clean(document.getElementById("convenio").value),
      Ciudad: clean(document.getElementById("ciudad").value),
      // Permisos (front)
      Perm_Robot: !!document.getElementById('perm_robot')?.checked,
      Perm_AppOrdenes: !!document.getElementById('perm_appordenes')?.checked,
      Perm_Grafana: !!document.getElementById('perm_grafana')?.checked,
      Perm_ABMUsuarios: !!document.getElementById('perm_abm')?.checked,
    };

    try {
      const res = await fetch(basePath + `/abm_usuarios/${legajo}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        // Mostrar popup y limpiar mensaje
        if (successModal) {
          const modalBodyEl = document.getElementById('successModalBody');
          const nombre = document.getElementById('nombre')?.value || '';
          const apellido = document.getElementById('apellido')?.value || '';
          if (modalBodyEl) modalBodyEl.textContent = `Se actualizó usuario: ${apellido}, ${nombre}`;
          successModal.show();
        } else {
          alert('Se actualizó usuario');
        }
        resultado.textContent = '';
        resultado.style.color = "green";
      } else {
        resultado.textContent = data.mensaje || "Error al actualizar.";
        resultado.style.color = "red";
      }
    } catch (error) {
      console.error(error);
      resultado.textContent = "Error de conexión.";
      resultado.style.color = "red";
    }
  });
});
