// ejecuciones.js
 
document.addEventListener("DOMContentLoaded", () => {
  const tabla = document.getElementById("tablaEjecuciones");
  const filtroSolicitante = document.getElementById("filtroSolicitante");
  const filtroRegistro = document.getElementById("filtroRegistro");
 
  let ejecuciones = [];
 
  // 🔹 Cargar datos desde backend
  async function cargarEjecuciones() {
    try {
      const res = await fetch("/ejecuciones");
      const data = await res.json();
 
      if (!data.success) {
        console.error("Error en backend:", data.error);
        return;
      }
 
    ejecuciones = data.data.map(item => ({
        id: item.Id_Tasklist,
        flujo: item.Titulo_Tasklist,
        usuario: item.Id_Usuario,
        estado: item.Id_Estado,
        avance: item.Avance,
        resultado: item.Resultado
    }));
 
      renderTabla();
    } catch (err) {
      console.error("Error al obtener ejecuciones:", err);
    }
  }
 
  // 🔹 Renderizar tabla con filtros
  function renderTabla() {
    const solicitante = filtroSolicitante.value.toLowerCase();
    const registro = filtroRegistro.value.toLowerCase();
 
    tabla.innerHTML = "";
 
    ejecuciones
      .filter(item => {
        const coincideSolicitante = solicitante ? item.usuario.toLowerCase() === solicitante : true;
        const coincideRegistro = registro ? item.id.toString().includes(registro) : true;
        return coincideSolicitante && coincideRegistro;
      })
      .forEach(ejec => {
        const row = document.createElement("tr");
        let clase = "";
 
        if (ejec.estado === "Completada") clase = "table-success";
        else if (ejec.estado === "En proceso") clase = "table-warning";
        else if (ejec.estado === "Error") clase = "table-danger";
 
        row.className = clase;
        row.innerHTML = `
          <td>${ejec.id}</td>
          <td>${ejec.flujo}</td>
          <td>${ejec.usuario}</td>
          <td>${ejec.estado}</td>
          <td>${ejec.avance}</td>
          <td>${ejec.resultado}</td>
        `;
        tabla.appendChild(row);
      });
  }
 
  // 🔹 Eventos de filtros
  filtroSolicitante.addEventListener("change", renderTabla);
  filtroRegistro.addEventListener("input", renderTabla);
 
  // 🔹 Cargar al abrir
  cargarEjecuciones();
 
  // 🔹 (Opcional) Refrescar cada 10s para ver cambios en vivo
  setInterval(cargarEjecuciones, 10000);
});
 
// Botón "Solicitar ejecución"
const btnSolicitar = document.getElementById("btnSolicitar");
btnSolicitar.addEventListener("click", () => {
  window.location.href = "SolicitarEjecucion.html";
});