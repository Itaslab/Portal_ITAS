document.getElementById('loginForm').addEventListener('submit', async function(e){
    e.preventDefault(); // Evita que el form recargue la pÃ¡gina
 
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
 
    try {
        const res = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
        });
 
        const data = await res.json();
 
        if(data.success){
            // Login correcto
            window.location.href = "pages/Front_APPs.html"; // Redirigir a menÃº principal
            localStorage.setItem('usuario', email); // Guardar usuario
        } else {
            // Error del backend
            alert("Error: " + data.error);
        }
 
    } catch(err){
        alert("Error de conexionn con el servidor");
        console.error(err);
    }
});
