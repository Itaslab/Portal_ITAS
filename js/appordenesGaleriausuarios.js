// appordenesGaleriausuarios.js (versión corregida)

document.addEventListener("DOMContentLoaded", async () => {
  const filtroGrupo = document.getElementById("filtroGrupo");
  const filtroNombre = document.getElementById("filtroNombre");
  const filtroActivo = document.getElementById("filtroActivo");
  const tabla = document.querySelector("table tbody");

  // Modal Bootstrap
  const usuarioModalEl = document.getElementById("usuarioModal");
  const bsModal = new bootstrap.Modal(usuarioModalEl, { backdrop: true });
  // Referencias dentro del modal
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

  // cargar selects del modal
const grupos = [
  "ORDEN-POSVENTA_A", "ORDEN-POSVENTA_B", "ORDEN-REJECTED",
  "INC-NPLAY_ACTIVACIONES", "INC-FAN_POSVENTA", "INC-FAN_VENTA",
  "INC-NPLAY_POSVENTA", "INC-FACOBMOR", "Mesa 1","Mesa 1 (N1)" ,"Mesa 3","Mesa 3 (N1)" ,"Mesa 4", "PM", "LEGADO"
];

function populateSelectModal(selectEl) {
  if (!selectEl) return;
  selectEl.innerHTML = "";

  // Agregar opción vacía
  const emptyOpt = document.createElement("option");
  emptyOpt.value = "";
  emptyOpt.textContent = ""; // o "Seleccione..." si prefieres
  selectEl.appendChild(emptyOpt);

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

  // Helper de prueba: permite inyectar datos desde la consola del navegador
  // Uso: window.__testSetUsuarios([{ id_usuario:1, nombre:'Pepe', grupo:'Mesa 1', activo:1, max:5, desde:'09:00', hasta:'18:00' }, ...])
  window.__testSetUsuarios = function(list) {
    if (!Array.isArray(list)) return console.error('__testSetUsuarios espera un array');
    usuarios = list;
    renderTabla(usuarios);
  };

  // Debounce util: evita ejecuciones muy frecuentes de los filtros
  function debounce(fn, wait) {
    let t = null;
    return function(...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  // Normaliza valores del campo 'activo' para comparar con el filtro
  function normalizeActivo(val) {
    if (val === undefined || val === null || val === "") return "";
    const s = String(val).trim().toLowerCase();
    if (s === "1" || s === "true" || s === "activo") return "activo";
    if (s === "0" || s === "false" || s === "inactivo") return "inactivo";
    return s;
  }

  async function cargarUsuarios() {
    try {
      const resp = await fetch("/usuarios");
      const data = await resp.json();
      if (!data.success) throw new Error(data.error || "Error al cargar usuarios");
      usuarios = data.usuarios || [];
      // Aplicar filtros actuales después de recargar la lista
      // (asegura que la vista respete los filtros activos tras un POST)
      if (typeof aplicarFiltros === 'function') {
        aplicarFiltros();
      } else {
        renderTabla(usuarios);
      }
    } catch (err) {
      console.error("Error de conexión al backend:", err);
      tabla.innerHTML = `<tr><td colspan="10">Error al cargar datos</td></tr>`;
    }
  }

  // Render tabla (usa los campos que devuelve tu backend)
  function renderTabla(lista) {
    tabla.innerHTML = "";
    lista.forEach(uRaw => {
      // 🧠 Normalizamos campos
      const u = {
        id_usuario: uRaw.id_usuario ?? uRaw.ID_Usuario ?? uRaw.id ?? null,
        nombre: uRaw.nombre ?? uRaw.Nombre ?? "-",
        grupo: uRaw.grupo ?? uRaw.Grupo ?? "-",
        grupo2: uRaw.grupo2 ?? uRaw.Grupo2 ?? "-",
        modo: uRaw.modo ?? uRaw.Modo ?? "-",
        max: uRaw.max ?? uRaw.Max_Por_Trabajar ?? "-",
        desde: uRaw.desde ?? uRaw.Hora_De ?? uRaw.hora_de ?? "-",
        hasta: uRaw.hasta ?? uRaw.Hora_A ?? uRaw.hora_a ?? "-",

        // 🔧 Corrección del campo ACTIVO
        activo:
          typeof uRaw.activo === "string"
            ? uRaw.activo.trim()
            : (uRaw.activo == 1 || uRaw.activo === true ? "Activo" : "Inactivo"),

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
  <td><span class="estado-span">${u.activo === "Activo" ? "Activo" : "Inactivo"}</span></td>
  <td>
    <select class="asignar-select form-select form-select-sm">
      <option value="Asignar" ${u.asignar === "Asignar" ? "selected" : ""}>Asignar</option>
      <option value="No Asignar" ${u.asignar === "No Asignar" ? "selected" : ""}>No Asignar</option>
      <option value="Automático" ${u.asignar === "Automático" ? "selected" : ""}>Automático</option>
    </select>
  </td>
  <td><button class="btn btn-primary btn-sm ver-btn ver-animated">Ver</button></td>
`;

// Aplicar estilos al estado
const estadoSpan = row.querySelector(".estado-span");
if (estadoSpan) {
  const texto = estadoSpan.textContent.toLowerCase();
  estadoSpan.classList.add("text-white", "px-2", "py-1", "rounded", "shadow");
  estadoSpan.style.fontSize = "0.80rem"; // letras más chicas

  if (texto === "activo") {
    estadoSpan.classList.add("bg-success");
  } else if (texto === "inactivo") {
    estadoSpan.classList.add("bg-danger");
  }
}


      // Ver → abrir modal
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
          await cargarUsuarios();
        } catch (err) {
          console.error("Error al actualizar Asignar:", err);
          
          alert("No se pudo actualizar el campo Asignar.");
        }
      });

      tabla.appendChild(row);
    });
  }

  // Filtros (con debounce y normalización robusta)
  const debouncedAplicar = debounce(aplicarFiltros, 250);
  if (filtroGrupo) filtroGrupo.addEventListener("input", debouncedAplicar);
  if (filtroNombre) filtroNombre.addEventListener("input", debouncedAplicar);
  if (filtroActivo) filtroActivo.addEventListener("change", debouncedAplicar);

  function aplicarFiltros() {
    const grupo = (filtroGrupo && filtroGrupo.value ? filtroGrupo.value : "").toLowerCase();
    const nombre = (filtroNombre && filtroNombre.value ? filtroNombre.value : "").toLowerCase();
    const activoVal = normalizeActivo(filtroActivo ? filtroActivo.value : "");

    const filtrados = usuarios.filter(uRaw => {
      const nombreRaw = (uRaw.nombre ?? uRaw.Nombre ?? "").toString().toLowerCase();
      const grupoRaw = (uRaw.grupo ?? uRaw.Grupo ?? "").toString().toLowerCase();
      const activoTexto = normalizeActivo(uRaw.activo);

      const matchGrupo = !grupo || grupoRaw.includes(grupo);
      const matchNombre = !nombre || nombreRaw.includes(nombre);
      const matchActivo = !activoVal || activoTexto === activoVal;

      return matchGrupo && matchNombre && matchActivo;
    });

    renderTabla(filtrados);
  }

  // Abrir modal
  async function abrirModal(id_usuario) {
    try {
      const resp = await fetch(`/usuarios/${id_usuario}`);
      const data = await resp.json();
      if (!data.success) throw new Error(data.error || "Error al obtener detalle del usuario");

      const u = data.usuario || {};

      document.getElementById("modalIdUsuario").value = id_usuario;
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

      if (selectGrupoEditable) selectGrupoEditable.value = u.grupo ?? "";
      if (selectGrupoBKPEditable) selectGrupoBKPEditable.value = u.grupo2 ?? "";
	  
	  
      
 // Limitar cantidad a máximo 99
    if (inputCantidad) {
      inputCantidad.value = u.max ?? "";
      inputCantidad.setAttribute("max", "99"); // HTML constraint
      inputCantidad.addEventListener("input", () => {
        if (parseInt(inputCantidad.value) > 99) {
          inputCantidad.value = 99; // Corrige si excede
        }
      });
    }

      if (selectForma) selectForma.value = u.forma ?? selectForma.value;
      if (selectModo && u.modo) {selectModo.value = u.modo;};
      if (checkboxDesasignador) checkboxDesasignador.checked = !!u.des_asignar;
      if (textareaScript) textareaScript.value = u.script ?? "";

      bsModal.show();
    } catch (err) {
      console.error("Error al cargar detalle del usuario:", err);
      alert("No se pudo abrir el detalle del usuario.");
    }
  }

  // escape simple
  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // GUARDAR CAMBIOS
  async function guardarCambiosUsuario() {
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
       // Si modo = SCRIPT, script es obligatorio
    const scriptVal = textareaScript.value.trim();
    if (modo === 'SCRIPT' && !scriptVal) {
      resultado.innerHTML = `<div class="alert alert-warning">Modo SCRIPT requiere que ingrese el script.</div>`;
      return;
    }
	 const textareaScript = document.getElementById('modalScript');

  // Habilitar/deshabilitar textarea según Modo
  function updateScriptState() {
    const modoVal = modoSelect.value;
    if (modoVal === 'SCRIPT') {
      textareaScript.disabled = false;
      textareaScript.classList.remove('bg-light');
      textareaScript.required = true;
    } else {
      textareaScript.disabled = true;
      textareaScript.value = '';
      textareaScript.classList.add('bg-light');
      textareaScript.required = false;
    }
  }
	  

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
      await cargarUsuarios();
    } catch (err) {
      console.error("Error al guardar cambios:", err);
      alert("❌ No se pudieron guardar los cambios.");
    }
  }

  const btnGuardar = document.getElementById("modalBtnGuardar");
  if (btnGuardar) {
    btnGuardar.addEventListener("click", guardarCambiosUsuario);
  }
});
	 