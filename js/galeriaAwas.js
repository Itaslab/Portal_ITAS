//galeriaAwas.js

let awasGlobal = [];

async function cargarAWAS() {
  const res = await fetch(`${basePath}/api/awas`);
  const data = await res.json();


  if (!Array.isArray(data)) {
    console.error("Error backend:", data);
    return;
  }

  awasGlobal = data; 


  const tbody = document.querySelector("#tablaAwas tbody");
  tbody.innerHTML = "";

  data.forEach(awa => {
    const estadoColor =
      awa.Estado === "Activo"
        ? "text-success"
        : awa.Estado === "Backlog"
        ? "text-warning"
        : "text-secondary";

    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${awa.ID_WA ?? "-"}</td>
      <td>${awa.ID_AWA ?? "-"}</td>
      <td>${awa.Titulo || "-"}</td>
      <td class="${estadoColor} fw-bold">${awa.Estado || "-"}</td>
      <td class="text-end">
        ${
          awa.Estado === "Activo"
            ? `<button class="btn btn-danger btn-sm me-2 text-white" onclick="activarAWA(${awa.ID_AWA})">Desactivar</button>`
            : `<button class="btn btn-success btn-sm me-2 text-white" onclick="activarAWA(${awa.ID_AWA})">Activar</button>`
        }
        <button class="btn btn-primary btn-sm text-white" onclick="configurarAWA(${awa.ID_AWA})">
          Configurar
        </button>
      </td>
    `;

    tbody.appendChild(row);
  });
}

function configurarAWA(id) {
  const awa = awasGlobal.find(a => a.ID_AWA == id);

  if (!awa) {
    console.error("AWA no encontrada:", id);
    return;
  }

  // Guardar ID oculto
  document.getElementById("inputIdAwa").value = awa.ID_AWA;
  document.getElementById("inputIdAwaVisible").value = awa.ID_AWA;

  // Cargar algunos campos (arrancamos simple)
  document.getElementById("inputIdWa").value = awa.ID_WA || "";
  document.getElementById("inputTitulo").value = awa.Titulo || "";
  document.getElementById("inputEstado").value = awa.Estado || "Backlog";
  document.getElementById("inputOrigen").value = awa.Origen || "";
  document.getElementById("inputSistema").value = awa.Sistema || "";
  document.getElementById("inputNegocio").value = awa.Negocio || "";

  // Fechas
  document.getElementById("inputDesde").value = awa.Fdesde?.split("T")[0] || "";
  document.getElementById("inputHasta").value = awa.Fhasta?.split("T")[0] || "";

  // 🔥 Abrir modal
  const modal = new bootstrap.Modal(document.getElementById("modalAwa"));
  modal.show();
}

cargarAWAS();