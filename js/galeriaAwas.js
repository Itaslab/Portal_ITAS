//galeriaAwas.js

async function cargarAWAS() {
  const res = await fetch(`${basePath}/api/awas`);
  const data = await res.json();

  if (!Array.isArray(data)) {
    console.error("Error backend:", data);
    return;
  }

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

cargarAWAS();