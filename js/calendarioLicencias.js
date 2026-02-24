document.addEventListener("DOMContentLoaded", () => {

  const filtroMes = document.getElementById("filtroMes");
  const filtroGrupo = document.getElementById("filtroGrupo");
  const contenedor = document.getElementById("contenedorCalendario");

  let datosLicencias = [];

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

  async function cargarLicencias() {

    const [year, month] = filtroMes.value.split("-");
    const grupo = filtroGrupo.value;

    const response = await fetch(`/api/licencias/mes?year=${year}&month=${month}&grupo=${grupo}`);
    const json = await response.json();

    if (json.success) {
      datosLicencias = json.data;
      renderCalendario();
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

  function agruparPorUsuario(data) {
    const mapa = {};

    data.forEach(reg => {
      const id = reg.IdUsuario;

      if (!mapa[id]) {
        mapa[id] = {
          id,
          nombre: `${reg.Apellido} ${reg.Nombre}`,
          licencias: []
        };
      }

      mapa[id].licencias.push({
        desde: new Date(reg.Fecha_Desde),
        hasta: new Date(reg.Fecha_Hasta),
        tipo: reg.TipoLic
      });
    });

    return Object.values(mapa);
  }

  function renderCalendario() {

    const [year, month] = filtroMes.value.split("-").map(Number);
    const dias = obtenerDiasDelMes(year, month);

    const usuarios = agruparPorUsuario(datosLicencias);

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

        let contenido = "";

        usuario.licencias.forEach(lic => {
          if (dia >= lic.desde && dia <= lic.hasta) {
            contenido = lic.tipo;
          }
        });

        html += `
          <td class="celda-dia ${esFinSemana ? "fin-semana" : ""}">
            ${contenido}
          </td>
        `;
      });

      html += `</tr>`;
    });

    html += `</tbody></table>`;

    contenedor.innerHTML = html;
  }

  filtroMes.addEventListener("change", cargarLicencias);
  filtroGrupo.addEventListener("change", cargarLicencias);

  generarOpcionesMes();
  cargarLicencias();

});