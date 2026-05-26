//abmUsuarios_AltaDeUsuarioITAS.js

document.addEventListener("DOMContentLoaded", async () => {

    const selectUsuario = document.getElementById("selectUsuario");
    const emailInput = document.getElementById("email");

    let usuarios = [];

    // =========================
    // CARGAR USUARIOS
    // =========================
    async function cargarUsuarios() {

        try {  

            const response = await fetch(basePath + "/usuariosPortalAlta");
            

            if (!response.ok) {
                throw new Error("Error al obtener usuarios");
            }

            usuarios = await response.json();

            selectUsuario.innerHTML = `
                <option value="">Seleccione un usuario</option>
            `;

            usuarios.forEach(usuario => {
                const option = document.createElement("option");

                option.value = usuario.ID_Usuario;

                option.textContent = `
                    ${usuario.Nombre} ${usuario.Apellido}
                `;

                selectUsuario.appendChild(option);

            });

        } catch (error) {

            console.error("Error cargando usuarios:", error);
            alert("No se pudieron cargar los usuarios");

        }

    }

    // =========================
    // CAMBIO DE USUARIO
    // =========================
    selectUsuario.addEventListener("change", () => {

        const usuarioSeleccionado = usuarios.find(
            u => u.ID_Usuario == selectUsuario.value
        );

        if (!usuarioSeleccionado) {

            emailInput.value = "";
            return;

        }

        emailInput.value = usuarioSeleccionado.Email || "";
        cargarPermisosActuales();

    });


    // =========================
// ALTA USUARIO PORTAL
// =========================
const form = document.getElementById("formAltaUsuario");

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    try {

        const idUsuario = selectUsuario.value;
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        // VALIDACIONES
        if (!idUsuario) {
            return alert("Seleccione un usuario");
        }

        if (password.length < 8 || password.length > 15) {
            return alert("La contraseña debe tener entre 8 y 15 caracteres");
        }

        if (password !== confirmPassword) {
             return alert("Las contraseñas no coinciden");
        }

        const response = await fetch(
            basePath + "/altaUsuarioPortal",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    idUsuario,
                    password
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Error al crear usuario");
        }

        alert("Usuario portal creado correctamente");

        form.reset();
        emailInput.value = "";

    } catch (error) {

        console.error(error);
        alert(error.message);

    }

});


// =====================================================
// MODAL PERMISOS
// =====================================================

const selectAplicacion = document.getElementById("selectAplicacion");
const selectPerfil = document.getElementById("selectPerfil");
const btnGuardarPermiso = document.getElementById("btnGuardarPermiso");
const resultadoPermiso = document.getElementById("resultadoPermiso");
const listaPermisosActuales =document.getElementById("listaPermisosActuales");


// =====================================================
// 1️⃣ CARGAR APLICACIONES
// =====================================================

async function cargarAplicaciones() {

  try {

    const res = await fetch(basePath + "/aplicaciones");
    const data = await res.json();

    selectAplicacion.innerHTML = `
      <option value="">
        Seleccione aplicación
      </option>
    `;

    if (data.success) {

      data.aplicaciones.forEach(app => {

        const option = document.createElement("option");

        option.value = app.ID_Aplicacion;
        option.textContent = app.Nombre;

        selectAplicacion.appendChild(option);

      });

    }

  } catch (error) {

    console.error("Error cargando aplicaciones:", error);

  }

}


// =====================================================
// 2️⃣ CARGAR PERFILES SEGUN APP
// =====================================================

selectAplicacion.addEventListener("change", async () => {

  const idAplicacion = selectAplicacion.value;

  selectPerfil.innerHTML = `
    <option value="">
      Seleccione perfil
    </option>
  `;

  if (!idAplicacion) return;

  try {

    const res = await fetch(
      basePath + `/perfiles/${idAplicacion}`
    );

    const data = await res.json();

    if (data.success) {

      data.perfiles.forEach(perfil => {

        const option = document.createElement("option");

        option.value = perfil.ID_Perfil;
        option.textContent = perfil.Nombre;

        selectPerfil.appendChild(option);

      });

    }

  } catch (error) {

    console.error("Error cargando perfiles:", error);

  }

});


// =====================================================
// 3️⃣ ABRIR MODAL
// =====================================================

const modalPermisos = document.getElementById("modalPermisos");

modalPermisos.addEventListener("show.bs.modal", async () => {

  resultadoPermiso.innerHTML = "";

 await cargarAplicaciones();
await cargarPermisosActuales();

});


// =====================================================
// 4️⃣ GUARDAR PERMISO
// =====================================================

btnGuardarPermiso.addEventListener("click", async () => {

    const idUsuario = selectUsuario.value;
  const idAplicacion = selectAplicacion.value;
  const idPerfil = selectPerfil.value;

  // ----------------------------
  // VALIDACIONES
  // ----------------------------

  if (!idUsuario) {

    resultadoPermiso.innerHTML = `
      <div class="alert alert-warning">
        Debe cargar un usuario primero
      </div>
    `;

    return;

  }

  if (!idAplicacion) {

    resultadoPermiso.innerHTML = `
      <div class="alert alert-warning">
        Seleccione una aplicación
      </div>
    `;

    return;

  }

  if (!idPerfil) {

    resultadoPermiso.innerHTML = `
      <div class="alert alert-warning">
        Seleccione un perfil
      </div>
    `;

    return;

  }

  // ----------------------------
  // GUARDAR
  // ----------------------------

  try {

    const res = await fetch(
      basePath + "/usuario_perfil_app",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
            ID_Usuario: idUsuario,
          ID_Aplicacion: idAplicacion,
          ID_Perfil: idPerfil
        })
      }
    );

    const data = await res.json();

    if (res.ok) {

      resultadoPermiso.innerHTML = `
        <div class="alert alert-success">
          Permiso agregado correctamente
        </div>
      `;
      await cargarPermisosActuales();

    } else {

      resultadoPermiso.innerHTML = `
        <div class="alert alert-danger">
          ${data.mensaje || "Error guardando permiso"}
        </div>
      `;

    }

  } catch (error) {

    console.error(error);

    resultadoPermiso.innerHTML = `
      <div class="alert alert-danger">
        Error de conexión
      </div>
    `;

  }

});


// =====================================================
// MODAL ELIMINAR PERMISO
// =====================================================

const modalEliminarPermiso = new bootstrap.Modal(
  document.getElementById("modalEliminarPermiso")
);

let permisoAEliminar = null;


// =====================================================
// CLICK BOTON ELIMINAR
// =====================================================

document.addEventListener("click", (e) => {

  if (!e.target.classList.contains("btnEliminarPermiso")) {
    return;
  }

  permisoAEliminar = e.target.dataset.id;

  modalEliminarPermiso.show();

});


// =====================================================
// CONFIRMAR ELIMINACION
// =====================================================

document
  .getElementById("btnConfirmarEliminarPermiso")
  .addEventListener("click", async () => {

    if (!permisoAEliminar) {
      return;
    }

    try {

      const res = await fetch(
        `${basePath}/usuario_perfil_app/${permisoAEliminar}`,
        {
          method: "DELETE"
        }
      );

      const data = await res.json();

      if (!res.ok) {

        alert(
          data.mensaje ||
          "Error eliminando permiso"
        );

        return;

      }

      // Recargar permisos
      await cargarPermisosActuales();

      // Cerrar modal
      modalEliminarPermiso.hide();

    } catch (error) {

      console.error(error);

      alert("Error eliminando permiso");

    }

  });


// =====================================================
// CARGAR PERMISOS ACTUALES
// =====================================================

async function cargarPermisosActuales() {

    const idUsuario = selectUsuario.value;

  if (!idUsuario) return;

  try {

    const res = await fetch(
      basePath + `/usuario_perfil_app/${idUsuario}`
    );

    const data = await res.json();

    listaPermisosActuales.innerHTML = "";

    if (
      !data.success ||
      data.permisos.length === 0
    ) {

      listaPermisosActuales.innerHTML = `
        <div class="text-muted">
          Sin permisos cargados
        </div>
      `;

      return;

    }

    data.permisos.forEach(permiso => {

      listaPermisosActuales.innerHTML += `

        <div class="
          d-flex
          justify-content-between
          align-items-center
          border
          rounded
          p-2
          mb-2
        ">

          <div>
            <strong>
              ${permiso.Aplicacion}
            </strong>
            →
            ${permiso.Perfil}
          </div>

          <button
            class="btn btn-danger btn-sm btnEliminarPermiso text-white"
            data-id="${permiso.ID_Usuario_Perfil_App}"
          >
            Eliminar
          </button>

        </div>

      `;

    });

  } catch (error) {

    console.error(
      "Error cargando permisos actuales:",
      error
    );

  }

}

    // =========================
    // INIT
    // =========================
    cargarUsuarios();

});