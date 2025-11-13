document.addEventListener("DOMContentLoaded", async () => {
  const selectUsuario = document.getElementById("selectUsuario");
  const btnCargar = document.getElementById("btnCargar");
  const form = document.getElementById("userForm");
  const resultado = document.createElement("div");
  resultado.id = "resultado";
  resultado.className = "mt-3";
  form.appendChild(resultado);

  // 1. Cargar lista de usuarios en el dropdown
 try {
  const res = await fetch("/abm_usuarios");
  const data = await res.json();

  if (data.success && Array.isArray(data.usuarios)) {
    data.usuarios.forEach(u => {
      const opt = document.createElement("option");
      opt.value = u.id_usuario; // o u.Legajo si es lo que usás
      opt.textContent = u.nombre;
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

  // 2. Cargar datos del usuario seleccionado
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

      if (res.ok) {
        // Llenar los campos
        document.getElementById("legajo").value = data.Legajo;
        document.getElementById("apellido").value = data.Apellido;
        document.getElementById("nombre").value = data.Nombre;
        document.getElementById("email").value = data.Email;
        document.getElementById("referente").value = data.Referente;
        document.getElementById("fecha_nacimiento").value = data.Fecha_Nacimiento?.split("T")[0] || "";
        document.getElementById("empresa").value = data.Empresa;
        document.getElementById("alias").value = data.Alias;
        document.getElementById("convenio").value = data.Convenio;
        document.getElementById("ciudad").value = data.Ciudad;

        resultado.textContent = `Datos cargados para ${data.Nombre} ${data.Apellido}`;
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

  // 3. Guardar cambios (PUT)
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const legajo = document.getElementById("legajo").value;

    const body = {
      Apellido: document.getElementById("apellido").value,
      Nombre: document.getElementById("nombre").value,
      Alias: document.getElementById("alias").value,
      Email: document.getElementById("email").value,
      Referente: document.getElementById("referente").value,
      Fecha_Nacimiento: document.getElementById("fecha_nacimiento").value,
      Empresa: document.getElementById("empresa").value,
      Convenio: document.getElementById("convenio").value,
      Ciudad: document.getElementById("ciudad").value,
    };

    try {
  const res = await fetch(`/abm_usuarios/${legajo}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

      const data = await res.json();
      if (res.ok) {
        resultado.textContent = "Usuario actualizado correctamente.";
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
