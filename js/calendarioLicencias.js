//calendarioLicencias.js

document.addEventListener("DOMContentLoaded", () => {

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


  async function cargarLicenciasDesdeBackend(year, month, grupo) {

  try {

    const url = `${basePath}/api/licencias/mes?year=${year}&month=${month}&grupo=${grupo || ""}`;
    const response = await fetch(url);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Error desconocido");
    }

    return result.data;

  } catch (error) {
    console.error("Error cargando licencias:", error);
    return [];
  }
}

  async function renderCalendario() {

  const [year, month] = filtroMes.value.split("-").map(Number);
  const grupo = document.getElementById("filtroGrupo").value;

  const dias = obtenerDiasDelMes(year, month);

  // 🔹 Traemos licencias reales
  const licencias = await cargarLicenciasDesdeBackend(year, month, grupo);

  // 🔹 Agrupar por usuario
const usuariosMap = {};

licencias.forEach(l => {
  const id = l.IdUsuario;

  if (!usuariosMap[id]) {
    usuariosMap[id] = {
      id: id,
      nombre: `${l.Apellido} ${l.Nombre}`,
      licencias: []
    };
  }

  usuariosMap[id].licencias.push(l);
});

const usuarios = Object.values(usuariosMap);

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

      // 🔹 Verificar si ese día tiene licencia
const licenciaDelDia = usuario.licencias.find(l => {
  const desde = new Date(l.Fecha_Desde);
  const hasta = new Date(l.Fecha_Hasta);

  const diaTime = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate()).getTime();
  const desdeTime = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate()).getTime();
  const hastaTime = new Date(hasta.getFullYear(), hasta.getMonth(), hasta.getDate()).getTime();

  return diaTime >= desdeTime && diaTime <= hastaTime;
});


let letra = "";
let claseLicencia = "";

if (licenciaDelDia) {
  claseLicencia = "licencia-activa"; // clase base para todas

  switch (licenciaDelDia.TipoLic) {
    case "VACACIONES":
      letra = "V";
      claseLicencia += " tipo-vacaciones";
      break;
    case "COMPENSACIÓN DIA":
      letra = "C";
      claseLicencia += " tipo-compensacion";
      break;
    case "ENFERMEDAD":
      letra = "E";
      claseLicencia += " tipo-enfermedad";
      break;
    case "MUDANZA":
      letra = "M";
      claseLicencia += " tipo-mudanza";
      break;
    case "NACIMIENTO":
      letra = "N";
      claseLicencia += " tipo-nacimiento";
      break;
  }
}

html += `
  <td class="celda-dia ${esFinSemana ? "fin-semana" : ""} ${claseLicencia}">
    ${letra}
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
  renderCalendario();
  document.getElementById("filtroGrupo").addEventListener("change", renderCalendario);

});