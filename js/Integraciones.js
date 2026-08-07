const tablaPedidos = document.getElementById("tablaPedidos");
const chkMisPedidos = document.getElementById("chkMisPedidos");

let pedidos = [];

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

      if (!justificacion) {
        alert("La justificación es obligatoria");
        return;
      }

      const body = {
        Servicio: document.getElementById("integracion").value,
        Linea: document.getElementById("linea")?.value || null,
        Subscriber: document.getElementById("subscriber")?.value || null,
        Cuenta: document.getElementById("cuenta")?.value || null,
        Customer: document.getElementById("customer").value,
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

      cargarPedidos();
    } catch (error) {
      console.error(error);
      alert("Error al crear pedido");
    }
  });

cargarPedidos();
