document.addEventListener("DOMContentLoaded", () => {
    const filtroGrupo = document.getElementById("filtroGrupo");
    const filtroNombre = document.getElementById("filtroNombre");
    const filtroActivo = document.getElementById("filtroActivo");
    const tabla = document.querySelector("table tbody");

    // 🔍 Función para filtrar las filas
    function filtrarTabla() {
        const grupo = filtroGrupo.value.toLowerCase();
        const nombre = filtroNombre.value.toLowerCase();
        const activo = filtroActivo.value.toLowerCase();

        Array.from(tabla.rows).forEach(row => {
            const usuario = row.cells[0].textContent.toLowerCase();
            const rowGrupo = row.cells[1].textContent.toLowerCase();
            const rowActivo = row.cells[7].textContent.toLowerCase();

            const mostrar =
                (grupo === "" || rowGrupo.includes(grupo)) &&
                (nombre === "" || usuario.includes(nombre)) &&
                (activo === "" || rowActivo.includes(activo));

            row.style.display = mostrar ? "" : "none";
        });
    }

    // 🎛 Eventos de filtros
    filtroGrupo.addEventListener("change", filtrarTabla);
    filtroNombre.addEventListener("input", filtrarTabla);
    filtroActivo.addEventListener("change", filtrarTabla);

    // 👁 Evento para los botones "Ver"
    tabla.addEventListener("click", (e) => {
        if (e.target && e.target.textContent.trim() === "Ver") {
            const row = e.target.closest("tr");

            // 🧩 Datos del usuario desde la tabla
            const nombre = row.cells[0].textContent.trim();
            const grupo = row.cells[1].textContent.trim();
            const grupoBKP = row.cells[2].textContent.trim();
            const modo = row.cells[3].textContent.trim();
            const max = row.cells[4].textContent.trim();
            const desde = row.cells[5].textContent.trim();
            const hasta = row.cells[6].textContent.trim();
            const activo = row.cells[7].textContent.trim();

            // 📋 Asignar datos al modal
            document.getElementById("modalNombre").textContent = nombre;
            document.getElementById("modalEmail").textContent = nombre.toLowerCase().replace(" ", ".") + "@empresa.com"; // Ejemplo temporal
            document.getElementById("modalSfID").textContent = "SF-" + Math.floor(Math.random() * 10000); // Ejemplo temporal
            document.getElementById("modalDesde").textContent = desde;
            document.getElementById("modalHasta").textContent = hasta;
            document.getElementById("modalReferente").textContent = "Referente Ejemplo"; // Ejemplo temporal
            document.getElementById("modalActivo").textContent = activo;

            // Lado derecho editable
            document.getElementById("modalGrupoEditable").value = grupo;
            document.getElementById("modalGrupoBKPEditable").value = grupoBKP;
            document.getElementById("modalCantidad").value = max;
            document.getElementById("modalFormaEditable").value = "desc";
            document.getElementById("modalModoEditable").value = modo.toLowerCase().includes("auto") ? "automatico" : "manual";
            document.getElementById("modalDesasignador").checked = false;
            document.getElementById("modalScript").value = "";

            // 🪄 Abrir el modal
            const usuarioModal = new bootstrap.Modal(document.getElementById('usuarioModal'));
            usuarioModal.show();
        }
    });

    // 💾 Evento para el botón "Guardar" dentro del modal
    document.querySelector("#usuarioModal .btn-primary").addEventListener("click", () => {
    if (!validarCampos()) return;
        const nombre = document.getElementById("modalNombre").textContent;
        const grupo = document.getElementById("modalGrupoEditable").value;
        const grupoBKP = document.getElementById("modalGrupoBKPEditable").value;
        const cantidad = document.getElementById("modalCantidad").value;
        const forma = document.getElementById("modalFormaEditable").value;
        const modo = document.getElementById("modalModoEditable").value;
        const desasignador = document.getElementById("modalDesasignador").checked;
        const script = document.getElementById("modalScript").value;

        console.log("💾 Datos guardados:");
        console.log({
            nombre,
            grupo,
            grupoBKP,
            cantidad,
            forma,
            modo,
            desasignador,
            script
        });


        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('usuarioModal'));
        modal.hide();
    });
});

// ✅ Validaciones antes de guardar
function validarCampos() {
    const cantidad = document.getElementById("modalCantidad").value;
    const script = document.getElementById("modalScript").value;
    const modo = document.getElementById("modalModoEditable").value;

    if (isNaN(cantidad) || cantidad <= 0) {
        alert("⚠️ La cantidad debe ser un número positivo.");
        return false;
    }
    if (modo === "automatico" && script.trim() === "") {
        alert("⚠️ Debes ingresar un script para el modo automático.");
        return false;
    }
    return true;
}
document.addEventListener("DOMContentLoaded", () => {
    const estadoSpan = document.getElementById("modalActivo");
    if (estadoSpan) {
        const estado = estadoSpan.textContent.trim().toLowerCase();
        if (estado === "activo") {
            estadoSpan.classList.add("bg-success", "text-white", "px-2", "py-1", "rounded", "shadow");
        } else if (estado === "inactivo") {
            estadoSpan.classList.add("bg-danger", "text-white", "px-2", "py-1", "rounded", "shadow");
        }
    }
});
const grupos = [
  "ORDEN-POSVENTA_A", "ORDEN-POSVENTA_B", "ORDEN-REJECTED",
  "INC-NPLAY_ACTIVACIONES", "INC-FAN_POSVENTA", "INC-FAN_VENTA",
  "INC-NPLAY_POSVENTA", "INC-FACOBMOR", "Mesa 1", "Mesa 3",
  "Mesa 4", "PM", "LEGADO"
];

function populateSelect(id) {
  const select = document.getElementById(id);
  grupos.forEach(grupo => {
    const option = document.createElement("option");
    option.value = grupo;
    option.textContent = grupo;
    select.appendChild(option);
  });
}

populateSelect("modalGrupoEditable");
populateSelect("modalGrupoBKPEditable");