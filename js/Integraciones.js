const tablaPedidos = document.getElementById("tablaPedidos");
const chkMisPedidos = document.getElementById("chkMisPedidos");
const integracion =  document.getElementById("integracion");
const contenedorBusqueda =  document.getElementById("contenedorBusqueda");

let pedidos = [];

const configuracionServicios = {

  S020: {
    tipo: "simple",
    opciones: [
      "Linea",
      "Subscriber",
      "Cuenta",
      "Customer"
    ]
  },

  S039: {
    tipo: "simple",
    opciones: [
      "Linea",
      "Subscriber",
      "Cuenta",
      "Customer"
    ]
  },

  S623: {
    tipo: "direccion"
  }

};

function renderFormularioDinamico() {

  const servicio = integracion.value;

  const config =
    configuracionServicios[servicio];

  contenedorBusqueda.innerHTML = "";

  if (config.tipo === "simple") {
    renderBusquedaSimple(config);
  }

  if (config.tipo === "direccion") {
    renderBusquedaDireccion();
  }

}
function renderBusquedaSimple(config) {

  const opciones = config.opciones
    .map(op =>
      `<option value="${op}">
        ${op}
      </option>`
    )
    .join("");

  contenedorBusqueda.innerHTML = `

    <div class="col-md-12">

      <label class="form-label">
        Tipo de búsqueda
      </label>

      <select
        class="form-select"
        id="tipoBusqueda"
      >
        <option value="">
          Seleccione...
        </option>

        ${opciones}

      </select>

    </div>

    <div class="col-md-6">

      <label
        class="form-label"
        id="lblValorBusqueda"
      >
        Valor
      </label>

      <input
        type="text"
        class="form-control"
        id="valorBusqueda"
      >

    </div>

  `;

  const valorBusqueda =
    document.getElementById("valorBusqueda");

  valorBusqueda.addEventListener("input", () => {

    valorBusqueda.value =
      valorBusqueda.value.replace(/\D/g, "");

  });

}
function renderBusquedaDireccion() {

  contenedorBusqueda.innerHTML = `

    <div class="col-md-12">

      <label class="form-label">
        Tipo de ubicación
      </label>

      <select
        class="form-select"
        id="tipoUbicacion"
      >
        <option value="">
          Seleccione...
        </option>

        <option value="CASA">
          CASA
        </option>

        <option value="EDIFICIO">
          EDIFICIO
        </option>

      </select>

    </div>

    <div
      id="camposDireccion"
      class="row g-3 mt-2"
    ></div>

  `;

  document
    .getElementById("tipoUbicacion")
    .addEventListener(
      "change",
      renderCamposDireccion
    );

}
function renderCamposDireccion() {

  const tipo =
    document.getElementById(
      "tipoUbicacion"
    ).value;

  const contenedor =
    document.getElementById(
      "camposDireccion"
    );

    let html = `

<div class="card border-0 shadow-sm mt-3">

  <div class="card-body">

    <div class="row g-3">

      <div class="col-md-12">
        <label class="form-label fw-semibold">
          City *
        </label>

        <input
          type="text"
          class="form-control"
          id="city"
          placeholder="Ej: Buenos Aires"
        >
      </div>

      <div class="col-md-12">
        <label class="form-label fw-semibold">
          Locality *
        </label>

        <input
          type="text"
          class="form-control"
          id="locality"
          placeholder="Ej: Palermo"
        >
      </div>

      <div class="col-md-12">
        <label class="form-label fw-semibold">
          State Or Province *
        </label>

        <input
          type="text"
          class="form-control"
          id="stateOrProvince"
          placeholder="Ej: CABA"
        >
      </div>

      <div class="col-md-12">
        <label class="form-label fw-semibold">
          Street Name *
        </label>

        <input
          type="text"
          class="form-control"
          id="streetName"
          placeholder="Ej: Cabildo"
        >
      </div>

      <div class="col-md-12">
        <label class="form-label fw-semibold">
          Street Nr *
        </label>

        <input
          type="text"
          class="form-control"
          id="streetNr"
          placeholder="Ej: 1234"
        >
      </div>

`;

    if (tipo === "EDIFICIO") {

      html += `
    
        <div class="col-md-12">
          <label class="form-label fw-semibold">
            Departamento *
          </label>
    
          <input
            type="text"
            class="form-control"
            id="departamento"
            placeholder="Ej: A"
          >
        </div>
    
        <div class="col-md-12">
          <label class="form-label fw-semibold">
            Piso *
          </label>
    
          <input
            type="text"
            class="form-control"
            id="piso"
            placeholder="Ej: 5"
          >
        </div>
    
      `;
    }
    html += `

    </div>

  </div>

</div>

`;
  contenedor.innerHTML = html;

}



async function cargarPedidos() {
  try {
    const response = await fetch(`${basePath}/integraciones_grilla`, {
      credentials: "include",
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error);
    }

    pedidos = data.data || [];

    renderPedidos();
  } catch (error) {
    console.error("Error cargando pedidos:", error);
  }
}

function renderPedidos() {
  tablaPedidos.innerHTML = "";

  pedidos.forEach((pedido) => {
    const resultado = `
  <button
    class="btn btn-primary btn-sm"
    onclick="verResultado(${pedido.IdPedido})"
  >
    Ver Resultado
  </button>
`;

    tablaPedidos.innerHTML += `
      <tr>
        <td>${pedido.IdPedido}</td>
        <td>${new Date(pedido.FechaSolicitud).toLocaleString()}</td>
        <td>${pedido.Id_Usuario}</td>
        <td>${pedido.Servicio}</td>
        <td>${pedido.Estado}</td>
        <td>${resultado}</td>
      </tr>
    `;
  });
}

document
  .getElementById("btnCrearPedido")
  .addEventListener("click", async () => {
    try {
      const justificacion = document
        .getElementById("justificacion")
        .value.trim();
        

        if (!justificacion) {
          alert("La justificación es obligatoria");
          return;
        }
        
        if (justificacion.length < 10) {
          alert(
            "La justificación debe contener al menos 10 caracteres"
          );
          return;
        }

      
      
      const servicio =
  document.getElementById("integracion").value;

let body = {
  Servicio: servicio,
  Justificacion: justificacion,
};
if (servicio === "S020" || servicio === "S039") {

  const tipoBusqueda =
    document.getElementById("tipoBusqueda");

  const valorBusqueda =
    document.getElementById("valorBusqueda");

  if (!tipoBusqueda.value) {
    alert("Debe seleccionar un tipo de búsqueda");
    return;
  }

  if (!valorBusqueda.value.trim()) {
    alert("Debe ingresar un valor");
    return;
  }

  body.Linea =
    tipoBusqueda.value === "Linea"
      ? valorBusqueda.value
      : null;

  body.Subscriber =
    tipoBusqueda.value === "Subscriber"
      ? valorBusqueda.value
      : null;

  body.Cuenta =
    tipoBusqueda.value === "Cuenta"
      ? valorBusqueda.value
      : null;

  body.Customer =
    tipoBusqueda.value === "Customer"
      ? valorBusqueda.value
      : null;
}
if (servicio === "S623") {

  const tipoUbicacion =
    document.getElementById("tipoUbicacion");

  if (!tipoUbicacion.value) {
    alert("Debe seleccionar CASA o EDIFICIO");
    return;
  }

  const city =
    document.getElementById("city")?.value.trim();

  const locality =
    document.getElementById("locality")?.value.trim();

  const stateOrProvince =
    document.getElementById("stateOrProvince")?.value.trim();

  const streetName =
    document.getElementById("streetName")?.value.trim();

  const streetNr =
    document.getElementById("streetNr")?.value.trim();

  if (
    !city ||
    !locality ||
    !stateOrProvince ||
    !streetName ||
    !streetNr
  ) {
    alert(
      "Complete todos los campos obligatorios."
    );
    return;
  }

  body.TipoUbicacion =
    tipoUbicacion.value;

  body.City = city;
  body.Locality = locality;
  body.StateOrProvince =
    stateOrProvince;
  body.StreetName =
    streetName;
  body.StreetNr = streetNr;

  if (tipoUbicacion.value === "EDIFICIO") {

    const departamento =
      document.getElementById("departamento")
        ?.value.trim();

    const piso =
      document.getElementById("piso")
        ?.value.trim();

    if (!departamento || !piso) {
      alert(
        "Departamento y Piso son obligatorios."
      );
      return;
    }

    body.Departamento =
      departamento;

    body.Piso = piso;
  }
}

      const response = await fetch(`${basePath}/integraciones`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      console.log(data);

      if (!data.success) {
        throw new Error(data.error);
      }

      bootstrap.Modal.getInstance(
        document.getElementById("nuevoPedidoModal"),
      ).hide();
      document.getElementById("integracion").selectedIndex = 0;
      document.getElementById("justificacion").value = "";

      cargarPedidos();
    } catch (error) {
      console.error(error);
      alert("Error al crear pedido");
    }
  });

cargarPedidos();
integracion.addEventListener(
  "change",
  renderFormularioDinamico
);

renderFormularioDinamico();


function verResultado(idPedido) {

  const pedido = pedidos.find(
    p => p.IdPedido === idPedido
  );

  if (!pedido) {
    return;
  }

  document.getElementById("resultadoEstado").textContent =
    pedido.Estado || "";

  document.getElementById("resultadoFechaInicio").textContent =
    pedido.FechaInicio
      ? new Date(pedido.FechaInicio).toLocaleString()
      : "";

  document.getElementById("resultadoFechaFin").textContent =
    pedido.FechaFin
      ? new Date(pedido.FechaFin).toLocaleString()
      : "";

  document.getElementById("resultadoJson").textContent =
    pedido.ResultadoJson || "";

  document.getElementById("resultadoTexto").value =
    pedido.Resultado || "";

  document.getElementById("resultadoError").value =
    pedido.ErrorDetalle || "";

  const modal = new bootstrap.Modal(
    document.getElementById("resultadoModal")
  );

  modal.show();
}

window.verResultado = verResultado;