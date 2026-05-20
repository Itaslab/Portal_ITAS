// modificarUsuarioAbm.js

document.addEventListener("DOMContentLoaded", async () => {

  const selectUsuario = document.getElementById("selectUsuario");
  const btnCargar = document.getElementById("btnCargar");
  const form = document.getElementById("userForm");

  // =========================================================
  // REFERENTES
  // =========================================================

  const referenteSelect = document.getElementById("referente");

  try {

    const resRef = await fetch(basePath + "/referentes");
    const dataRef = await resRef.json();

    if (dataRef.success && Array.isArray(dataRef.referentes)) {

      dataRef.referentes.forEach(ref => {

        const option = document.createElement("option");

        option.value = ref.Referente;

        option.textContent = ref.NombreCompleto
          ? `${ref.Referente} - ${ref.NombreCompleto}`
          : ref.Referente;

        referenteSelect.appendChild(option);

      });

    }

  } catch (err) {

    console.error("Error cargando referentes:", err);

  }

  // =========================================================
  // VALIDACIONES
  // =========================================================

  const regexName = /^[A-Za-zÀ-ÖØ-öø-ÿ\s'\-\.]+$/u;
  const regexAlias = /^[A-Za-z0-9À-ÖØ-öø-ÿ\s'\-\.]+$/u;
  const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function validarCampos(vals) {

    const errores = [];

    if (vals.apellido && !regexName.test(vals.apellido)) {
      errores.push("apellido");
    }

    if (vals.nombre && !regexName.test(vals.nombre)) {
      errores.push("nombre");
    }

    if (vals.email && !regexEmail.test(vals.email)) {
      errores.push("email");
    }

    if (vals.alias && !regexAlias.test(vals.alias)) {
      errores.push("alias");
    }

    return errores;

  }

  // =========================================================
  // MENSAJES
  // =========================================================

  const resultado = document.createElement("div");

  resultado.id = "resultado";
  resultado.className = "mt-3";

  form.appendChild(resultado);

  // =========================================================
  // MODAL
  // =========================================================

  let successModal = null;

  const successModalEl = document.getElementById("successModal");

  if (successModalEl && typeof bootstrap !== "undefined") {

    successModal = new bootstrap.Modal(successModalEl);

  }

  // =========================================================
  // CARGAR USUARIOS EN SELECT
  // =========================================================

  try {

    const res = await fetch(basePath + "/abm_usuarios");

    const data = await res.json();

    if (res.ok && data.usuarios) {

      data.usuarios.forEach(u => {

        const option = document.createElement("option");

        option.value = u.Legajo;

        option.textContent = `${u.Apellido}, ${u.Nombre}`;

        selectUsuario.appendChild(option);

      });

    }

  } catch (error) {

    console.error(error);

    resultado.textContent = "Error cargando usuarios";
    resultado.style.color = "red";

  }

  // =========================================================
  // CARGAR DATOS USUARIO
  // =========================================================

  btnCargar.addEventListener("click", async () => {

    const legajo = selectUsuario.value;

    if (!legajo) {

      resultado.textContent = "Seleccione un usuario";
      resultado.style.color = "orange";

      return;
    }

    try {

      const res = await fetch(basePath + `/abm_usuarios/${legajo}`);

      const data = await res.json();

      if (!res.ok) {

        resultado.textContent = "Usuario no encontrado";
        resultado.style.color = "red";

        return;
      }

      document.getElementById("legajo").value = data.Legajo || "";
      document.getElementById("apellido").value = data.Apellido || "";
      document.getElementById("nombre").value = data.Nombre || "";
      document.getElementById("email").value = data.Email || "";
      document.getElementById("referente").value = data.Referente || "";

      document.getElementById("fecha_nacimiento").value =
        data.Fecha_Nacimiento
          ? data.Fecha_Nacimiento.split("T")[0]
          : "";

      document.getElementById("empresa").value = data.Empresa || "";
      document.getElementById("alias").value = data.Alias || "";
      document.getElementById("convenio").value = data.Convenio || "";
      document.getElementById("ciudad").value = data.Ciudad || "";

      resultado.textContent = "Usuario cargado correctamente";
      resultado.style.color = "green";

    } catch (error) {

      console.error(error);

      resultado.textContent = "Error cargando usuario";
      resultado.style.color = "red";

    }

  });

  // =========================================================
  // GUARDAR CAMBIOS
  // =========================================================

  form.addEventListener("submit", async (event) => {

    event.preventDefault();

    const legajo = document.getElementById("legajo").value;

    if (!legajo) {

      resultado.textContent = "Debe seleccionar un usuario";
      resultado.style.color = "orange";

      return;
    }

    // VALIDAR

    const valores = {

      apellido: document.getElementById("apellido").value.trim(),
      nombre: document.getElementById("nombre").value.trim(),
      email: document.getElementById("email").value.trim(),
      alias: document.getElementById("alias").value.trim()

    };

    const errores = validarCampos(valores);

    if (errores.length > 0) {

      resultado.textContent =
        `Campos inválidos: ${errores.join(", ")}`;

      resultado.style.color = "red";

      return;

    }

    // CLEAN

    const clean = (v) =>
      (v && v.trim() !== "")
        ? v.trim()
        : null;

    // BODY

    const body = {

      Apellido: clean(document.getElementById("apellido").value),

      Nombre: clean(document.getElementById("nombre").value),

      Alias: clean(document.getElementById("alias").value),

      Email: clean(document.getElementById("email").value),

      Referente: clean(document.getElementById("referente").value),

      Fecha_Nacimiento:
        document.getElementById("fecha_nacimiento").value || null,

      Empresa: clean(document.getElementById("empresa").value),

      Convenio: clean(document.getElementById("convenio").value),

      Ciudad: clean(document.getElementById("ciudad").value)

    };

    try {

      const res = await fetch(basePath + `/abm_usuarios/${legajo}`, {

        method: "PUT",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify(body)

      });

      const data = await res.json();

      if (res.ok) {

        if (successModal) {

          const modalBody =
            document.getElementById("successModalBody");

          modalBody.textContent =
            `Usuario actualizado correctamente`;

          successModal.show();

        } else {

          alert("Usuario actualizado");

        }

        resultado.textContent = "";
        resultado.style.color = "green";

      } else {

        resultado.textContent =
          data.mensaje || "Error actualizando usuario";

        resultado.style.color = "red";

      }

    } catch (error) {

      console.error(error);

      resultado.textContent = "Error de conexión";
      resultado.style.color = "red";

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

  const legajo = document.getElementById("legajo").value;

  const idAplicacion = selectAplicacion.value;
  const idPerfil = selectPerfil.value;

  // ----------------------------
  // VALIDACIONES
  // ----------------------------

  if (!legajo) {

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
          legajo,
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

  const legajo =
    document.getElementById("legajo").value;

  if (!legajo) return;

  try {

    const res = await fetch(
      basePath + `/usuario_perfil_app/${legajo}`
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


});