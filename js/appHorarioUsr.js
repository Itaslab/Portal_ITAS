// appHorariosUsr.js
// Lógica de la pantalla de Horarios: trae la grilla, agrupa por usuario,
// arma los filtros de Grupo/Subgrupo y abre el modal de detalle.

document.addEventListener("DOMContentLoaded", async () => {
  await cargarPermisos();
  cargarHorarios();

  document.getElementById("selGrupo").addEventListener("change", () => {
    armarSubgrupos(usuariosData);
    aplicarFiltros();
  });

  document
    .getElementById("selSubgrupo")
    .addEventListener("change", aplicarFiltros);

  document
    .getElementById("txtBuscar")
    .addEventListener("input", aplicarFiltros);
});

// Guardamos rol y usuario actual para decidir qué botones "Ver" habilitar.
let esAdmin = false;
let idUsuarioActual = null;

async function cargarPermisos() {
  try {
    const [resPermisos, resMe] = await Promise.all([
      fetch(`${basePath}/permisos`),
      fetch(`${basePath}/me`),
    ]);

    const dataPermisos = await resPermisos.json();
    const dataMe = await resMe.json();

    esAdmin = dataPermisos.esAdmin === true;
    idUsuarioActual = dataMe.usuario ? dataMe.usuario.ID_Usuario : null;
  } catch (error) {
    console.error("Error obteniendo permisos:", error);
  }
}

// Guardamos los datos ya agrupados en memoria para no volver a pedirlos
// cada vez que el usuario filtra o busca.
let usuariosData = [];

// =========================================================
// CARGA INICIAL
// =========================================================

async function cargarHorarios() {
  try {
    const res = await fetch(`${basePath}/horarios`);

    const sesionOk = await verificarSesionValida(res, "horarios");
    if (!sesionOk) return;

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

  // Limpiar el select
  selGrupo.innerHTML = "";

  // Opción "Todos"
  const optTodos = document.createElement("option");
  optTodos.value = "";
  optTodos.textContent = "Todos";
  selGrupo.appendChild(optTodos);

  // Grupos disponibles
  const grupos = [
    ...new Set(usuarios.map((u) => u.grupo).filter(Boolean)),
  ].sort();

  grupos.forEach((grupo) => {
    const opt = document.createElement("option");
    opt.value = grupo;
    opt.textContent = grupo;
    selGrupo.appendChild(opt);
  });

  // Inicializar subgrupos respetando el grupo actual
  armarSubgrupos(usuarios);
}

function armarSubgrupos(usuarios) {
  const grupoSeleccionado = document.getElementById("selGrupo").value;
  const selSubgrupo = document.getElementById("selSubgrupo");

  // Limpiamos el select
  selSubgrupo.innerHTML = "";

  // Opción "Todos"
  const optTodos = document.createElement("option");
  optTodos.value = "";
  optTodos.textContent = "Todos";
  selSubgrupo.appendChild(optTodos);

  // Filtramos los usuarios según el grupo seleccionado
  const usuariosFiltrados = grupoSeleccionado
    ? usuarios.filter((u) => u.grupo === grupoSeleccionado)
    : usuarios;

  // Sacamos únicamente los subgrupos correspondientes
  // a los usuarios del grupo seleccionado
  const subgrupos = [
    ...new Set(usuariosFiltrados.map((u) => u.subgrupo).filter(Boolean)),
  ].sort();

  // Agregamos los subgrupos
  subgrupos.forEach((subgrupo) => {
    const opt = document.createElement("option");
    opt.value = subgrupo;
    opt.textContent = subgrupo;
    selSubgrupo.appendChild(opt);
  });

  // Siempre arrancamos en "Todos"
  selSubgrupo.value = "";
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
    const puedeVer = esAdmin || u.id_usuario === idUsuarioActual;

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
        <button
          class="btn btn-sm btn-outline-primary"
          onclick="verDetalle(${u.id_usuario})"
          ${puedeVer ? "" : 'disabled title="Solo podés ver tu propio horario"'}
        >
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

// Estado del modal actualmente abierto, para poder editarlo.
let diasActuales = [];
let idUsuarioModalActual = null;

const DIAS_SEMANA = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

// Edificios disponibles.
// Para agregar nuevos edificios, simplemente sumarlos a esta lista.
const EDIFICIOS_DISPONIBLES = [
  "BsAs - Optima",
  "BsAs - Golf",
  "BsAs - Hornos",
  "BsAs - Paseo Colon",
];

async function verDetalle(idUsuario) {
  // Traemos el nombre/apellido de lo que ya tenemos en memoria
  // para el título del modal, pero los DÍAS los pedimos siempre
  // al servidor para asegurarnos de mostrar datos frescos.
  const usuario = usuariosData.find((u) => u.id_usuario === idUsuario);
  if (!usuario) return;

  document.getElementById("modalHorarioTitulo").textContent =
    `${usuario.apellido}, ${usuario.nombre}`;

  idUsuarioModalActual = idUsuario;
  resetFooterModal();

  // Mostramos el modal con un estado de carga mientras llega la respuesta.
  document.getElementById("tblDetalleBody").innerHTML = `
    <tr>
      <td colspan="7" class="text-center text-muted">Cargando...</td>
    </tr>
  `;

  const modal = new bootstrap.Modal(document.getElementById("modalHorario"));

  modal.show();

  try {
    const res = await fetch(`${basePath}/horarios/${idUsuario}`);

    const sesionOk = await verificarSesionValida(res, `horarios/${idUsuario}`);

    if (!sesionOk) return;

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

    diasActuales = dias;
    idUsuarioModalActual = idUsuario;

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
    const sinDatos =
      !d.in1 &&
      !d.out1 &&
      !d.in2 &&
      !d.out2 &&
      (!d.modalidad || d.modalidad === "No Aplica");

    const tr = document.createElement("tr");

    if (sinDatos) {
      tr.innerHTML = `
        <td>${d.dia}</td>
        <td colspan="6" class="text-center text-muted">
          No aplica / No trabaja
        </td>
      `;
    } else {
      tr.innerHTML = `
        <td>${d.dia}</td>
        <td>${d.in1 ?? "-"}</td>
        <td>${d.out1 ?? "-"}</td>
        <td>${d.in2 ?? "-"}</td>
        <td>${d.out2 ?? "-"}</td>
        <td>${d.modalidad ?? "-"}</td>
        <td>${d.edificio ?? "-"}</td>
      `;
    }

    tbody.appendChild(tr);
  });
}

// =========================================================
// MODIFICAR HORARIO
// =========================================================

function modificarHorario(idUsuario) {
  renderFormularioEdicion(diasActuales);

  document.getElementById("modalHorarioFooter").innerHTML = `
    <button class="btn btn-success" onclick="guardarHorario()">
      Guardar
    </button>

    <button class="btn btn-secondary" onclick="cancelarEdicion()">
      Cancelar
    </button>
  `;
}

function renderFormularioEdicion(dias) {
  const tbody = document.getElementById("tblDetalleBody");
  tbody.innerHTML = "";

  DIAS_SEMANA.forEach((nombreDia) => {
    const existente = dias.find((d) => d.dia === nombreDia) || {};

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${nombreDia}</td>

      <td>
        <input
          type="time"
          class="form-control form-control-sm"
          data-dia="${nombreDia}"
          data-campo="in1"
          value="${existente.in1 ?? ""}"
        >
      </td>

      <td>
        <input
          type="time"
          class="form-control form-control-sm"
          data-dia="${nombreDia}"
          data-campo="out1"
          value="${existente.out1 ?? ""}"
        >
      </td>

      <td>
        <input
          type="time"
          class="form-control form-control-sm"
          data-dia="${nombreDia}"
          data-campo="in2"
          value="${existente.in2 ?? ""}"
        >
      </td>

      <td>
        <input
          type="time"
          class="form-control form-control-sm"
          data-dia="${nombreDia}"
          data-campo="out2"
          value="${existente.out2 ?? ""}"
        >
      </td>

      <td>
        <select
          class="form-select form-select-sm"
          data-dia="${nombreDia}"
          data-campo="modalidad"
        >
          <option
            value="No Laborable"
            ${
              !existente.modalidad || existente.modalidad === "No Laborable"
                ? "selected"
                : ""
            }
          >
            No aplica / No trabaja
          </option>

          <option
            value="Oficina"
            ${existente.modalidad === "Oficina" ? "selected" : ""}
          >
            Oficina
          </option>

          <option
            value="Home"
            ${existente.modalidad === "Home" ? "selected" : ""}
          >
            Home
          </option>
        </select>
      </td>

      <td>
        <select
          class="form-select form-select-sm"
          data-dia="${nombreDia}"
          data-campo="edificio"
          ${existente.modalidad === "Home" ? "disabled" : ""}
        >
          <option value="">Seleccionar edificio</option>

          ${EDIFICIOS_DISPONIBLES.map(
            (edificio) =>
              `<option
                value="${edificio}"
                ${existente.edificio === edificio ? "selected" : ""}
              >
                ${edificio}
              </option>`,
          ).join("")}
        </select>
      </td>
    `;

    tbody.appendChild(tr);

    // ============================================
    // HOME -> DESHABILITAR EDIFICIO
    // ============================================

    const selectModalidad = tr.querySelector('[data-campo="modalidad"]');

    const selectEdificio = tr.querySelector('[data-campo="edificio"]');

    selectModalidad.addEventListener("change", () => {
      const esHome = selectModalidad.value === "Home";

      selectEdificio.disabled = esHome;

      if (esHome) {
        selectEdificio.value = "";
      }
    });
  });
}

function validarHorario(dia) {
  const campos = [
    {
      nombre: "Ingreso",
      valor: dia.in1,
    },
    {
      nombre: "Salida a comer",
      valor: dia.out1,
    },
    {
      nombre: "Ingreso después de comer",
      valor: dia.in2,
    },
    {
      nombre: "Salida",
      valor: dia.out2,
    },
  ];

  let ultimoHorario = null;
  let ultimoNombre = null;

  for (const campo of campos) {
    // Si está vacío, simplemente lo salteamos
    if (!campo.valor) continue;

    const [hora, minutos] = campo.valor.split(":").map(Number);
    const minutosActuales = hora * 60 + minutos;

    if (ultimoHorario !== null && minutosActuales <= ultimoHorario) {
      return {
        valido: false,
        mensaje: `${dia.dia}: "${campo.nombre}" debe ser posterior a "${ultimoNombre}".`,
      };
    }

    ultimoHorario = minutosActuales;
    ultimoNombre = campo.nombre;
  }

  return {
    valido: true,
  };
}

async function guardarHorario() {
  const filas = document.querySelectorAll("#tblDetalleBody tr");
  const dias = [];

  filas.forEach((tr) => {
    const campos = tr.querySelectorAll("[data-dia]");
    const diaObj = {
      dia: campos[0].dataset.dia,
    };

    campos.forEach((campo) => {
      diaObj[campo.dataset.campo] = campo.value || null;
    });

    dias.push(diaObj);
  });

  // =========================================================
  // VALIDAR HORARIOS
  // =========================================================

  for (const dia of dias) {
    const validacion = validarHorario(dia);

    if (!validacion.valido) {
      alert(validacion.mensaje);
      return;
    }
  }

  // =========================================================
  // GUARDAR
  // =========================================================

  try {
    const res = await fetch(`${basePath}/horarios/${idUsuarioModalActual}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ dias }),
    });

    const sesionOk = await verificarSesionValida(
      res,
      `horarios/${idUsuarioModalActual} (PUT)`,
    );

    if (!sesionOk) return;

    const data = await res.json();

    if (!data.success) {
      alert(data.mensaje || "No se pudo guardar el horario.");
      return;
    }

    diasActuales = dias;

    renderDetalle(dias);
    resetFooterModal();

    cargarHorarios();
  } catch (error) {
    console.error("Error guardando el horario:", error);
    alert("Error al guardar el horario.");
  }
}

function cancelarEdicion() {
  renderDetalle(diasActuales);
  resetFooterModal();
}

// =========================================================
// VER LOG
// =========================================================
//
// Por ahora solamente dejamos preparado el botón.
// La implementación del log se hará después cuando definamos
// qué información queremos registrar y cómo va a responder
// el backend.
//

function verLogHorario(idUsuario) {
  console.log("Ver log del usuario:", idUsuario);

  // TODO:
  // Acá posteriormente vamos a consultar el backend
  // y mostrar los cambios realizados en los horarios.
}

// =========================================================
// FOOTER DEL MODAL
// =========================================================

function resetFooterModal() {
  document.getElementById("modalHorarioFooter").innerHTML = `
    <button
      class="btn btn-primary"
      id="btnModificarHorario"
    >
      Modificar horario
    </button>

    <button
      class="btn btn-info"
      id="btnVerLogHorario"
    >
      Ver log
    </button>

    <button
      class="btn btn-secondary"
      data-bs-dismiss="modal"
    >
      Cerrar
    </button>
  `;

  document.getElementById("btnModificarHorario").onclick = () => {
    modificarHorario(idUsuarioModalActual);
  };

  document.getElementById("btnVerLogHorario").onclick = () => {
    verLogHorario(idUsuarioModalActual);
  };
}
