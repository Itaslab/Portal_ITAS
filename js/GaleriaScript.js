// AppOrdenesSF_GaleriaScripts.js

document.addEventListener("DOMContentLoaded", () => {
  const tablaBody = document.querySelector("#tablaScripts tbody");
  const modalEl = document.getElementById("usuarioModal");
  const modal = new bootstrap.Modal(modalEl);
  const btnGuardar = document.getElementById("btnGuardar");
  const modalMsg = document.getElementById("modalMsg");

  // campos del modal
  const inputId = document.getElementById("inputId");
  const inputBajada = document.getElementById("inputBajada");
  const selectNegocio = document.getElementById("selectNegocio");
  const textareaScript = document.getElementById("textareaScript");
  const selectEsquema = document.getElementById("selectEsquema");
  const selectActivar = document.getElementById("selectActivar");
  const vigFrom = document.getElementById("vigFrom");
  const vigTo = document.getElementById("vigTo");
  const selectDelay = document.getElementById("selectDelay");

  // --- Helpers ---
  const formatoActivo = (val) => {
    // backend devuelve bit 1/0 o booleano
    if (val === true || val === 1 || val === "1" || val === "true") return "Sí";
    return "No";
  };

  // --- Cargar tabla ---
  async function cargarTabla() {
    tablaBody.innerHTML = "<tr><td colspan='6'>Cargando...</td></tr>";
    try {
      const resp = await fetch(basePath + "/api/scripts");
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      if (!data.success) throw new Error(data.error || "No success");

      if (!data.bajadas || data.bajadas.length === 0) {
        tablaBody.innerHTML = "<tr><td colspan='6'>No hay registros</td></tr>";
        return;
      }

      tablaBody.innerHTML = "";
      for (const b of data.bajadas) {
        const tr = document.createElement("tr");
        tr.dataset.id = b.id;

        // Asegurate de que los campos existen
        const nombre = b.nombre ?? "";
        const negocio = b.negocio ?? "";
        const descripcion = b.descripcion ?? "";
        const esquema = b.esquema ?? "";
        const activo = b.activo ?? 0;

        tr.innerHTML = `
          <td>${escapeHtml(nombre)}</td>
          <td>${escapeHtml(negocio)}</td>
          <td>${escapeHtml(descripcion)}</td>
          <td>${escapeHtml(esquema)}</td>
          
<td class="text-center align-middle">
    <div class="d-flex justify-content-center align-items-center">
        <div class="form-check form-switch mb-0">
            <input
                class="form-check-input switch-activo"
                type="checkbox"
                ${activo ? "checked" : ""}
                data-id="${b.id}">
        </div>

        <span class="estado-activo ms-2">
            ${activo ? "Activado" : "Desactivado"}
        </span>
    </div>
</td>
          <td><button class="btn btn-primary  btn-sm ver-animated text-white">Configurar</button></td>
        `;
        tablaBody.appendChild(tr);
      }

      // attach listeners
      document.querySelectorAll(".ver-animated").forEach((btn) => {
        btn.addEventListener("click", onVerClick);
      });
      document.querySelectorAll(".switch-activo").forEach((sw) => {
        sw.addEventListener("change", cambiarActivo);
      });
    } catch (err) {
      console.error("Error cargando scripts:", err);
      tablaBody.innerHTML = `<tr><td colspan='6'>Error al cargar: ${err.message}</td></tr>`;
    }
  }

  // --- Click en Ver ---
  async function onVerClick(e) {
    const tr = e.target.closest("tr");
    const id = tr?.dataset?.id;
    if (!id) {
      modalMsg.textContent = "No se encontró ID del registro.";
      modal.show();
      return;
    }

    try {
      modalMsg.textContent = "";
      // Traer detalles
      const resp = await fetch(basePath + `/api/scripts/${id}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      if (!data.success) throw new Error(data.error || "No success");

      const b = data.bajada;
      // Llenar modal
      inputId.value = b.id ?? "";
      inputBajada.value = b.nombre ?? "";
      selectNegocio.value = b.negocio ?? "";
      textareaScript.value = b.script ?? "";
      selectEsquema.value = b.esquema ?? b.esquema_json ?? "";
      selectActivar.value = b.activo ? "1" : "0";
      selectDelay.value = b.delay ?? 0;

      // Si vienen fechas (string 'YYYY-MM-DD'), asignarlas
      vigFrom.value = b.vigencia_desde ?? "";
      vigTo.value = b.vigencia_hasta ?? "";

      modal.show();
    } catch (err) {
      console.error("Error al traer detalle:", err);
      modalMsg.textContent = `Error al traer detalle: ${err.message}`;
      modal.show();
    }
  }

  async function cambiarActivo(e) {
    const id = e.target.dataset.id;
    const activo = e.target.checked ? 1 : 0;

    try {
      const resp = await fetch(basePath + `/api/scripts/${id}/activo`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ activo }),
      });

      const data = await resp.json();

      if (!resp.ok || !data.success) {
        throw new Error(data.error);
      }

      // Actualizar el texto
      const contenedor = e.target.closest(".d-flex");
      const texto = contenedor.querySelector(".estado-activo");
      texto.textContent = activo ? "Activado" : "Desactivado";
    } catch (err) {
      alert("No se pudo actualizar.");

      // vuelve al estado anterior
      e.target.checked = !e.target.checked;
    }
  }

  // --- Guardar ---
  btnGuardar.addEventListener("click", async () => {
    const id = inputId.value;
    if (!id) {
      modalMsg.textContent = "Falta el ID del registro.";
      return;
    }
    modalMsg.textContent = "Guardando...";

    const payload = {
      id: Number(id),
      nombre: inputBajada.value,
      negocio: selectNegocio.value,
      script: textareaScript.value,
      esquema_json: selectEsquema.value,
      activo: selectActivar.value === "1" ? 1 : 0,
      vigencia_desde: vigFrom.value || null,
      vigencia_hasta: vigTo.value || null,
      delay: Number(selectDelay.value),
    };

    try {
      const resp = await fetch(basePath + `/api/scripts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await resp.json();
      if (!resp.ok || !data.success)
        throw new Error(data.error || `HTTP ${resp.status}`);

      modalMsg.textContent = "Guardado correctamente.";
      await cargarTabla();
      setTimeout(() => {
        modal.hide();
        modalMsg.textContent = "";
      }, 700);
    } catch (err) {
      console.error("Error al guardar:", err);
      modalMsg.textContent = `Error al guardar: ${err.message}`;
    }
  });

  // --- Util ---
  function escapeHtml(text) {
    if (text === null || text === undefined) return "";
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Carga inicial
  cargarTabla();
});
