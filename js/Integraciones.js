const tablaPedidos = document.getElementById("tablaPedidos");
const chkMisPedidos = document.getElementById("chkMisPedidos");

let pedidos = [];
const tipoBusqueda =
  document.getElementById("tipoBusqueda");

const valorBusqueda =
  document.getElementById("valorBusqueda");

const lblValorBusqueda =
  document.getElementById("lblValorBusqueda");

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
    const resultado =
      pedido.Estado === "Finalizado"
        ? `<button
             class="btn btn-success btn-sm"
             onclick="verResultado(${pedido.IdPedido})"
           >
             Ver Resultado
           </button>`
        : "-";

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

        if (justificacion.length < 10) {
          alert(
            "La justificación debe contener al menos 10 caracteres"
          );
          return;
        }

      if (!tipoBusqueda.value) {
        alert("Debe seleccionar un tipo de búsqueda");
        return;
      }
      
      if (!valorBusqueda.value.trim()) {
        alert("Debe ingresar un valor");
        return;
      }
      
      const body = {
        Servicio: document.getElementById("integracion").value,
      
        Linea:
          tipoBusqueda.value === "Linea"
            ? valorBusqueda.value
            : null,
      
        Subscriber:
          tipoBusqueda.value === "Subscriber"
            ? valorBusqueda.value
            : null,
      
        Cuenta:
          tipoBusqueda.value === "Cuenta"
            ? valorBusqueda.value
            : null,
      
        Customer:
          tipoBusqueda.value === "Customer"
            ? valorBusqueda.value
            : null,
      
        Justificacion: justificacion,
      };

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
      tipoBusqueda.selectedIndex = 0;
      valorBusqueda.value = "";
      valorBusqueda.disabled = true;
      document.getElementById("justificacion").value = "";
      lblValorBusqueda.textContent = "Valor";

      cargarPedidos();
    } catch (error) {
      console.error(error);
      alert("Error al crear pedido");
    }
  });
  valorBusqueda.disabled = true;

cargarPedidos();

tipoBusqueda.addEventListener("change", () => {

  valorBusqueda.value = "";

  if (!tipoBusqueda.value) {

    valorBusqueda.disabled = true;
    lblValorBusqueda.textContent = "Valor";

    return;
  }

  valorBusqueda.disabled = false;

  switch (tipoBusqueda.value) {

    case "Linea":
  lblValorBusqueda.textContent = "Número de Línea";
  valorBusqueda.placeholder = "Ej: 1134567890";
  break;

case "Subscriber":
  lblValorBusqueda.textContent = "Subscriber";
  valorBusqueda.placeholder = "Ej: 12345678";
  break;

case "Cuenta":
  lblValorBusqueda.textContent = "Cuenta";
  valorBusqueda.placeholder = "Ej: 1003241268410001";
  break;

case "Customer":
  lblValorBusqueda.textContent = "Customer";
  valorBusqueda.placeholder = "Ej: 81001971268";
  break;
  }
});
valorBusqueda.addEventListener("input", () => {

  valorBusqueda.value =
    valorBusqueda.value.replace(/\D/g, "");

});