// modificarUsuarioAbm.js

document.addEventListener("DOMContentLoaded", async () => {
  const selectUsuario = document.getElementById("selectUsuario");
  const btnCargar = document.getElementById("btnCargar");
  const form = document.getElementById("userForm");

  // Crear contenedor para mensajes
  const resultado = document.createElement("div");
  resultado.id = "resultado";
  resultado.className = "mt-3";
  form.appendChild(resultado);

  // ---------------------------------------------------------
  // 1️⃣ CARGAR LISTA DE USUARIOS EN EL SELECT
  // ---------------------------------------------------------
  try {
    const res = await fetch("/abm_usuarios");
    const data = await res.json();

    if (res.ok && data.usuarios) {
      data.usuarios.forEach((u) => {
        const opt = document.createElement("option");
        opt.value = u.Legajo;
        opt.textContent = `${u.Apellido}, ${u.Nombre}`;
        selectUsuario.appendChild(opt);
      });
    } else {
      resultado.textContent = "No se encontraron usuarios.";
      resultado.style.color = "orange";
    }
  } catch (error) {
    console.error("Error:", error);
    resultado.textContent = "Error cargando usuarios.";
    resultado.style.color = "red";
  }

  // ---------------------------------------------------------
  // 2️⃣ CARGAR DATOS DEL USUARIO
  // ---------------------------------------------------------
  btnCargar.addEventListener("click", async () => {
    const legajo = selectUsuario.value;
    if (!legajo) {
      resultado.textContent = "Seleccione un usuario.";
      resultado.style.color = "orange";
      return;
    }

    try {
      const res = await fetch(`/abm_usuarios/${legajo}`);
      const data = await res.json();

      if (!res.ok) {
        resultado.textContent = "No se encontró el usuario.";
        resultado.style.color = "red";
        return;
      }

      // Rellenar formulario
      document.getElementById("legajo").value = data.Legajo || "";
      document.getElementById("apellido").value = data.Apellido || "";
      document.getElementById("nombre").value = data.Nombre || "";
      document.getElementById("email").value = data.Email || "";
      document.getElementById("referente").value = data.Referente || "";
      document.getElementById("fecha_nacimiento").value =
        data.Fecha_Nacimiento ? data.Fecha_Nacimiento.split("T")[0] : "";
      document.getElementById("empresa").value = data.Empresa || "";
      document.getElementById("alias").value = data.Alias || "";
      document.getElementById("convenio").value = data.Convenio || "";
      document.getElementById("ciudad").value = data.Ciudad || "";

      resultado.textContent = "Datos cargados correctamente.";
      resultado.style.color = "green";
    } catch (error) {
      console.error("Error:", error);
      resultado.textContent = "Error cargando usuario.";
      resultado.style.color = "red";
    }
  });

  // ---------------------------------------------------------
  // 3️⃣ GUARDAR CAMBIOS (PUT)
  // ---------------------------------------------------------
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const legajo = document.getElementById("legajo").value;
    if (!legajo) {
      resultado.textContent = "Debe seleccionar un usuario.";
      resultado.style.color = "orange";
      return;
    }

    // Sanitiza vacíos -> null
    const clean = (v) => (v && v.trim() !== "" ? v.trim() : null);

    const body = {
      Apellido: clean(document.getElementById("apellido").value),
      Nombre: clean(document.getElementById("nombre").value),
      Alias: clean(document.getElementById("alias").value),
      Email: clean(document.getElementById("email").value),
      Referente: clean(document.getElementById("referente").value),
      Fecha_Nacimiento: document.getElementById("fecha_nacimiento").value || null,
      Empresa: clean(document.getElementById("empresa").value),
      Convenio: clean(document.getElementById("convenio").value),
      Ciudad: clean(document.getElementById("ciudad").value),
    };

    try {
      const res = await fetch(`/abm_usuarios/${legajo}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        resultado.textContent = data.mensaje || "Usuario actualizado.";
        resultado.style.color = "green";
      } else {
        resultado.textContent = data.mensaje || "Error al actualizar.";
        resultado.style.color = "red";
      }
    } catch (error) {
      console.error(error);
      resultado.textContent = "Error de conexión.";
      resultado.style.color = "red";
    }
  });
});
