// config.js
// Detecta automáticamente si estamos en /test/ y establece la ruta base

const basePath = window.location.pathname.includes('/test/') ? '/test' : '';

console.log('Entorno detectado:', basePath ? 'TEST' : 'PRODUCCIÓN', '- basePath:', basePath);

/**
 * Función auxiliar para detectar sesión expirada en respuestas de fetch
 * Si el usuario fue redirigido por falta de autenticación, redirige a login
 */
async function verificarSesionValida(res, endpoint = '') {
  // Si es 401 Unauthorized, la sesión expiró
  if (res.status === 401) {
    try {
      const data = await res.json();
      console.warn(`Sesión expirada en ${endpoint}:`, data);
      const redirectTo = data.redirectTo || (basePath + "/ingreso.html");
      window.location.href = redirectTo;
    } catch (e) {
      window.location.href = basePath + "/ingreso.html";
    }
    throw new Error("Sesión expirada - redirigiendo a login");
  }
  
  if (!res.ok) {
    return false;
  }
  
  // Si la respuesta no es JSON, significa que fue redirigido a HTML (login)
  const contentType = res.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    console.warn(`Sesión expirada en ${endpoint}: fue redirigido a login`);
    window.location.href = basePath + "/ingreso.html";
    throw new Error("Sesión expirada - redirigiendo a login");
  }
  
  return true;
}
