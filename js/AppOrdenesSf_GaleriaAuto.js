

let autoMQData = []; // Aquí guardaremos los datos del backend
const tbody = document.getElementById("autoMQBody");

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
  const filtered = autoMQData.filter(row =>
    Object.values(row).some(val =>
      val.toString().toLowerCase().includes(term)
    )
  );
  renderTable(filtered);
});

// Actualizar contenido de modales
function updateModal(type, item) {
  const modalBody = document.querySelector(`#${type}Modal .modal-body`);
  if (type === "estado") {
    modalBody.textContent = `¿Desea cambiar el estado del AutoMQ ${item.titulo}?`;
  } else if (type === "carpeta") {
    modalBody.innerHTML = `
      <p><strong>AUTO MQ:</strong> ${item.titulo}</p>
      <p><strong>Descripción:</strong> ${item.descripcion}</p>
      <p><strong>Inbox:</strong> ${item.inbox}</p>
      <p><strong>Acción:</strong> ${item.accion}</p>
    `;
  }
}

// Delegación de eventos para modales
document.addEventListener("click", e => {
  const index = e.target.getAttribute("data-index");
  if (index !== null) {
    const item = autoMQData[index];
    if (e.target.closest("[data-bs-target='#estadoModal']")) updateModal("estado", item);
    if (e.target.closest("[data-bs-target='#carpetaModal']")) updateModal("carpeta", item);
  }
});

// Obtener datos del backend
async function fetchData() {
  try {
    const response = await fetch("/api/galeria-auto-mq");
    const { success, autoMQ } = await response.json();
    if (success) {
      autoMQData = autoMQ;
      renderTable(autoMQData);
    }
  } catch (error) {
    console.error("Error al obtener datos:", error);
  }
}

// Inicializar
fetchData();





