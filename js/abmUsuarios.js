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

    // Mostrar resultado
    resultado.textContent = `
      Usuario guardado:
      ${valores.nombre} ${valores.apellido}, Legajo: ${valores.legajo}, Email: ${valores.email},
      Referente: ${valores.referente}, Fecha Nacimiento: ${valores.fecha_nacimiento},
      Empresa: ${valores.empresa}, Alias: ${valores.alias}, Convenio: ${valores.convenio}, Ciudad: ${valores.ciudad}
    `;
    resultado.style.color = 'green';
  });

  btnCancelar.addEventListener('click', () => {
    form.reset();
    resultado.textContent = 'Formulario limpiado.';
    resultado.style.color = 'blue';
  });
});