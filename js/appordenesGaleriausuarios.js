// appordenesGaleriausuarios.js

document.addEventListener("DOMContentLoaded", async () => {
  const filtroGrupo = document.getElementById("filtroGrupo");
  const filtroNombre = document.getElementById("filtroNombre");
  const filtroActivo = document.getElementById("filtroActivo");
  const tabla = document.querySelector("table tbody");


// 🔹 Modal elementos
const modal = document.getElementById("usuarioModal"); // <-- nombre correcto
const modalBody = modal.querySelector(".modal-body");
const modalClose = modal.querySelector(".btn-close"); // <-- en tu HTML el botón usa esta clase


  // Cerrar modal
  modalClose.addEventListener("click", () => {
    modal.style.display = "none";
  });
  window.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });

  // 🔹 Cargar usuarios al iniciar
  let usuarios = [];
  await cargarUsuarios();

  // 🔹 Función para cargar todos los usuarios
  async function cargarUsuarios() {
    try {
      const resp = await fetch("/usuarios");
      const data = await resp.json();

      if (!data.success) throw new Error(data.error || "Error al cargar usuarios");
      usuarios = data.usuarios;
      renderTabla(usuarios);
    } catch (err) {
      console.error("Error de conexión al backend:", err);
      tabla.innerHTML = `<tr><td colspan="8">Error al cargar datos</td></tr>`;
    }
  }

  // 🔹 Renderizar tabla
  function renderTabla(lista) {
    tabla.innerHTML = "";

    lista.forEach((u) => {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td class="nombre-cell">${u.nombre}</td>
        <td>${u.grupo || ""}</td>
        <td>${u.grupo2 || ""}</td>
        <td>${u.modo || ""}</td>
        <td>${u.max || ""}</td>
        <td>${u.desde || ""} - ${u.hasta || ""}</td>
        <td>${u.activo ? "✅" : "❌"}</td>
        <td>
          <select class="asignar-select">
            <option value="Asignar" ${u.asignar === "Asignar" ? "selected" : ""}>Asignar</option>
            <option value="No Asignar" ${u.asignar === "No Asignar" ? "selected" : ""}>No Asignar</option>
            <option value="Automático" ${u.asignar === "Automático" ? "selected" : ""}>Automático</option>
          </select>
        </td>
      `;

      // 🔸 Click en el nombre → abrir modal
      row.querySelector(".nombre-cell").addEventListener("click", () => {
        abrirModal(u.id_usuario);
      });

      // 🔸 Evento cambio en dropdown Asignar
      const select = row.querySelector(".asignar-select");
      select.addEventListener("change", async (e) => {
        const nuevoValor = e.target.value;

        try {
          const resp = await fetch(`/usuarios/${u.id_usuario}/asignar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ asignar: nuevoValor }),
          });

          const data = await resp.json();
          if (!data.success) throw new Error(data.error || "Error al actualizar Asignar");

          console.log(`✅ Usuario ${u.nombre}: Asignar actualizado a "${nuevoValor}"`);
        } catch (err) {
          console.error("Error al actualizar Asignar:", err);
          alert("No se pudo actualizar el campo Asignar.");
        }
      });

      tabla.appendChild(row);
    });
  }

  // 🔹 Filtrado en tiempo real
  [filtroGrupo, filtroNombre, filtroActivo].forEach((input) => {
    input.addEventListener("input", aplicarFiltros);
  });

  function aplicarFiltros() {
    const grupo = filtroGrupo.value.toLowerCase();
    const nombre = filtroNombre.value.toLowerCase();
    const activo = filtroActivo.checked;

    const filtrados = usuarios.filter((u) => {
      const matchGrupo =
        grupo === "" || (u.grupo && u.grupo.toLowerCase().includes(grupo));
      const matchNombre =
        nombre === "" || (u.nombre && u.nombre.toLowerCase().includes(nombre));
      const matchActivo = !activo || u.activo === true;
      return matchGrupo && matchNombre && matchActivo;
    });

    renderTabla(filtrados);
  }

  // 🔹 Modal - Cargar datos detallados del usuario
  async function abrirModal(id_usuario) {
    try {
      const resp = await fetch(`/usuarios/${id_usuario}`);
      const data = await resp.json();

      if (!data.success) throw new Error(data.error || "Error al obtener detalle del usuario");

      const u = data.usuario;
      modalBody.innerHTML = `
        <p><strong>Nombre:</strong> ${u.nombre}</p>
        <p><strong>Email:</strong> ${u.email || "-"}</p>
        <p><strong>Referente:</strong> ${u.referente || "-"}</p>
        <p><strong>SF_UserID:</strong> ${u.sf_user_id || "-"}</p>
        <p><strong>Horario:</strong> ${u.horario || "-"}</p>
        <p><strong>Grupo:</strong> ${u.grupo || "-"}</p>
        <p><strong>Grupo2:</strong> ${u.grupo2 || "-"}</p>
        <p><strong>Modo:</strong> ${u.modo || "-"}</p>
        <p><strong>Max. por trabajar:</strong> ${u.max || "-"}</p>
        <p><strong>Forma:</strong> ${u.forma || "-"}</p>
        <p><strong>Desasignador:</strong> ${u.desasignador || "-"}</p>
        <p><strong>Script:</strong> ${u.script || "-"}</p>
        <p><strong>Activo:</strong> ${u.activo ? "✅" : "❌"}</p>
      `;

      modal.style.display = "block";
    } catch (err) {
      console.error("Error al cargar detalle del usuario:", err);
      alert("No se pudo abrir el detalle del usuario.");
    }
  }
});
