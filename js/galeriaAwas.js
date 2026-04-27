//galeriaAwas.js

async function cargarAWAS() {
  const res = await fetch(`${basePath}/api/awas`); 
  const awas = await res.json();

  const contenedor = document.getElementById("contenedorAwas");
  contenedor.innerHTML = "";

  awas.forEach(awa => {
    const col = document.createElement("div");
    col.className = "col-md-4";

    col.innerHTML = `
      <div class="card shadow-sm h-100">
        <div class="card-body">
          <h5 class="card-title">
            ID_WA: ${awa.ID_WA} | ID_AWA: ${awa.ID_AWA}
          </h5>

          <p class="card-text">
            <strong>Título:</strong> ${awa.Titulo || "-"}<br>
            <strong>Estado:</strong> ${awa.Estado || "-"}
          </p>

          <div class="d-flex justify-content-between">
            <button class="btn btn-success btn-sm" onclick="activarAWA(${awa.ID_AWA})">
              Activar
            </button>
            <button class="btn btn-primary btn-sm" onclick="configurarAWA(${awa.ID_AWA})">
              Configurar
            </button>
          </div>
        </div>
      </div>
    `;

    contenedor.appendChild(col);
  });
}

cargarAWAS();