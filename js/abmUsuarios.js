document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('formUsuario');
    const resultado = document.getElementById('resultado');
    const btnEliminar = document.getElementById('btnEliminar');

    form.addEventListener('submit', function (event) {
        event.preventDefault();

        const nombre = document.getElementById('nombre').value.trim();
        const email = document.getElementById('email').value.trim();
        const rol = document.getElementById('rol').value;

        if (!nombre || !email) {
            resultado.textContent = 'Por favor complete todos los campos.';
            resultado.style.color = 'red';
            return;
        }

        resultado.textContent = `Usuario guardado: ${nombre}, ${email}, Rol: ${rol}`;
        resultado.style.color = 'green';
    });

    btnEliminar.addEventListener('click', function () {
        form.reset();
        resultado.textContent = 'Formulario limpiado.';
        resultado.style.color = 'blue';
    });
});