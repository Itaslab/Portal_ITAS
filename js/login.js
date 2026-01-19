console.log("✅ login.js cargado correctamente");

document.getElementById('loginForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  
  console.log("✅ Evento submit del login capturado");

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  
  console.log("📧 Email:", email, "Password:", password ? "***" : "vacía");

  try {
    const res = await fetch(basePath + "/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
      throw new Error("Error HTTP");
    }

    const data = await res.json();

    console.log("🔍 DEBUG LOGIN - Respuesta del servidor:", data);

    if (data.success) {
      if (data.forcePasswordChange) {
        window.location.href = `${basePath}/pages/Front_APPs.html?forcePass=1`;
      } else {
        window.location.href = `${basePath}/pages/Front_APPs.html`;
      }
    } else {
      alert("Error: " + data.error);
    }

  } catch (err) {
    alert("Error de conexión con el servidor");
    console.error(err);
  }
});