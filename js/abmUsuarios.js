document.addEventListener('DOMContentLoaded', () => {
  // Llenar el select de referentes al cargar la página
  const referenteSelect = document.getElementById('referente');
  fetch('/referentes')
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
  // Asegurar que la fecha de nacimiento no permita fechas posteriores a hoy y que el usuario tenga al menos 18 años
  const fechaInput = document.getElementById('fecha_nacimiento');
  if (fechaInput) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const minEdad = new Date(hoy);
    minEdad.setFullYear(minEdad.getFullYear() - 18);
    // El valor máximo permitido para el input date será la fecha límite para tener 18 años
    const yyyy = minEdad.getFullYear();
    const mm = String(minEdad.getMonth() + 1).padStart(2, '0');
    const dd = String(minEdad.getDate()).padStart(2, '0');
    fechaInput.max = `${yyyy}-${mm}-${dd}`;
  }

  // Helper: validaciones de caracteres "no raros"
  const regexName = /^[A-Za-zÀ-ÖØ-öø-ÿ\s'\-\.]+$/u; // letras, espacios, guiones, apóstrofe, punto
  const regexAlias = /^[A-Za-z0-9À-ÖØ-öø-ÿ\s'\-\.]+$/u; // añade números
  const regexLegajo = /^\d+$/; // solo dígitos
  const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // básico

  function validarCamposNoRaros(vals) {
    const errores = [];
    if (!regexLegajo.test(vals.legajo)) errores.push('legajo');
    if (!regexName.test(vals.apellido)) errores.push('apellido');
    if (!regexName.test(vals.nombre)) errores.push('nombre');
    if (!regexEmail.test(vals.email)) errores.push('email');
    if (vals.alias && !regexAlias.test(vals.alias)) errores.push('alias');
    return errores;
  }
  const form = document.getElementById('userForm');
  const resultado = document.createElement('div');
  resultado.id = 'resultado';
  resultado.className = 'mt-3';
  form.appendChild(resultado);

  // Inicializar modal de éxito si existe (Bootstrap debe estar cargado antes)
  let successModal = null;
  const successModalEl = document.getElementById('successModal');
  if (successModalEl && typeof bootstrap !== 'undefined') {
    successModal = new bootstrap.Modal(successModalEl);
  }

  const btnCancelar = form.querySelector('button[type="reset"]');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Lista de campos requeridos
    const campos = [
      'legajo', 'apellido', 'nombre', 'email', 'referente',
      'fecha_nacimiento', 'empresa', 'alias', 'convenio', 'ciudad'
    ];

    const valores = {};
    let camposVacios = [];

    // Obtener y validar campos
    campos.forEach(id => {
      const valor = document.getElementById(id)?.value.trim();
      valores[id] = valor;
      if (!valor) camposVacios.push(id);
    });

    if (camposVacios.length > 0) {
      resultado.textContent = `Por favor complete todos los campos: ${camposVacios.join(', ')}`;
      resultado.style.color = 'red';
      return;
    }

    // Validar caracteres no permitidos
    const invalidos = validarCamposNoRaros(valores);
    if (invalidos.length > 0) {
      resultado.textContent = `Campos con caracteres no permitidos: ${invalidos.join(', ')}`;
      resultado.style.color = 'red';
      return;
    }

    // Validar que la fecha de nacimiento no sea futura y que el usuario tenga al menos 18 años
    const fechaIngresada = new Date(valores.fecha_nacimiento);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (isNaN(fechaIngresada.getTime())) {
      resultado.textContent = 'Fecha de nacimiento inválida.';
      resultado.style.color = 'red';
      return;
    }

    if (fechaIngresada > hoy) {
      resultado.textContent = 'La fecha de nacimiento no puede ser futura.';
      resultado.style.color = 'red';
      return;
    }

    const limite18 = new Date(hoy);
    limite18.setFullYear(limite18.getFullYear() - 18);
    if (fechaIngresada > limite18) {
      const yyyy = limite18.getFullYear();
      const mm = String(limite18.getMonth() + 1).padStart(2, '0');
      const dd = String(limite18.getDate()).padStart(2, '0');
      resultado.textContent = `El usuario debe tener al menos 18 años. Fecha máxima permitida: ${yyyy}-${mm}-${dd}`;
      resultado.style.color = 'red';
      return;
    }

    // -------------------- ENVIAR AL BACKEND --------------------
    try {
      const res = await fetch('/registrar_usuario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Apellido: valores.apellido,
          Nombre: valores.nombre,
          Alias: valores.alias,
          Legajo: valores.legajo,
          Email: valores.email,
          Referente: valores.referente,
          Fecha_Nacimiento: valores.fecha_nacimiento,
          Empresa: valores.empresa,
          Convenio: valores.convenio,
          Ciudad: valores.ciudad,
          // Permisos (front)
          Perm_Robot: !!document.getElementById('perm_robot')?.checked,
          Perm_AppOrdenes: !!document.getElementById('perm_appordenes')?.checked,
          Perm_Grafana: !!document.getElementById('perm_grafana')?.checked,
          Perm_ABMUsuarios: !!document.getElementById('perm_abm')?.checked
        })
      });

      const data = await res.json();

      if (res.status === 201) {
        // Usuario registrado correctamente
        if (successModal) {
          const body = document.getElementById('successModalBody');
          if (body) body.textContent = `Se creó usuario: ${valores.nombre} ${valores.apellido}`;
          successModal.show();
        } else {
          alert('Se creó usuario');
        }
        resultado.textContent = '';
        form.reset();
      } else if (res.status === 409) {
        // Usuario ya existe
        resultado.textContent = data.mensaje || 'El usuario ya existe';
        resultado.style.color = 'orange';
      } else {
        // Otro error
        resultado.textContent = data.mensaje || 'Error al registrar usuario';
        resultado.style.color = 'red';
      }

    } catch (error) {
      console.error('Error en la conexión con el servidor:', error);
      resultado.textContent = 'Error de conexión con el servidor';
      resultado.style.color = 'red';
    }
    // -------------------------------------------------------------
  });

  btnCancelar.addEventListener('click', () => {
    form.reset();
    resultado.textContent = 'Formulario limpiado.';
    resultado.style.color = 'blue';
  });
});
