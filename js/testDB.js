// testDB.js
document.getElementById("btnTest").addEventListener("click", async () => {
    const resultado = document.getElementById("resultado");
    resultado.textContent = "Cargando...";

    try {
        const res = await fetch("/test"); // Llama a la ruta de prueba en el backend
        const data = await res.json();
        resultado.textContent = JSON.stringify(data, null, 2); // Muestra el JSON bonito
    } catch (err) {
        resultado.textContent = "Error: " + err;
        console.error(err);
    }
});