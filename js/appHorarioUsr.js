// appHorariosUsr.js
// Lógica de la pantalla de Horarios: trae la grilla, agrupa por usuario,
// arma los filtros de Grupo/Subgrupo y abre el modal de detalle.

document.addEventListener("DOMContentLoaded", () => {
  cargarHorarios();

  document
    .getElementById("selGrupo")
    .addEventListener("change", aplicarFiltros);
  document
    .getElementById("selSubgrupo")
    .addEventListener("change", aplicarFiltros);
  document
    .getElementById("txtBuscar")
    .addEventListener("input", aplicarFiltros);
});

// Guardamos los datos ya agrupados en memoria para no volver a pedirlos
// cada vez que el usuario filtra o busca.
let usuariosData = [];

// =========================================================
// CARGA INICIAL
// =========================================================

async function cargarHorarios() {
  try {
    const res = await fetch(`${API_URL}/horarios`);
    const data = await res.json();

    if (!data.success) {
      console.error(data.mensaje);
      return;
    }

    usuariosData = agruparPorUsuario(data.horarios);

    armarFiltros(usuariosData);
    renderTabla(usuariosData);
  } catch (error) {
    console.error("Error cargando horarios:", error);
  }
}

// =========================================================
// AGRUPAR FILAS CRUDAS (una por día) EN UN OBJETO POR USUARIO
// =========================================================

function agruparPorUsuario(filas) {
  const mapa = new Map();

  filas.forEach((fila) => {
    if (!mapa.has(fila.ID_Usuario)) {
      mapa.set(fila.ID_Usuario, {
        id_usuario: fila.ID_Usuario,
        legajo: fila.Legajo,
        nombre: fila.Nombre,
        apellido: fila.Apellido,
        grupo: fila.Grupo,
        subgrupo: fila.Subgrupo,
        dias: [],
      });
    }

    // Si el usuario todavía no tiene horario, Dia_Semana viene NULL
    // (por el LEFT JOIN) y no lo agregamos a la lista de días.
    if (fila.Dia_Semana) {
      mapa.get(fila.ID_Usuario).dias.push({
        dia: fila.Dia_Semana,
        in1: fila.Hora_In1,
        out1: fila.Hora_Out1,
        in2: fila.Hora_In2,
        out2: fila.Hora_Out2,
        modalidad: fila.Modalidad,
        edificio: fila.Edificio,
      });
    }
  });

  return Array.from(mapa.values());
}

// =========================================================
// FILTROS (Grupo / Subgrupo / Buscador)
// =========================================================

function armarFiltros(usuarios) {
  const selGrupo = document.getElementById("selGrupo");
  const grupos = [...new Set(usuarios.map((u) => u.grupo))].sort();

  grupos.forEach((grupo) => {
    const opt = document.createElement("option");
    opt.value = grupo;
    opt.textContent = grupo;
    selGrupo.appendChild(opt);
  });

  selGrupo.addEventListener("change", () => armarSubgrupos(usuarios));
}

function armarSubgrupos(usuarios) {
  const grupoSeleccionado = document.getElementById("selGrupo").value;
  const selSubgrupo = document.getElementById("selSubgrupo");

  selSubgrupo.innerHTML = '<option value="">Todos</option>';

  const subgrupos = [
    ...new Set(
      usuarios
        .filter((u) => !grupoSeleccionado || u.grupo === grupoSeleccionado)
        .map((u) => u.subgrupo),
    ),
  ].sort();

  subgrupos.forEach((subgrupo) => {
    const opt = document.createElement("option");
    opt.value = subgrupo;
    opt.textContent = subgrupo;
    selSubgrupo.appendChild(opt);
  });
}

function aplicarFiltros() {
  const grupo = document.getElementById("selGrupo").value;
  const subgrupo = document.getElementById("selSubgrupo").value;
  const busqueda = document
    .getElementById("txtBuscar")
    .value.trim()
    .toLowerCase();

  const filtrados = usuariosData.filter((u) => {
    const matchGrupo = !grupo || u.grupo === grupo;
    const matchSubgrupo = !subgrupo || u.subgrupo === subgrupo;
    const matchBusqueda =
      !busqueda || `${u.nombre} ${u.apellido}`.toLowerCase().includes(busqueda);

    return matchGrupo && matchSubgrupo && matchBusqueda;
  });

  renderTabla(filtrados);
}

// =========================================================
// RENDER TABLA PRINCIPAL
// =========================================================

function renderTabla(usuarios) {
  const tbody = document.getElementById("tblHorariosBody");
  tbody.innerHTML = "";

  usuarios.forEach((u) => {
    const configurado = u.dias.length > 0;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${u.apellido}, ${u.nombre}</td>
      <td>${u.grupo}</td>
      <td>${u.subgrupo}</td>
      <td>
        ${
          configurado
            ? '<span class="badge bg-success">Configurado</span>'
            : '<span class="badge bg-warning text-dark">Sin horario</span>'
        }
      </td>
      <td>
        <button class="btn btn-sm btn-outline-primary" onclick="verDetalle(${u.id_usuario})">
          Ver
        </button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

// =========================================================
// MODAL DE DETALLE
// =========================================================

async function verDetalle(idUsuario) {
  // Traemos el nombre/apellido de lo que ya tenemos en memoria (para el
  // título del modal), pero los DÍAS los pedimos siempre al servidor
  // para asegurarnos de mostrar datos frescos.
  const usuario = usuariosData.find((u) => u.id_usuario === idUsuario);
  if (!usuario) return;

  document.getElementById("modalHorarioTitulo").textContent =
    `${usuario.apellido}, ${usuario.nombre}`;

  document.getElementById("btnModificarHorario").onclick = () => {
    // Acá enganchamos más adelante la pantalla/modal de modificación
    modificarHorario(idUsuario);
  };

  // Mostramos el modal con un estado de carga mientras llega la respuesta.
  document.getElementById("tblDetalleBody").innerHTML = `
    <tr>
      <td colspan="7" class="text-center text-muted">Cargando...</td>
    </tr>
  `;

  const modal = new bootstrap.Modal(document.getElementById("modalHorario"));
  modal.show();

  try {
    const res = await fetch(`${API_URL}/horarios/${idUsuario}`);
    const data = await res.json();

    if (!data.success) {
      console.error(data.mensaje);
      document.getElementById("tblDetalleBody").innerHTML = `
        <tr>
          <td colspan="7" class="text-center text-danger">
            Error al cargar el horario.
          </td>
        </tr>
      `;
      return;
    }

    const dias = data.horarios.map((fila) => ({
      dia: fila.Dia_Semana,
      in1: fila.Hora_In1,
      out1: fila.Hora_Out1,
      in2: fila.Hora_In2,
      out2: fila.Hora_Out2,
      modalidad: fila.Modalidad,
      edificio: fila.Edificio,
    }));

    renderDetalle(dias);
  } catch (error) {
    console.error("Error obteniendo el detalle del horario:", error);
    document.getElementById("tblDetalleBody").innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-danger">
          Error al cargar el horario.
        </td>
      </tr>
    `;
  }
}

function renderDetalle(dias) {
  const tbody = document.getElementById("tblDetalleBody");
  tbody.innerHTML = "";

  const ordenDias = [
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
    "Domingo",
  ];

  if (dias.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-muted">
          Sin horario configurado
        </td>
      </tr>
    `;
    return;
  }

  const diasOrdenados = [...dias].sort(
    (a, b) => ordenDias.indexOf(a.dia) - ordenDias.indexOf(b.dia),
  );

  diasOrdenados.forEach((d) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${d.dia}</td>
      <td>${d.in1 ?? "-"}</td>
      <td>${d.out1 ?? "-"}</td>
      <td>${d.in2 ?? "-"}</td>
      <td>${d.out2 ?? "-"}</td>
      <td>${d.modalidad ?? "-"}</td>
      <td>${d.edificio ?? "-"}</td>
    `;

    tbody.appendChild(tr);
  });
}

// =========================================================
// MODIFICAR HORARIO (placeholder — próximo paso)
// =========================================================

function modificarHorario(idUsuario) {
  console.log("Modificar horario de usuario:", idUsuario);
  // Acá va la lógica del próximo endpoint (POST/PUT) y su formulario.
}
