document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault(); // Evita que el form recargue la página

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
     //   const res = await fetch("https://10.4.48.116:8080/login", {
        const res = await fetch(basePath + "/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (data.success) {
            // ✅ La sesión ya está guardada en servidor (cookies de sesión)
            // No necesitamos guardar nada en localStorage

            // Redirigir a la página principal
            window.location.href = `${basePath}/pages/Front_APPs.html`;
        } else {
            alert("Error: " + data.error);
        }

    } catch (err) {
        alert("Error de conexión con el servidor");
        console.error(err);
    }
});

