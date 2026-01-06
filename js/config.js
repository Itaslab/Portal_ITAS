// config.js
// Detecta automáticamente si estamos en /test/ y establece la ruta base

const basePath = window.location.pathname.includes('/test/') ? '/test' : '';

console.log('Entorno detectado:', basePath ? 'TEST' : 'PRODUCCIÓN', '- basePath:', basePath);
