document.addEventListener("DOMContentLoaded", async () => {
  const filtroGrupo = document.getElementById("filtroGrupo");
  const filtroNombre = document.getElementById("filtroNombre");
  const filtroActivo = document.getElementById("filtroActivo");
  const tabla = document.querySelector("table tbody");

  // ✅ Cargar datos desde el backend
  let usuarios = [];
  try {
    const res = await fetch("/usuarios");
    const data = await res.json();
    if (data.success) {
      usuarios = data.usuarios;
      renderTabla(usuarios);
    } else {
      console.error("Error al cargar usuarios:", data.error);
    }
  } catch (err) {
    console.error("Error de conexión al backend:", err);
  }

  // 🧾 Renderizar tabla
function renderTabla(data) {
  tabla.innerHTML = "";
  data.forEach(u => {
    const row = document.createElement("tr");

    // Generar el dropdown según el valor de Asignar
    const asignarValor = (u.asignar || "").toLowerCase();
    const opciones = `
      <select class="form-select form-select-sm asignar-select">
        <option value="asignar" ${asignarValor === "asignar" ? "selected" : ""}>Asignar</option>
        <option value="no-asignar" ${asignarValor === "no-asignar" ? "selected" : ""}>No Asignar</option>
        <option value="automatico" ${asignarValor === "automatico" ? "selected" : ""}>Automático</option>
      </select>
    `;

    row.innerHTML = `
      <td>${u.nombre}</td>
      <td>${u.grupo || ""}</td>
      <td>${u.grupo2 || ""}</td>
      <td>${u.modo || ""}</td>
      <td>${u.max || ""}</td>
      <td>${u.desde || ""}</td>
      <td>${u.hasta || ""}</td>
      <td class="${u.activo === 1 ? "text-success fw-bold" : "text-danger fw-bold"}">
        ${u.activo === 1 ? "Activo" : "Inactivo"}
      </td>
      <td>${opciones}</td>
      <td><button class="btn btn-secondary btn-sm ver-animated">Ver</button></td>
    `;

    // ✅ Evento para detectar cambio en el dropdown
    row.querySelector(".asignar-select").addEventListener("change", async (e) => {
      const nuevoValor = e.target.value;
      console.log(`Usuario ${u.nombre} cambió Asignar a:`, nuevoValor);

      // (opcional) Actualizá en backend:
      try {
        await fetch("/usuarios/asignar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sf_user_id: u.sf_user_id, // o ID de usuario si tenés
            asignar: nuevoValor
          })
        });
      } catch (error) {
        console.error("Error al actualizar Asignar:", error);
      }
    });

    tabla.appendChild(row);
  });
}


  // 🔍 Filtros
  function filtrarTabla() {
    const grupo = filtroGrupo.value.toLowerCase();
    const nombre = filtroNombre.value.toLowerCase();
    const activo = filtroActivo.value.toLowerCase();

    const filtrados = usuarios.filter(u => {
      const g = u.grupo?.toLowerCase() || "";
      const n = u.nombre?.toLowerCase() || "";
      const a = (u.activo === 1 ? "activo" : "inactivo");
      return (
        (grupo === "" || g.includes(grupo)) &&
        (nombre === "" || n.includes(nombre)) &&
        (activo === "" || a.includes(activo))
      );
    });
    renderTabla(filtrados);
  }

  filtroGrupo.addEventListener("change", filtrarTabla);
  filtroNombre.addEventListener("input", filtrarTabla);
  filtroActivo.addEventListener("change", filtrarTabla);

  // 👁 Modal de usuario
  tabla.addEventListener("click", (e) => {
    if (e.target && e.target.textContent.trim() === "Ver") {
      const row = e.target.closest("tr");
      const nombre = row.cells[0].textContent.trim();
      const usuario = usuarios.find(u => u.nombre === nombre);
      if (!usuario) return;

      document.getElementById("modalNombre").textContent = usuario.nombre;
      document.getElementById("modalEmail").textContent = usuario.email || "";
      document.getElementById("modalSfID").textContent = usuario.sf_user_id || "";
      document.getElementById("modalDesde").textContent = usuario.desde || "";
      document.getElementById("modalHasta").textContent = usuario.hasta || "";
      document.getElementById("modalReferente").textContent = usuario.referente || "";
      document.getElementById("modalActivo").textContent = usuario.activo === 1 ? "Activo" : "Inactivo";
      document.getElementById("modalGrupoEditable").value = usuario.grupo || "";
      document.getElementById("modalGrupoBKPEditable").value = usuario.grupo_bkp || "";
      document.getElementById("modalCantidad").value = usuario.max || "";
      document.getElementById("modalFormaEditable").value = "desc";
      document.getElementById("modalModoEditable").value =
        usuario.modo?.toLowerCase().includes("auto") ? "automatico" : "manual";
      document.getElementById("modalDesasignador").checked = false;
      document.getElementById("modalScript").value = "";

      const modal = new bootstrap.Modal(document.getElementById("usuarioModal"));
      modal.show();
    }
  });

  // 💾 Guardar (solo loguea por ahora)
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

    console.log("💾 Datos guardados:", { nombre, grupo, grupoBKP, cantidad, forma, modo, desasignador, script });

    const modal = bootstrap.Modal.getInstance(document.getElementById("usuarioModal"));
    modal.hide();
  });
});

// ✅ Validaciones
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

// ✅ Poblado de selects
const grupos = [
  "ORDEN-POSVENTA_A", "ORDEN-POSVENTA_B", "ORDEN-REJECTED",
  "INC-NPLAY_ACTIVACIONES", "INC-FAN_POSVENTA", "INC-FAN_VENTA",
  "INC-NPLAY_POSVENTA", "INC-FACOBMOR", "Mesa 1", "Mesa 3", "Mesa 4", "PM", "LEGADO"
];

function populateSelect(id) {
  const select = document.getElementById(id);
  select.innerHTML = "";
  grupos.forEach(grupo => {
    const option = document.createElement("option");
    option.value = grupo;
    option.textContent = grupo;
    select.appendChild(option);
  });
}

populateSelect("modalGrupoEditable");
populateSelect("modalGrupoBKPEditable");
