const pedidos = [];

const tablaPedidos = document.getElementById("tablaPedidos");
const chkMisPedidos = document.getElementById("chkMisPedidos");

const usuarioActual = "Gabriel Mallorquin";

function renderPedidos() {

  let lista = pedidos;

  if (chkMisPedidos.checked) {
    lista = pedidos.filter(
      p => p.usuario === usuarioActual
    );
  }

  tablaPedidos.innerHTML = "";

  lista.forEach(pedido => {

    const resultado =
      pedido.estado === "Finalizado"
        ? `<button class="btn btn-success btn-sm">
             Ver Resultado
           </button>`
        : "-";

    tablaPedidos.innerHTML += `
      <tr>
        <td>${pedido.id}</td>
        <td>${pedido.fecha}</td>
        <td>${pedido.usuario}</td>
        <td>${pedido.integracion}</td>
        <td>${pedido.estado}</td>
        <td>${resultado}</td>
      </tr>
    `;
  });
}

document
  .getElementById("btnCrearPedido")
  .addEventListener("click", () => {

    const justificacion =
      document.getElementById("justificacion").value.trim();

    if (!justificacion) {
      alert("La justificación es obligatoria");
      return;
    }

    pedidos.unshift({
      id: pedidos.length + 1,
      fecha: new Date().toLocaleString(),
      usuario: usuarioActual,
      integracion: document.getElementById("integracion").value,
      linea: document.getElementById("linea").value,
      subscriber: document.getElementById("subscriber").value,
      cuenta: document.getElementById("cuenta").value,
      customer: document.getElementById("customer").value,
      justificacion,
      estado: "Pendiente"
    });

    renderPedidos();

    bootstrap.Modal
      .getInstance(document.getElementById("nuevoPedidoModal"))
      .hide();
  });

chkMisPedidos.addEventListener("change", renderPedidos);

renderPedidos();