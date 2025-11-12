document.addEventListener("DOMContentLoaded", () => {
    const botonesVer = document.querySelectorAll(".ver-animated");
    const modal = new bootstrap.Modal(document.getElementById("usuarioModal"));

    botonesVer.forEach(boton => {
        boton.addEventListener("click", () => {
            const fila = boton.closest("tr");
            const celdas = fila.querySelectorAll("td");

            const datos = {
                bajada: celdas[0].textContent.trim(),
                negocio: celdas[1].textContent.trim(),
                descripcion: celdas[2].textContent.trim(),
                prioridad: celdas[3].textContent.trim(),
                esquema: celdas[4].textContent.trim(),
                activar: celdas[5].textContent.trim()
            };

            // Llenamos los campos del modal
            document.getElementById("inputBajada").value = datos.bajada;
            document.getElementById("selectNegocio").value = datos.negocio;
            document.getElementById("textareaScript").value = datos.descripcion; // Aquí luego irá el script real
            document.getElementById("selectEsquema").value = datos.esquema;
            document.getElementById("selectPrioridad").value = datos.prioridad;
            document.getElementById("selectActivar").value = datos.activar;

            modal.show();
        });
    });

    document.getElementById("btnGuardar").addEventListener("click", () => {
        alert("Cambios guardados correctamente");
        modal.hide();
    });
});