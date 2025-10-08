document.getElementById('loginForm').addEventListener('submit', async function(e){
    e.preventDefault(); // Evita que el form recargue la página

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const res = await fetch("https://10.4.48.116:8000/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if(data.success){
            // Login correcto
            window.location.href = "pages/Front_APPs.html"; // Redirigir a menú principal
            localStorage.setItem('usuario', email); // Guardar usuario
        } else {
            // Error del backend
            alert("Error: " + data.error);
        }

    } catch(err){
        alert("Error de conexión con el servidor");
        console.error(err);
    }
});
