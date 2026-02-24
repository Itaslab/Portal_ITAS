//calendarioLicencias.js

// Función para cargar las licencias desde el backend
async function cargarLicenciasDesdeBackend() {
  try {
    const response = await fetch(basePath + '/backend/galeriaLicencias.js'); // Usando basePath
    if (!response.ok) {
      throw new Error('Error al obtener las licencias desde el backend');
    }
    return await response.json();
  } catch (error) {
    console.error('Error al cargar las licencias:', error);
    return [];
  }
}

// Función para cargar los usuarios desde el backend
async function cargarUsuariosDesdeBackend() {
  try {
    const response = await fetch(basePath + '/backend/usuarios.js'); // Usando basePath
    if (!response.ok) {
      throw new Error('Error al obtener los usuarios desde el backend');
    }
    return await response.json();
  } catch (error) {
    console.error('Error al cargar los usuarios:', error);
    return [];
  }
}

document.addEventListener("DOMContentLoaded", async () => {

  const filtroMes = document.getElementById("filtroMes");
  const contenedor = document.getElementById("contenedorCalendario");

  function generarOpcionesMes() {
    const hoy = new Date();

    for (let i = -3; i <= 3; i++) {
      const fecha = new Date(hoy.getFullYear(), hoy.getMonth() + i, 1);
      const year = fecha.getFullYear();
      const month = String(fecha.getMonth() + 1).padStart(2, "0");

      const option = document.createElement("option");
      option.value = `${year}-${month}`;
      option.textContent = `${year}-${month}`;

      if (i === 0) option.selected = true;

      filtroMes.appendChild(option);
    }
  }

  function obtenerDiasDelMes(year, month) {
    const dias = [];
    const fecha = new Date(year, month, 0);
    const totalDias = fecha.getDate();

    for (let i = 1; i <= totalDias; i++) {
      dias.push(new Date(year, month - 1, i));
    }

    return dias;
  }

  async function renderCalendario() {
    const [year, month] = filtroMes.value.split("-").map(Number);
    const dias = obtenerDiasDelMes(year, month);
    const licencias = await cargarLicenciasDesdeBackend();
    const usuarios = await cargarUsuariosDesdeBackend();

    let html = `
      <table class="calendario-table">
        <thead>
          <tr>
            <th class="col-usuario">Usuario</th>
    `;

    dias.forEach(dia => {
      const diaSemana = dia.toLocaleDateString("es-ES", { weekday: "short" });
      const numero = dia.getDate();
      const esFinSemana = dia.getDay() === 0 || dia.getDay() === 6;

      html += `
        <th class="dia-header ${esFinSemana ? "fin-semana" : ""}">
          <div class="nombre-dia">${diaSemana}</div>
          <div>${numero}</div>
        </th>
      `;
    });

    html += `</tr></thead><tbody>`;

    usuarios.forEach(usuario => {
      html += `<tr>`;
      html += `<td class="col-usuario">${usuario.nombre}</td>`;

      dias.forEach(dia => {
        const esFinSemana = dia.getDay() === 0 || dia.getDay() === 6;
        const licencia = licencias.find(l => l.usuarioId === usuario.id && new Date(l.fecha).toDateString() === dia.toDateString());

        html += `
          <td class="celda-dia ${esFinSemana ? "fin-semana" : ""}">
            ${licencia ? `<span class='licencia'>${licencia.descripcion}</span>` : ""}
          </td>
        `;
      });

      html += `</tr>`;
    });

    html += `</tbody></table>`;

    contenedor.innerHTML = html;
  }

  filtroMes.addEventListener("change", renderCalendario);

  generarOpcionesMes();
  await renderCalendario();

});