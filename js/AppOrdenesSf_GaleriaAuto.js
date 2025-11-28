

let autoMQData = []; // Aquí guardaremos los datos del backend
const tbody = document.getElementById("autoMQBody");

// Crear fila
function createRow(row, index) {
  return `
    <tr>
      <td>${row.titulo}</td>
      <td>${row.descripcion}</td>
      <td>${row.inbox}</td>
      <td>${row.accion}<td>
        <!-- Ícono Carpeta -->
        <i class="bi bi-folder-fill text-warning"
           role="button"
           data-index="${index}"
           data-bs-toggle="modal"
           data-bs-target="#carpetaModal"
           style="font-size: 1.3rem; margin-right: 10px;"></i>

        <!-- Ícono Lápiz -->
        <i class="bi bi-pencil-square text-primary"
           role="button"
           data-index="${index}"
           data-bs-toggle="modal"
           data-bs-target="#lapizModal"
           style="font-size: 1.3rem;"></i>
      </td>

      <td>
        <!-- Botón Estado -->
        <button class="btn btn-sm btn-primary"
                data-index="${index}"
                data-bs-toggle="modal"
                data-bs-target="#estadoModal">
          Estado
        </button>
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





