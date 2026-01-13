// seginf_VaultContraseñas.js
// Gestión de la Bóveda de Contraseñas - Seguridad Informática
// Cifrado AES-256

const { sql, poolPromise } = require("./db");
const crypto = require("crypto");
const schema = process.env.DB_SCHEMA;

// Clave de cifrado (debe venir de .env en producción)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "tu-clave-super-secreta-32-caracteres!";
const ALGORITHM = "aes-256-cbc";

// Validar que la clave tenga 32 caracteres (256 bits)
function ensureKeyLength(key) {
  if (key.length < 32) {
    return key.padEnd(32, '0');
  }
  return key.substring(0, 32);
}

/**
 * Cifrar contraseña con AES-256
 */
function cifrarContraseña(contrasena) {
  const key = Buffer.from(ensureKeyLength(ENCRYPTION_KEY));
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(contrasena, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Combinar IV + encrypted (el IV necesita ser enviado para desencriptar)
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Guardar una credencial en la Bóveda de Contraseñas
 * POST /vault/guardar
 */
async function guardarCredencial(req, res) {
  try {
    // Validar sesión
    if (!req.session || !req.session.user) {
      return res.status(401).json({
        success: false,
        error: "No autenticado"
      });
    }

    const { sistema, usuario, contrasena } = req.body;
    const id_usuario = req.session.user.ID_Usuario;

    // Validaciones
    if (!sistema || !usuario || !contrasena) {
      return res.status(400).json({
        success: false,
        error: "Faltan campos requeridos: sistema, usuario, contrasena"
      });
    }

    // Cifrar la contraseña
    const password_cifrada = cifrarContraseña(contrasena);

    const pool = await poolPromise;

    // Insertar en la tabla
    const query = `
      INSERT INTO ${schema}.VAULT_SEG_INFORMATICA
        (sistema, usuario, password_cifrada)
      VALUES
        (@sistema, @usuario, @password_cifrada)
    `;

    const result = await pool.request()
      .input("sistema", sql.VarChar(255), sistema)
      .input("usuario", sql.VarChar(255), usuario)
      .input("password_cifrada", sql.NVarChar(sql.MAX), password_cifrada)
      .query(query);

    res.json({
      success: true,
      message: "Credencial guardada correctamente",
      recordsAffected: result.rowsAffected[0]
    });

  } catch (err) {
    console.error("Error al guardar credencial:", err);
    res.status(500).json({
      success: false,
      error: err.message || "Error al guardar la credencial"
    });
  }
}

/**
 * Obtener todas las contraseñas de la bóveda
 * GET /vault/listar
 */
async function listarContraseñas(req, res) {
  try {
    const pool = await poolPromise;

    const query = `
      SELECT 
        id,
        sistema,
        usuario,
        password_cifrada
      FROM ${schema}.VAULT_SEG_INFORMATICA
      ORDER BY sistema, usuario
    `;

    const result = await pool.request().query(query);

    res.json({
      success: true,
      credenciales: result.recordset
    });

  } catch (err) {
    console.error("Error al listar contraseñas:", err);
    res.status(500).json({
      success: false,
      error: err.message || "Error al listar contraseñas"
    });
  }
}

module.exports = {
  guardarCredencial,
  listarContraseñas};
