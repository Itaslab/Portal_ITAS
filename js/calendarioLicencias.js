//calendarioLicencias.js

document.addEventListener("DOMContentLoaded", () => {

const filtroMes = document.getElementById("filtroMes");
const contenedor = document.getElementById("contenedorCalendario");
const filtroGrupo = document.getElementById("filtroGrupo");
const filtroSubgrupo = document.getElementById("filtroSubgrupo");

const fechaDesde = document.getElementById("fechaDesde");
const fechaHasta = document.getElementById("fechaHasta");

if (fechaDesde && fechaHasta) {

  fechaDesde.addEventListener("change", () => {

    fechaHasta.min = fechaDesde.value;

    if (fechaHasta.value && fechaHasta.value < fechaDesde.value) {
      fechaHasta.value = fechaDesde.value;
    }

  });

}

// MODAL
const modalCrearLicencia = new bootstrap.Modal(
  document.getElementById("modalCrearLicencia")
);

document.getElementById("btnCrearLicencia").addEventListener("click", () => {
  modalCrearLicencia.show();
});


document.getElementById("btnCargarLicencia").addEventListener("click", async () => {

  const tipo = document.getElementById("tipoLicencia").value;
  const desde = document.getElementById("fechaDesde").value;
  const hasta = document.getElementById("fechaHasta").value;
  const comentario = document.getElementById("comentarioLicencia").value;

  if (!tipo || !desde || !hasta) {
    alert("Completá los campos obligatorios");
    return;
  }

  try {

    const response = await fetch(`${basePath}/api/licencias`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        tipoLic: tipo,
        fechaDesde: desde,
        fechaHasta: hasta,
        comentario: comentario
      })
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error);
    }

    alert("Licencia cargada correctamente");

    modalCrearLicencia.hide();

    renderCalendario();

  } catch (error) {

    console.error(error);
    alert("Error al cargar licencia");

  }

});


const modalMisLicencias = new bootstrap.Modal(
  document.getElementById("modalMisLicencias")
);

document.getElementById("btnVerMisLicencias").addEventListener("click", async () => {

  try {

    const res = await fetch(`${basePath}/api/mis-licencias`);
    const licencias = await res.json();

    const tabla = document.getElementById("tablaMisLicencias");
    tabla.innerHTML = "";

    licencias.forEach(l => {


      let estadoColor = "secondary";

      if (l.Estado === "PENDING") estadoColor = "warning";
      if (l.Estado === "APROBADA") estadoColor = "success";
      if (l.Estado === "RECHAZADA") estadoColor = "danger";


      const fila = `
        <tr>
          <td>${l.TipoLic}</td>
          <td>${l.Fecha_Desde.split("T")[0]}</td>
          <td>${l.Fecha_Hasta.split("T")[0]}</td>
          <td>
          <span class="badge bg-${estadoColor}">
              ${l.Estado}
          </span>
          </td>
        </tr>
      `;

      tabla.innerHTML += fila;

    });

    modalMisLicencias.show();

  } catch (error) {

    console.error("Error cargando licencias", error);

  }

});



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


function parseFechaLocal(fechaStr) {
  if (!fechaStr) return null;

  const [year, month, day] = fechaStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}


  async function cargarLicenciasDesdeBackend(year, month, grupo,subgrupo) {

  try {

    const url = `${basePath}/api/licencias/mes?year=${year}&month=${month}&grupo=${grupo || ""}&subgrupo=${subgrupo || ""}`;
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

async function cargarSubgrupos(grupo) {
  try {

    const response = await fetch(`${basePath}/api/licencias/subgrupos?grupo=${grupo}`);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Error desconocido");
    }

    return result.data;

  } catch (error) {
    console.error("Error cargando subgrupos:", error);
    return [];
  }
}


  async function renderCalendario() {

  const [year, month] = filtroMes.value.split("-").map(Number);
  const grupo = document.getElementById("filtroGrupo").value;
  const subgrupo = filtroSubgrupo.value;
  

  const dias = obtenerDiasDelMes(year, month);

  // 🔹 Traemos licencias reales
const licencias = await cargarLicenciasDesdeBackend(year, month, grupo, subgrupo);
  // 🔹 Agrupar por usuario
const grupoSeleccionado = filtroGrupo.value;
const modoTodos = !grupoSeleccionado;

let estructura = [];

if (modoTodos) {

  const gruposMap = {};

  licencias.forEach(l => {
    const grupoNombre = l.Grupo || "Sin Grupo";
    const id = l.ID_Usuario;

    if (!gruposMap[grupoNombre]) {
      gruposMap[grupoNombre] = {};
    }

    if (!gruposMap[grupoNombre][id]) {
      gruposMap[grupoNombre][id] = {
        id: id,
        nombre: `${l.Apellido} ${l.Nombre}`,
        licencias: []
      };
    }

    gruposMap[grupoNombre][id].licencias.push(l);
  });

  estructura = Object.keys(gruposMap)
    .sort()
    .map(grupoNombre => ({
      tipo: "grupo",
      nombre: grupoNombre,
      usuarios: Object.values(gruposMap[grupoNombre])
        .sort((a,b) => a.nombre.localeCompare(b.nombre))
    }));

} else {

  const usuariosMap = {};

  licencias.forEach(l => {
    const id = l.ID_Usuario;

    if (!usuariosMap[id]) {
      usuariosMap[id] = {
        id: id,
        nombre: `${l.Apellido} ${l.Nombre}`,
        licencias: []
      };
    }

    usuariosMap[id].licencias.push(l);
  });

  estructura = [{
    tipo: "normal",
    usuarios: Object.values(usuariosMap)
      .sort((a,b) => a.nombre.localeCompare(b.nombre))
  }];
}


if (estructura.length === 0 || estructura.every(b => b.usuarios.length === 0)) {
    contenedor.innerHTML = `
    <div class="alert alert-info mt-3">
      No hay licencias para los filtros seleccionados.
    </div>
  `;
  return;
}

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

estructura.forEach(bloque => {

  if (bloque.tipo === "grupo") {
html += `<tr class="fila-grupo">`;

// Primera columna (Usuario)
html += `<td class="col-usuario grupo-titulo">${bloque.nombre}</td>`;

// Resto de columnas vacías
const hoy = new Date();

dias.forEach(dia => {

  const esFinSemana = dia.getDay() === 0 || dia.getDay() === 6;

  const esHoy =
    dia.getDate() === hoy.getDate() &&
    dia.getMonth() === hoy.getMonth() &&
    dia.getFullYear() === hoy.getFullYear();

  let clases = "";

  if (esFinSemana) clases += " fin-semana";
  if (esHoy) clases += " hoy";

  html += `<td class="${clases}"></td>`;

});

html += `</tr>`;
  }

  bloque.usuarios.forEach(usuario => {

    html += `<tr>`;
    html += `<td class="col-usuario">${usuario.nombre}</td>`;

    dias.forEach(dia => {

      const esFinSemana = dia.getDay() === 0 || dia.getDay() === 6;

      const licenciaDelDia = usuario.licencias.find(l => {

        const desde = parseFechaLocal(l.Fecha_Desde);
        const hasta = parseFechaLocal(l.Fecha_Hasta);

        const diaTime = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate()).getTime();
        const desdeTime = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate()).getTime();
        const hastaTime = new Date(hasta.getFullYear(), hasta.getMonth(), hasta.getDate()).getTime();

        return diaTime >= desdeTime && diaTime <= hastaTime;
      });

      let letra = "";
      let claseLicencia = "";

      if (licenciaDelDia) {
        claseLicencia = "licencia-activa";

        switch (licenciaDelDia.TipoLic) {
          case "VACACIONES": letra = "V"; claseLicencia += " tipo-vacaciones"; break;
          case "COMPENSACIÓN DIA": letra = "CD"; claseLicencia += " tipo-compensacion"; break;
          case "ENFERMEDAD": letra = "E"; claseLicencia += " tipo-enfermedad"; break;
          case "MUDANZA": letra = "M"; claseLicencia += " tipo-mudanza"; break;
          case "NACIMIENTO": letra = "N"; claseLicencia += " tipo-nacimiento"; break;
          case "ACCIDENTE": letra = "A"; claseLicencia += " tipo-accidente"; break;
          case "PARO/ASAMBLEA": letra = "PA"; claseLicencia += " tipo-paro"; break;
          case "OTRA": letra = "O"; claseLicencia += " tipo-otra"; break;
          case "COMPENSACIÓN HORAS": letra = "CH"; claseLicencia += " tipo-compensacion-horas"; break;
          case "EXAMEN": letra = "EX"; claseLicencia += " tipo-examen"; break;
        }
      }

      html += `
        <td class="celda-dia ${esFinSemana ? "fin-semana" : ""} ${claseLicencia}" 
            title="${letra ? licenciaDelDia.TipoLic : ''}">
          ${letra}
        </td>
      `;
    });

    html += `</tr>`;
  });
});

html += `</tbody></table>`;
contenedor.innerHTML = html;
}

  filtroGrupo.addEventListener("change", async () => {
  const grupoSeleccionado = filtroGrupo.value;

  if (!grupoSeleccionado) {
    filtroSubgrupo.innerHTML = `<option value="">Todos</option>`;
    filtroSubgrupo.disabled = true;
    renderCalendario();
    return;
  }

  const subgrupos = await cargarSubgrupos(grupoSeleccionado);

  filtroSubgrupo.innerHTML = `<option value="">Todos</option>`;

  subgrupos.forEach(sg => {
    const option = document.createElement("option");
    option.value = sg.Subgrupo;
    option.textContent = sg.Subgrupo;
    filtroSubgrupo.appendChild(option);
  });

  filtroSubgrupo.disabled = false;
  filtroSubgrupo.value = "";

  renderCalendario();
});

filtroSubgrupo.addEventListener("change", renderCalendario);
filtroMes.addEventListener("change", renderCalendario);
generarOpcionesMes();
renderCalendario();

});

// CREAR LICENCIAS 

