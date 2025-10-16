document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('userForm');
  const resultado = document.createElement('div');
  resultado.id = 'resultado';
  resultado.className = 'mt-3';
  form.appendChild(resultado);

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

    // Validar que la fecha de nacimiento no sea futura
    const fechaIngresada = new Date(valores.fecha_nacimiento);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (fechaIngresada > hoy) {
      resultado.textContent = 'La fecha de nacimiento no puede ser futura.';
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
          Ciudad: valores.ciudad
        })
      });

      const data = await res.json();

      if (res.status === 201) {
        // Usuario registrado correctamente
        resultado.textContent = `Usuario registrado correctamente: ${valores.nombre} ${valores.apellido}`;
        resultado.style.color = 'green';
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
