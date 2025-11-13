// appOrdenesSF_ModificarUsuario.js

document.addEventListener("DOMContentLoaded", async () => {
  const selectUsuario = document.getElementById("selectUsuario");
  const btnCargar = document.getElementById("btnCargar");
  const form = document.getElementById("userForm");

  // Crear un contenedor para mensajes
  const resultado = document.createElement("div");
  resultado.id = "resultado";
  resultado.className = "mt-3";
  form.appendChild(resultado);


  // ---------------------------------------------------------
// 1️⃣ CARGAR LISTA DE USUARIOS EN EL SELECT
// ---------------------------------------------------------
try {
  const res = await fetch("/abm_usuarios");
  if (!res.ok) throw new Error("Error HTTP " + res.status);

  const data = await res.json();
  const usuarios = data.usuarios || [];

  if (Array.isArray(usuarios) && usuarios.length > 0) {
    usuarios.forEach(u => {
      const opt = document.createElement("option");
      opt.value = u.Legajo; // nombre de columna real en SQL
      opt.textContent = `${u.Apellido}, ${u.Nombre}`;
      selectUsuario.appendChild(opt);
    });
  } else {
    resultado.textContent = "No se encontraron usuarios.";
    resultado.style.color = "orange";
  }
} catch (error) {
  console.error("Error al obtener usuarios:", error);
  resultado.textContent = "Error cargando lista de usuarios.";
  resultado.style.color = "red";
}

  // ---------------------------------------------------------
  // 2️⃣ CARGAR DATOS DEL USUARIO SELECCIONADO
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

      if (res.ok && data) {
        // Rellenar campos del formulario
        document.getElementById("legajo").value = data.Legajo || "";
        document.getElementById("apellido").value = data.Apellido || "";
        document.getElementById("nombre").value = data.Nombre || "";
        document.getElementById("email").value = data.Email || "";
        document.getElementById("referente").value = data.Referente || "";
        document.getElementById("fecha_nacimiento").value = data.Fecha_Nacimiento
          ? data.Fecha_Nacimiento.split("T")[0]
          : "";
        document.getElementById("empresa").value = data.Empresa || "";
        document.getElementById("alias").value = data.Alias || "";
        document.getElementById("convenio").value = data.Convenio || "";
        document.getElementById("ciudad").value = data.Ciudad || "";

        resultado.textContent = `Datos cargados para ${data.Nombre} ${data.Apellido}.`;
        resultado.style.color = "green";
      } else {
        resultado.textContent = data.mensaje || "Usuario no encontrado.";
        resultado.style.color = "red";
      }
    } catch (error) {
      console.error("Error al cargar usuario:", error);
      resultado.textContent = "Error al obtener datos del usuario.";
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
      resultado.textContent = "Debe seleccionar un usuario antes de guardar.";
      resultado.style.color = "orange";
      return;
    }

    const body = {
      Apellido: document.getElementById("apellido").value.trim(),
      Nombre: document.getElementById("nombre").value.trim(),
      Alias: document.getElementById("alias").value.trim(),
      Email: document.getElementById("email").value.trim(),
      Referente: document.getElementById("referente").value.trim(),
      Fecha_Nacimiento: document.getElementById("fecha_nacimiento").value || null,
      Empresa: document.getElementById("empresa").value.trim(),
      Convenio: document.getElementById("convenio").value.trim(),
      Ciudad: document.getElementById("ciudad").value.trim(),
    };

    try {
      const res = await fetch(`/abm_usuarios/${legajo}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        resultado.textContent = data.mensaje || "Usuario actualizado correctamente.";
        resultado.style.color = "green";
      } else {
        resultado.textContent = data.mensaje || "Error al actualizar usuario.";
        resultado.style.color = "red";
      }
    } catch (error) {
      console.error("Error al actualizar usuario:", error);
      resultado.textContent = "Error de conexión con el servidor.";
      resultado.style.color = "red";
    }
  });
});
