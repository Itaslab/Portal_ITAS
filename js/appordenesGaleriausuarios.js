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
        "INC-NPLAY_POSVENTA", "INC-FACOBMOR", "Mesa 1", "Mesa 1 (N1)", "Mesa 3", "Mesa 3 (N1)", "Mesa 4", "PM", "LEGADO"
    ];

    function populateSelectModal(selectEl) {
        if (!selectEl) return;
        selectEl.innerHTML = "";
        const emptyOpt = document.createElement("option");
        emptyOpt.value = "";
        emptyOpt.textContent = "";
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

    // Debounce util
    function debounce(fn, wait) {
        let t = null;
        return function (...args) {
            clearTimeout(t);
            t = setTimeout(() => fn.apply(this, args), wait);
        };
    }

    function normalizeActivo(val) {
        if (val === undefined || val === null || val === "") return "";
        const s = String(val).trim().toLowerCase();
        if (s === "1" || s === "true" || s === "activo") return "activo";
        if (s === "0" || s === "false" || s === "inactivo") return "inactivo";
        return s;
    }

    async function cargarUsuarios() {
        try {
            const resp = await fetch(basePath + "/usuarios");
            const data = await resp.json();
            if (!data.success) throw new Error(data.error || "Error al cargar usuarios");
            usuarios = data.usuarios || [];
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

    function renderTabla(lista) {
        tabla.innerHTML = "";
        lista.forEach(uRaw => {
            const licValor = uRaw.Lic_Estado ?? uRaw.lic_estado;
            const licEnTrue =
            typeof licValor === "string" &&
            licValor.toLowerCase() === "true";
            const activoReal =
                    typeof uRaw.activo === "string"
                    ? uRaw.activo.trim()
                    : (uRaw.activo == 1 || uRaw.activo === true ? "Activo" : "Inactivo");
                    const estadoTexto = licEnTrue ? "Licencia" : activoReal;
                const u = {
                    id_usuario: uRaw.id_usuario ?? uRaw.ID_Usuario ?? uRaw.id ?? null,
                    nombre: uRaw.nombre ?? uRaw.Nombre ?? "-",
                    grupo: uRaw.grupo ?? uRaw.Grupo ?? "-",
                    grupo2: uRaw.grupo2 ?? uRaw.Grupo2 ?? "-",
                    modo: uRaw.modo ?? uRaw.Modo ?? "-",
                    max: uRaw.max ?? uRaw.Max_Por_Trabajar ?? "-",
                    desde: uRaw.desde ?? uRaw.Hora_De ?? uRaw.hora_de ?? "-",
                    hasta: uRaw.hasta ?? uRaw.Hora_A ?? uRaw.hora_a ?? "-",
                    activo: estadoTexto,
                    asignar: uRaw.asignar ?? uRaw.Asignar ?? "",
                    lic_estado: uRaw.Lic_Estado ?? uRaw.lic_estado ?? "-"

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
                <td><span class="estado-span">${escapeHtml(u.activo)}</span></td>
                <td>
                    <select class="asignar-select form-select form-select-sm">
                        <option value="Asignar" ${u.asignar === "Asignar" ? "selected" : ""}>Asignar</option>
                        <option value="No Asignar" ${u.asignar === "No Asignar" ? "selected" : ""}>No Asignar</option>
                        <option value="Automático" ${u.asignar === "Automático" ? "selected" : ""}>Automático</option>
                    </select>
                </td>
                <td><button class="btn btn-primary btn-sm ver-btn ver-animated">Ver</button></td>
            `;

            const estadoSpan = row.querySelector(".estado-span");
            if (estadoSpan) {
                const texto = estadoSpan.textContent.toLowerCase();
                estadoSpan.classList.add("text-white", "px-2", "py-1", "rounded", "shadow");
                estadoSpan.style.fontSize = "0.80rem";
                estadoSpan.classList.add("bg-success");
                if (texto === "activo") {
                } else if (texto === "inactivo") {
                estadoSpan.classList.add("bg-danger");
                } else if (texto === "licencia") {
                estadoSpan.classList.add("bg-warning", "text-dark");
                }
            }

            row.querySelector(".ver-btn").addEventListener("click", () => {
                if (!u.id_usuario) {
                    alert("No se puede abrir el detalle (ID faltante).");
                    return;
                }
                abrirModal(u.id_usuario);
            });

            row.querySelector(".nombre-cell").addEventListener("click", () => {
                if (!u.id_usuario) return;
                abrirModal(u.id_usuario);
            });

            const select = row.querySelector(".asignar-select");
            select.addEventListener("change", async (e) => {
                const nuevoValor = e.target.value;
                if (!u.id_usuario) {
                    alert("ID de usuario faltante, no se puede actualizar.");
                    return;
                }
                try {
                    const resp = await fetch(basePath + `/usuarios/${u.id_usuario}/asignar`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ asignar: nuevoValor })
                    });
                    const data = await resp.json();
                    if (!data.success) throw new Error(data.error || "Error al actualizar Asignar");
                    await cargarUsuarios();
                } catch (err) {
                    console.error("Error al actualizar Asignar:", err);
                    alert("No se pudo actualizar el campo Asignar.");
                }
            });

            tabla.appendChild(row);
        });
    }

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
            return (!grupo || grupoRaw === grupo) &&
                (!nombre || nombreRaw.includes(nombre)) &&
                (!activoVal || activoTexto === activoVal);
        });
        renderTabla(filtrados);
    }

    async function abrirModal(id_usuario) {
        try {
            const resp = await fetch(basePath + `/usuarios/${id_usuario}`);
            const data = await resp.json();
            if (!data.success) throw new Error(data.error || "Error al obtener detalle del usuario");
            const u = data.usuario || {};
            document.getElementById("modalIdUsuario").value = id_usuario;
            spanNombre.textContent = u.nombre ?? "-";
            spanEmail.textContent = u.email ?? "-";
            spanSfID.textContent = u.sf_user_id ?? "-";
            spanReferente.textContent = u.referente ?? "-";
            spanActivo.textContent = u.activo ?? "-";
            if (selectGrupoEditable) selectGrupoEditable.value = u.grupo ?? "";
            if (selectGrupoBKPEditable) selectGrupoBKPEditable.value = u.grupo2 ?? "";
            if (inputCantidad) {
                inputCantidad.value = u.max ?? "";
                inputCantidad.setAttribute("max", "99");
            }
            if (selectForma) selectForma.value = u.forma ?? selectForma.value;
            if (selectModo && u.modo) selectModo.value = u.modo;
            if (checkboxDesasignador) checkboxDesasignador.checked = !!u.des_asignar;
            if (textareaScript) textareaScript.value = u.script ?? "";

            // ✅ NUEVA LÓGICA: habilitar/deshabilitar script según modo
            function updateScriptState() {
                const modoVal = selectModo.value;
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
            updateScriptState();
            selectModo.addEventListener('change', updateScriptState);

            bsModal.show();
        } catch (err) {
            console.error("Error al cargar detalle del usuario:", err);
            alert("No se pudo abrir el detalle del usuario.");
        }
    }

    function escapeHtml(str) {
        if (str === null || str === undefined) return "";
        return String(str).replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">");
    }

    async function guardarCambiosUsuario() {
        const id = parseInt(document.getElementById("modalIdUsuario").value, 10);
        if (!id || isNaN(id)) {
            alert("❌ ID de usuario inválido. No se puede guardar.");
            return;
        }

        const modoVal = selectModo.value;
        const scriptVal = textareaScript.value.trim();
        if (modoVal === 'SCRIPT' && !scriptVal) {
            alert("❌ Modo SCRIPT requiere que ingrese el script.");
            return;
        }

        const data = {
            id_usuario: id,
            grupo: selectGrupoEditable.value,
            grupo2: selectGrupoBKPEditable.value,
            max_por_trabajar: parseInt(inputCantidad.value || 0, 10),
            asc_desc: selectForma.value,
            modo: modoVal,
            script: scriptVal,
            des_asignar: checkboxDesasignador.checked
        };

        try {
            const resp = await fetch(basePath + "/usuarios/actualizar", {
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