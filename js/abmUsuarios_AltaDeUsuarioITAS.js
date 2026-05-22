//abmUsuarios_AltaDeUsuarioITAS.js

document.addEventListener("DOMContentLoaded", async () => {

    const selectUsuario = document.getElementById("selectUsuario");
    const emailInput = document.getElementById("email");

    let usuarios = [];

    // =========================
    // CARGAR USUARIOS
    // =========================
    async function cargarUsuarios() {

        try {  

            const response = await fetch(basePath + "/usuarios");

            if (!response.ok) {
                throw new Error("Error al obtener usuarios");
            }

            usuarios = await response.json();

            selectUsuario.innerHTML = `
                <option value="">Seleccione un usuario</option>
            `;

            usuarios.forEach(usuario => {

                const option = document.createElement("option");

                option.value = usuario.ID;
                option.textContent = usuario.NOMBRE;

                selectUsuario.appendChild(option);

            });

        } catch (error) {

            console.error("Error cargando usuarios:", error);
            alert("No se pudieron cargar los usuarios");

        }

    }

    // =========================
    // CAMBIO DE USUARIO
    // =========================
    selectUsuario.addEventListener("change", () => {

        const usuarioSeleccionado = usuarios.find(
            u => u.ID == selectUsuario.value
        );

        if (!usuarioSeleccionado) {

            emailInput.value = "";
            return;

        }

        emailInput.value = usuarioSeleccionado.EMAIL || "";

    });

    // =========================
    // INIT
    // =========================
    cargarUsuarios();

});