const bcrypt = require("bcrypt");
const { poolPromise } = require("./db");

const schema = process.env.DB_SCHEMA;

(async () => {
  const pool = await poolPromise;

  const result = await pool.request().query(`
    SELECT ID_Usuario, Password
    FROM ${schema}.WEB_PORTAL_ITAS_USR
    WHERE Password IS NOT NULL AND PasswordHash IS NULL
  `);

  for (const u of result.recordset) {
    const hash = await bcrypt.hash(u.Password, 10);

    await pool.request()
      .input("id", u.ID_Usuario)
      .input("hash", hash)
      .query(`
        UPDATE ${schema}.WEB_PORTAL_ITAS_USR
        SET PasswordHash = @hash
        WHERE ID_Usuario = @id
      `);
  }

  console.log("✔ Migración de passwords completada");
})();