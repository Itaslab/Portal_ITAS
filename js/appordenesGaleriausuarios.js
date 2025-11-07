// appordenesGaleriausuarios.js (reemplazar archivo completo)

document.addEventListener("DOMContentLoaded", async () => {
  const filtroGrupo = document.getElementById("filtroGrupo");
  const filtroNombre = document.getElementById("filtroNombre");
  const filtroActivo = document.getElementById("filtroActivo");
  const tabla = document.querySelector("table tbody");

  // Modal Bootstrap
  const usuarioModalEl = document.getElementById("usuarioModal");
  const bsModal = new bootstrap.Modal(usuarioModalEl, { backdrop: true });
  // Referencias dentro del modal (usamos los spans que ya tenés en el HTML)
  const spanNombre = document.getElementById("modalNombre");
  const spanEmail = document.getElementById("modalEmail");
  const spanSfID = document.getElementById("modalSfID");
  const spanDesde = document.getElementById("modalDesde");
  const spanHasta = document.getElementById("modalHasta");
  const spanReferente = document.getElementById("modalReferente");
  const spanActivo = document.getElementById("modalActivo");
  const selectGrupoEditable = document.getElementById("modalGrupoEditable");
  const selectGrupoBKPEditable = document.getElementById("modalGrupoBKPEditable");
  const inputCantidad = document.getElementById("modalCantidad");
  const selectForma = document.getElementById("modalFormaEditable");
  const selectModo = document.getElementById("modalModoEditable");
  const checkboxDesasignador = document.getElementById("modalDesasignador");
  const textareaScript = document.getElementById("modalScript");

  // cargar selects del modal (si ya lo haces en otro lado podés omitir)
  const grupos = [
    "ORDEN-POSVENTA_A", "ORDEN-POSVENTA_B", "ORDEN-REJECTED",
    "INC-NPLAY_ACTIVACIONES", "INC-FAN_POSVENTA", "INC-FAN_VENTA",
    "INC-NPLAY_POSVENTA", "INC-FACOBMOR", "Mesa 1", "Mesa 3", "Mesa 4", "PM", "LEGADO"
  ];
  function populateSelectModal(selectEl) {
    if (!selectEl) return;
    selectEl.innerHTML = "";
    grupos.forEach(g => {
      const opt = document.createElement("option");
      opt.value = g;
      opt.textContent = g;
      selectEl.appendChild(opt);
    });
  }
  populateSelectModal(selectGrupoEditable);
  populateSelectModal(selectGrupoBKPEditable);

  // Cargar usuarios
  let usuarios = [];
  await cargarUsuarios();

  async function cargarUsuarios() {
    try {
      const resp = await fetch("/usuarios");
      const data = await resp.json();
      if (!data.success) throw new Error(data.error || "Error al cargar usuarios");
      usuarios = data.usuarios || [];
      renderTabla(usuarios);
    } catch (err) {
      console.error("Error de conexión al backend:", err);
      tabla.innerHTML = `<tr><td colspan="10">Error al cargar datos</td></tr>`;
    }
  }

  // Render tabla (usa los campos que devuelve tu backend)
  function renderTabla(lista) {
    tabla.innerHTML = "";
    lista.forEach(uRaw => {
      // normalizar campos (por si vienen con mayúsculas)
      const u = {
        id_usuario: uRaw.id_usuario ?? uRaw.ID_Usuario ?? uRaw.id ?? null,
        nombre: uRaw.nombre ?? uRaw.Nombre ?? "-",
        grupo: uRaw.grupo ?? uRaw.Grupo ?? "-",
        grupo2: uRaw.grupo2 ?? uRaw.Grupo2 ?? "-",
        modo: uRaw.modo ?? uRaw.Modo ?? "-",
        max: uRaw.max ?? uRaw.Max_Por_Trabajar ?? "-",
        desde: uRaw.desde ?? uRaw.Hora_De ?? uRaw.hora_de ?? "-",
        hasta: uRaw.hasta ?? uRaw.Hora_A ?? uRaw.hora_a ?? "-",
        activo: (typeof uRaw.activo !== "undefined") ? (uRaw.activo == 1 || uRaw.activo === true) : false,
        asignar: uRaw.asignar ?? uRaw.Asignar ?? ""
      };

      const row = document.createElement("tr");
      row.innerHTML = `
        <td class="nombre-cell" style="cursor:pointer">${escapeHtml(u.nombre)}</td>
        <td>${escapeHtml(u.grupo)}</td>
        <td>${escapeHtml(u.grupo2)}</td>
        <td>${escapeHtml(u.modo)}</td>
        <td>${escapeHtml(String(u.max))}</td>
        <td>${escapeHtml(u.desde)}</td> 
        <td>${escapeHtml(u.hasta)}</td>
        <td>${u.activo === 'Activo' ? '✅ Activo' : '❌ Inactivo'}</td>


        <td>
          <select class="asignar-select form-select form-select-sm">
            <option value="Asignar" ${u.asignar === "Asignar" ? "selected" : ""}>Asignar</option>
            <option value="No Asignar" ${u.asignar === "No Asignar" ? "selected" : ""}>No Asignar</option>
            <option value="Automático" ${u.asignar === "Automático" ? "selected" : ""}>Automático</option>
          </select>
        </td>
        <td><button class="btn btn-primary btn-sm ver-btn">Ver</button></td>
      `;

      // Ver → abrir modal con id correcto
      row.querySelector(".ver-btn").addEventListener("click", () => {
        if (!u.id_usuario) {
          console.error("Falta id_usuario para abrir modal:", u);
          alert("No se puede abrir el detalle (ID faltante).");
          return;
        }
        abrirModal(u.id_usuario);
      });

      // Click en el nombre también abre el modal
      row.querySelector(".nombre-cell").addEventListener("click", () => {
        if (!u.id_usuario) return;
        abrirModal(u.id_usuario);
      });

      // Cambio Asignar → POST a /usuarios/:id_usuario/asignar
      const select = row.querySelector(".asignar-select");
      select.addEventListener("change", async (e) => {
        const nuevoValor = e.target.value;
        if (!u.id_usuario) {
          alert("ID de usuario faltante, no se puede actualizar.");
          return;
        }
        try {
          const resp = await fetch(`/usuarios/${u.id_usuario}/asignar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ asignar: nuevoValor })
          });
          const data = await resp.json();
          if (!data.success) throw new Error(data.error || "Error al actualizar Asignar");
          console.log(`Asignar actualizado: ${u.nombre} → ${nuevoValor}`);
        } catch (err) {
          console.error("Error al actualizar Asignar:", err);
          alert("No se pudo actualizar el campo Asignar.");
        }
      });

      tabla.appendChild(row);
    });
  }

  // Filtros (siguen funcionando sobre el array local)
  [filtroGrupo, filtroNombre, filtroActivo].forEach(inp => inp.addEventListener("input", aplicarFiltros));
  function aplicarFiltros() {
    const grupo = (filtroGrupo.value || "").toLowerCase();
    const nombre = (filtroNombre.value || "").toLowerCase();
    const activoVal = (filtroActivo.value || "").toLowerCase(); // en tu HTML filtroActivo es select con values "Activo","Inactivo",""
    const filtrados = usuarios.filter(uRaw => {
      const nombreRaw = (uRaw.nombre ?? uRaw.Nombre ?? "").toString().toLowerCase();
      const grupoRaw = (uRaw.grupo ?? uRaw.Grupo ?? "").toString().toLowerCase();
      const activoRaw = (typeof uRaw.activo !== "undefined") ? (uRaw.activo == 1 || uRaw.activo === true) : false;
      const matchGrupo = !grupo || grupoRaw.includes(grupo);
      const matchNombre = !nombre || nombreRaw.includes(nombre);
      const matchActivo = !activoVal || (activoVal === "activo" ? activoRaw : !activoRaw);
      return matchGrupo && matchNombre && matchActivo;
    });
    renderTabla(filtrados);
  }

  // Abrir modal: pide detalle al backend y rellena los campos del modal (spans/inputs)
  async function abrirModal(id_usuario) {
  try {
    const resp = await fetch(`/usuarios/${id_usuario}`);
    const data = await resp.json();
    if (!data.success) throw new Error(data.error || "Error al obtener detalle del usuario");

    const u = data.usuario || {};

    // 🔹 Guardamos el ID real del usuario en el input oculto
    document.getElementById("modalIdUsuario").value = id_usuario;

    // Rellenar los spans del modal
    spanNombre.textContent = u.nombre ?? "-";
    spanEmail.textContent = u.email ?? "-";
    spanSfID.textContent = u.sf_user_id ?? "-";

    if (u.horario) {
      const parts = (u.horario || "").split(" - ");
      spanDesde.textContent = parts[0] || (u.desde ?? "-");
      spanHasta.textContent = parts[1] || (u.hasta ?? "-");
    } else {
      spanDesde.textContent = u.desde ?? "-";
      spanHasta.textContent = u.hasta ?? "-";
    }

    spanReferente.textContent = u.referente ?? "-";
    spanActivo.textContent = u.activo ?? "-";

    // Rellenar campos editables
    if (selectGrupoEditable) selectGrupoEditable.value = u.grupo ?? "";
    if (selectGrupoBKPEditable) selectGrupoBKPEditable.value = u.grupo2 ?? "";
    if (inputCantidad) inputCantidad.value = u.max ?? "";
    if (selectForma) selectForma.value = u.forma ?? selectForma.value;
    if (selectModo)
      selectModo.value = (u.modo && u.modo.toLowerCase().includes("auto")) ? "automatico" : (u.modo ?? selectModo.value);
    if (checkboxDesasignador) checkboxDesasignador.checked = !!u.des_asignar;
    if (textareaScript) textareaScript.value = u.script ?? "";

    // Mostrar modal
    bsModal.show();
  } catch (err) {
    console.error("Error al cargar detalle del usuario:", err);
    alert("No se pudo abrir el detalle del usuario.");
  }
}


  // escape simple para evitar inyección en render (texto plano)
  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

    // --- GUARDAR CAMBIOS ---
 async function guardarCambiosUsuario() {
  // 🔹 Obtener ID del input oculto
  const id = parseInt(document.getElementById("modalIdUsuario").value, 10);

  if (!id || isNaN(id)) {
    alert("❌ ID de usuario inválido. No se puede guardar.");
    return;
  }

  const data = {
    id_usuario: id,
    grupo: selectGrupoEditable.value,
    grupo2: selectGrupoBKPEditable.value,
    max_por_trabajar: parseInt(inputCantidad.value || 0, 10),
    asc_desc: selectForma.value,
    modo: selectModo.value,
    script: textareaScript.value,
    des_asignar: checkboxDesasignador.checked
  };

  try {
    const resp = await fetch("/usuarios/actualizar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const result = await resp.json();
    if (!result.success) throw new Error(result.error);

    alert("✅ Cambios guardados correctamente");
    bsModal.hide();
    await cargarUsuarios(); // refresca la tabla
  } catch (err) {
    console.error("Error al guardar cambios:", err);
    alert("❌ No se pudieron guardar los cambios.");
  }
}


  // Vincular botón "Guardar" del modal
  const btnGuardar = document.getElementById("modalBtnGuardar");
  if (btnGuardar) {
    btnGuardar.addEventListener("click", guardarCambiosUsuario);
  }

});
