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

      // 🧩 Adaptamos los campos según tu nuevo SELECT SQL
      ejecuciones = data.data.map(item => ({
        id: item.Id_Tasklist,
        flujo: item.Titulo_Tasklist,
        identificador: item.Identificador,
        usuario: item.Email,         // 👈 ahora muestra el email del usuario
        estado: item.Estado,         // 👈 texto del estado (no el ID)
        avance: item.Avance,
        resultado: item.Resultado,
        fechaInicio: item.Fecha_Inicio,
        fechaFin: item.Fecha_Fin
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
        const coincideSolicitante = solicitante ? item.usuario.toLowerCase().includes(solicitante) : true;
        const coincideRegistro = registro ? item.id.toString().includes(registro) : true;
        return coincideSolicitante && coincideRegistro;
      })
      .forEach(ejec => {
        const row = document.createElement("tr");
        let clase = "";

        if (ejec.estado.toLowerCase().includes("ok")) clase = "table-success";
        else if (ejec.estado.toLowerCase().includes("proceso")) clase = "table-warning";
        else if (ejec.estado.toLowerCase().includes("error")) clase = "table-danger";

        row.className = clase;
        row.innerHTML = `
          <td>${ejec.id}</td>
          <td>${ejec.flujo}</td>
          <td>${ejec.usuario}</td>
          <td>${ejec.estado}</td>
          <td>${ejec.avance}%</td>
          <td>${ejec.resultado}</td>
          <td>${formatearFecha(ejec.fechaInicio)}</td>
          <td>${formatearFecha(ejec.fechaFin)}</td>
        `;
        tabla.appendChild(row);
      });
  }

  // 🔹 Función auxiliar para formatear fechas
  function formatearFecha(fecha) {
    if (!fecha) return "-";
    const d = new Date(fecha);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
  }

  // 🔹 Eventos de filtros
  filtroSolicitante.addEventListener("change", renderTabla);
  filtroRegistro.addEventListener("input", renderTabla);

  // 🔹 Cargar al abrir
  cargarEjecuciones();

  // 🔹 Refrescar cada 10 segundos (opcional)
  setInterval(cargarEjecuciones, 10000);
});

// Botón "Solicitar ejecución"
const btnSolicitar = document.getElementById("btnSolicitar");
btnSolicitar.addEventListener("click", () => {
  window.location.href = "SolicitarEjecucion.html";
});
