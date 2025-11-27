
const data = [
  { autoMQ: "AMQ01-Nomi_SubsNoExist_Cancelar", descripcion: "Nominación - Subscriber does not exist - Cancelar", inbox: "Inbox Funcional", accion: "Cancelar", estado: false },
  { autoMQ: "AMQ02-Desco_SubsNoExist_Completar", descripcion: "Desconexión - Subscriber does not exist - Completar", inbox: "Inbox Funcional", accion: "Completar", estado: true },
  { autoMQ: "AMQ03-InsOffC1_ModIDRetry", descripcion: "Instance of offering C1 - Modif Dios Inexist y Reintentar", inbox: "Inbox Funcional", accion: "Reintentar", estado: false },
  { autoMQ: "AMQ04-InsOffFR_ModIDRetry", descripcion: "Instance of offering FR - Modif Dios Inexist y Reintentar", inbox: "Inbox Funcional", accion: "Reintentar", estado: true },
  { autoMQ: "AMQ05-NotSubscribeOffC_ModIDRetry", descripcion: "You cannot subscribe to offering C_FlowSc_Ciclo_1 Repeatedly - Modif Dios Dupli y Reintentar", inbox: "Inbox AutoTask", accion: "Reintentar", estado: false }
];

const tbody = document.getElementById("autoMQTable");

// Crear fila
function createRow(row, index) {
  return `
    <tr>
      <td>${row.autoMQ}</td>
      <td>${row.descripcion}</td>
      <td>${row.inbox}</td>
      <td>${row.accion}</td>
      <td>
        <div class="estado-icons">
          <label class="switch" role="button" data-bs-toggle="modal" data-bs-target="#estadoModal" data-index="${index}">
            <input type="checkbox" ${row.estado ? "checked" : ""}>
            <span class="slider"></span>
          </label>
          <i class="bi bi-journal-text text-primary" role="button" data-bs-toggle="modal" data-bs-target="#carpetaModal" data-index="${index}"></i>
          <i class="bi bi-pencil text-success" role="button" data-bs-toggle="modal" data-bs-target="#lapizModal" data-index="${index}"></i>
        </div>
      </td>
    </tr>
  `;
}

// Renderizar tabla
function renderTable(rows) {
  tbody.innerHTML = rows.map(createRow).join("");
}

// Filtro por búsqueda
document.getElementById("search").addEventListener("input", e => {
  const term = e.target.value.toLowerCase();
  const filtered = data.filter(row =>
    Object.values(row).some(val => val.toString().toLowerCase().includes(term))
  );
  renderTable(filtered);
});

// Actualizar contenido de modales
function updateModal(type, item) {
  const modalBody = document.querySelector(`#${type}Modal .modal-body`);
  if (type === "estado") {
    modalBody.textContent = `¿Desea ${item.estado ? "desactivar" : "activar"} el AutoMQ ${item.autoMQ}?`;
  } else if (type === "carpeta") {
    modalBody.innerHTML = `
      <p><strong>AUTO MQ:</strong> ${item.autoMQ}</p>
      <p><strong>Descripción:</strong> ${item.descripcion}</p>
      <p><strong>Inbox:</strong> ${item.inbox}</p>
      <p><strong>Acción:</strong> ${item.accion}</p>
    `;
  } else if (type === "lapiz") {
    modalBody.innerHTML = `
      <form id="editForm">
        <div class="mb-3">
          <label class="form-label">AUTO MQ</label>
          <input type="text" class="form-control" value="${item.autoMQ}">
        </div>
        <div class="mb-3">
          <label class="form-label">Descripción</label>
          <textarea class="form-control">${item.descripcion}</textarea>
        </div>
        <div class="mb-3">
          <label class="form-label">Inbox</label>
          <input type="text" class="form-control" value="${item.inbox}">
        </div>
        <div class="mb-3">
          <label class="form-label">Acción</label>
          <input type="text" class="form-control" value="${item.accion}">
        </div>
      </form>
    `;
  }
}

// Delegación de eventos para modales
document.addEventListener("click", e => {
  const index = e.target.getAttribute("data-index");
  if (index !== null) {
    const item = data[index];
    if (e.target.closest("[data-bs-target='#estadoModal']")) updateModal("estado", item);
    if (e.target.closest("[data-bs-target='#carpetaModal']")) updateModal("carpeta", item);
    if (e.target.closest("[data-bs-target='#lapizModal']")) updateModal("lapiz", item);
  }
});

// Inicializar tabla
renderTable(data);
