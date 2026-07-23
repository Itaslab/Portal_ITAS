// modificarUsuarioAbm.js

document.addEventListener("DOMContentLoaded", async () => {
  const selectUsuario = document.getElementById("selectUsuario");
  const btnCargar = document.getElementById("btnCargar");
  const form = document.getElementById("userForm");

  // =========================================================
  // REFERENTES
  // =========================================================

  const referenteSelect = document.getElementById("referente");

  try {
    const resRef = await fetch(basePath + "/referentes");
    const dataRef = await resRef.json();

    if (dataRef.success && Array.isArray(dataRef.referentes)) {
      dataRef.referentes.forEach((ref) => {
        const option = document.createElement("option");

        option.value = ref.Referente;

        option.textContent = ref.NombreCompleto
          ? `${ref.Referente} - ${ref.NombreCompleto}`
          : ref.Referente;

        referenteSelect.appendChild(option);
      });
    }
  } catch (err) {
    console.error("Error cargando referentes:", err);
  }

  // =========================================================
  // VALIDACIONES
  // =========================================================

  const regexName = /^[A-Za-zÀ-ÖØ-öø-ÿ\s'\-\.]+$/u;
  const regexAlias = /^[A-Za-z0-9À-ÖØ-öø-ÿ\s'\-\.]+$/u;
  const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function validarCampos(vals) {
    const errores = [];

    if (vals.apellido && !regexName.test(vals.apellido)) {
      errores.push("apellido");
    }

    if (vals.nombre && !regexName.test(vals.nombre)) {
      errores.push("nombre");
    }

    if (vals.email && !regexEmail.test(vals.email)) {
      errores.push("email");
    }

    if (vals.alias && !regexAlias.test(vals.alias)) {
      errores.push("alias");
    }

    return errores;
  }

  // =========================================================
  // MENSAJES
  // =========================================================

  const resultado = document.createElement("div");

  resultado.id = "resultado";
  resultado.className = "mt-3";

  form.appendChild(resultado);

  // =========================================================
  // MODAL
  // =========================================================

  let successModal = null;

  const successModalEl = document.getElementById("successModal");

  if (successModalEl && typeof bootstrap !== "undefined") {
    successModal = new bootstrap.Modal(successModalEl);
  }

  // =========================================================
  // CARGAR USUARIOS EN SELECT
  // =========================================================

  try {
    const res = await fetch(basePath + "/abm_usuarios");

    const data = await res.json();

    if (res.ok && data.usuarios) {
      data.usuarios.forEach((u) => {
        const option = document.createElement("option");

        option.value = u.Legajo;

        option.textContent = `${u.Apellido}, ${u.Nombre}`;

        selectUsuario.appendChild(option);
      });
    }
  } catch (error) {
    console.error(error);

    resultado.textContent = "Error cargando usuarios";
    resultado.style.color = "red";
  }

  // =========================================================
  // CARGAR DATOS USUARIO
  // =========================================================

  btnCargar.addEventListener("click", async () => {
    const legajo = selectUsuario.value;

    if (!legajo) {
      resultado.textContent = "Seleccione un usuario";
      resultado.style.color = "orange";

      return;
    }

    try {
      const res = await fetch(basePath + `/abm_usuarios/${legajo}`);

      const data = await res.json();

      if (!res.ok) {
        resultado.textContent = "Usuario no encontrado";
        resultado.style.color = "red";

        return;
      }

      document.getElementById("legajo").value = data.Legajo || "";
      document.getElementById("apellido").value = data.Apellido || "";
      document.getElementById("nombre").value = data.Nombre || "";
      document.getElementById("email").value = data.Email || "";
      document.getElementById("referente").value = data.Referente || "";

      document.getElementById("fecha_nacimiento").value = data.Fecha_Nacimiento
        ? data.Fecha_Nacimiento.split("T")[0]
        : "";

      document.getElementById("empresa").value = data.Empresa || "";
      document.getElementById("alias").value = data.Alias || "";
      document.getElementById("convenio").value = data.Convenio || "";
      document.getElementById("ciudad").value = data.Ciudad || "";
      document.getElementById("idUsuario").value = data.ID_Usuario || "";
      document.getElementById("btnModificarGrupo").disabled = !data.ID_Usuario;

      resultado.textContent = "Usuario cargado correctamente";
      resultado.style.color = "green";
    } catch (error) {
      console.error(error);

      resultado.textContent = "Error cargando usuario";
      resultado.style.color = "red";
    }
  });

  // =========================================================
  // MODIFICAR GRUPO DEL USUARIO
  // =========================================================

  const btnModificarGrupo = document.getElementById("btnModificarGrupo");
  const grupoModalEl = document.getElementById("grupoModal");
  const grupoModal = grupoModalEl ? new bootstrap.Modal(grupoModalEl) : null;
  const grupoActualTexto = document.getElementById("grupoActualTexto");
  const selectGrupoNuevo = document.getElementById("selectGrupoNuevo");
  const selectSubgrupoNuevo = document.getElementById("selectSubgrupoNuevo");
  const grupoModalResultado = document.getElementById("grupoModalResultado");
  const btnGuardarGrupo = document.getElementById("btnGuardarGrupo");

  let idGrupoSeleccionado = null;

  async function cargarListaGrupos() {
    try {
      const res = await fetch(basePath + "/grupos");
      const data = await res.json();

      selectGrupoNuevo.innerHTML =
        '<option value="">Seleccione un grupo</option>';

      if (data.success) {
        data.grupos.forEach((g) => {
          const opt = document.createElement("option");
          opt.value = g;
          opt.textContent = g;
          selectGrupoNuevo.appendChild(opt);
        });
      }
    } catch (err) {
      console.error("Error cargando grupos:", err);
    }
  }

  async function cargarGrupoActual(idUsuario) {
    try {
      const res = await fetch(
        basePath + `/abm_usuarios/${idUsuario}/grupo-actual`,
      );
      const data = await res.json();

      if (data.success && data.tieneGrupo) {
        grupoActualTexto.textContent = `${data.actual.Grupo} / ${data.actual.Subgrupo}`;
      } else {
        grupoActualTexto.textContent = "Sin grupo asignado";
      }
    } catch (err) {
      console.error("Error cargando grupo actual:", err);
      grupoActualTexto.textContent = "Error al cargar";
    }
  }

  if (btnModificarGrupo) {
    btnModificarGrupo.addEventListener("click", async () => {
      const idUsuario = document.getElementById("idUsuario").value;

      if (!idUsuario) {
        alert("Debe cargar un usuario primero.");
        return;
      }

      grupoModalResultado.textContent = "";
      selectGrupoNuevo.value = "";
      selectSubgrupoNuevo.innerHTML =
        '<option value="">Seleccione un subgrupo</option>';
      selectSubgrupoNuevo.disabled = true;
      idGrupoSeleccionado = null;

      await cargarListaGrupos();
      await cargarGrupoActual(idUsuario);

      grupoModal.show();
    });
  }

  if (selectGrupoNuevo) {
    selectGrupoNuevo.addEventListener("change", async () => {
      const grupo = selectGrupoNuevo.value;

      selectSubgrupoNuevo.innerHTML =
        '<option value="">Seleccione un subgrupo</option>';
      selectSubgrupoNuevo.disabled = true;
      idGrupoSeleccionado = null;

      if (!grupo) return;

      try {
        const res = await fetch(
          basePath + `/grupos/subgrupos?grupo=${encodeURIComponent(grupo)}`,
        );
        const data = await res.json();

        if (data.success) {
          data.subgrupos.forEach((s) => {
            const opt = document.createElement("option");
            opt.value = s.ID_Grupo;
            opt.textContent = s.Subgrupo;
            selectSubgrupoNuevo.appendChild(opt);
          });
          selectSubgrupoNuevo.disabled = false;
        }
      } catch (err) {
        console.error("Error cargando subgrupos:", err);
      }
    });
  }

  if (selectSubgrupoNuevo) {
    selectSubgrupoNuevo.addEventListener("change", () => {
      idGrupoSeleccionado = selectSubgrupoNuevo.value || null;
    });
  }

  if (btnGuardarGrupo) {
    btnGuardarGrupo.addEventListener("click", async () => {
      const idUsuario = document.getElementById("idUsuario").value;

      if (!idGrupoSeleccionado) {
        grupoModalResultado.innerHTML =
          '<div class="text-danger mt-2">Seleccione grupo y subgrupo.</div>';
        return;
      }

      try {
        const res = await fetch(
          basePath + `/abm_usuarios/${idUsuario}/cambiar-grupo`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_grupo_nuevo: idGrupoSeleccionado }),
          },
        );

        const data = await res.json();

        if (data.success) {
          grupoModal.hide();

          if (successModal) {
            document.getElementById("successModalBody").textContent =
              "Grupo actualizado correctamente";
            successModal.show();
          } else {
            alert("Grupo actualizado correctamente");
          }

          await cargarGrupoActual(idUsuario);
        } else {
          grupoModalResultado.innerHTML = `<div class="text-danger mt-2">${data.mensaje || "Error al actualizar"}</div>`;
        }
      } catch (err) {
        console.error("Error guardando grupo:", err);
        grupoModalResultado.innerHTML =
          '<div class="text-danger mt-2">Error de conexión</div>';
      }
    });
  }

  // =========================================================
  // GUARDAR CAMBIOS
  // =========================================================

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const legajo = document.getElementById("legajo").value;

    if (!legajo) {
      resultado.textContent = "Debe seleccionar un usuario";
      resultado.style.color = "orange";

      return;
    }

    // VALIDAR

    const valores = {
      apellido: document.getElementById("apellido").value.trim(),
      nombre: document.getElementById("nombre").value.trim(),
      email: document.getElementById("email").value.trim(),
      alias: document.getElementById("alias").value.trim(),
    };

    const errores = validarCampos(valores);

    if (errores.length > 0) {
      resultado.textContent = `Campos inválidos: ${errores.join(", ")}`;

      resultado.style.color = "red";

      return;
    }

    // CLEAN

    const clean = (v) => (v && v.trim() !== "" ? v.trim() : null);

    // BODY

    const body = {
      Apellido: clean(document.getElementById("apellido").value),

      Nombre: clean(document.getElementById("nombre").value),

      Alias: clean(document.getElementById("alias").value),

      Email: clean(document.getElementById("email").value),

      Referente: clean(document.getElementById("referente").value),

      Fecha_Nacimiento:
        document.getElementById("fecha_nacimiento").value || null,

      Empresa: clean(document.getElementById("empresa").value),

      Convenio: clean(document.getElementById("convenio").value),

      Ciudad: clean(document.getElementById("ciudad").value),
    };

    try {
      const res = await fetch(basePath + `/abm_usuarios/${legajo}`, {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        if (successModal) {
          const modalBody = document.getElementById("successModalBody");

          modalBody.textContent = `Usuario actualizado correctamente`;

          successModal.show();
        } else {
          alert("Usuario actualizado");
        }

        resultado.textContent = "";
        resultado.style.color = "green";
      } else {
        resultado.textContent = data.mensaje || "Error actualizando usuario";

        resultado.style.color = "red";
      }
    } catch (error) {
      console.error(error);

      resultado.textContent = "Error de conexión";
      resultado.style.color = "red";
    }
  });

  // =========================================================
  // 4️⃣ GRUPO ACTUAL DEL USUARIO
  // =========================================================

  router.get("/abm_usuarios/:id_usuario/grupo-actual", async (req, res) => {
    const { id_usuario } = req.params;

    try {
      const pool = await poolPromise;

      const result = await pool
        .request()
        .input("id_usuario", sql.Int, id_usuario).query(`
        SELECT ug.ID_Usuario_Grupo, g.ID_Grupo, g.Grupo, g.Subgrupo
        FROM ${schema}.USUARIO_GRUPO ug
        INNER JOIN ${schema}.GRUPO g ON g.ID_Grupo = ug.ID_Grupo
        WHERE ug.ID_Usuario = @id_usuario
          AND ug.Vigencia_Hasta IS NULL;
      `);

      if (result.recordset.length === 0) {
        return res.json({ success: true, tieneGrupo: false });
      }

      res.json({
        success: true,
        tieneGrupo: true,
        actual: result.recordset[0],
      });
    } catch (error) {
      console.error("Error obteniendo grupo actual:", error);
      res
        .status(500)
        .json({ success: false, mensaje: "Error interno del servidor" });
    }
  });

  // =========================================================
  // 5️⃣ LISTA DE GRUPOS (nombres únicos)
  // =========================================================

  router.get("/grupos", async (req, res) => {
    try {
      const pool = await poolPromise;
      const result = await pool.request().query(`
      SELECT DISTINCT Grupo FROM ${schema}.GRUPO ORDER BY Grupo;
    `);
      res.json({ success: true, grupos: result.recordset.map((r) => r.Grupo) });
    } catch (error) {
      console.error("Error obteniendo grupos:", error);
      res
        .status(500)
        .json({ success: false, mensaje: "Error interno del servidor" });
    }
  });

  // =========================================================
  // 6️⃣ SUBGRUPOS DE UN GRUPO
  // =========================================================

  router.get("/grupos/subgrupos", async (req, res) => {
    const { grupo } = req.query;

    if (!grupo) {
      return res
        .status(400)
        .json({ success: false, mensaje: "Falta el parámetro grupo" });
    }

    try {
      const pool = await poolPromise;
      const result = await pool.request().input("grupo", sql.VarChar, grupo)
        .query(`
        SELECT ID_Grupo, Subgrupo
        FROM ${schema}.GRUPO
        WHERE Grupo = @grupo
        ORDER BY Subgrupo;
      `);

      res.json({ success: true, subgrupos: result.recordset });
    } catch (error) {
      console.error("Error obteniendo subgrupos:", error);
      res
        .status(500)
        .json({ success: false, mensaje: "Error interno del servidor" });
    }
  });

  // =========================================================
  // 7️⃣ CAMBIAR GRUPO DEL USUARIO (cierra actual + crea nuevo)
  // =========================================================

  router.put("/abm_usuarios/:id_usuario/cambiar-grupo", async (req, res) => {
    const { id_usuario } = req.params;
    const { id_grupo_nuevo } = req.body;

    if (!id_grupo_nuevo) {
      return res
        .status(400)
        .json({ success: false, mensaje: "Falta id_grupo_nuevo" });
    }

    let transaction;

    try {
      const pool = await poolPromise;
      transaction = new sql.Transaction(pool);
      await transaction.begin();

      const request = new sql.Request(transaction);

      await request.input("id_usuario", sql.Int, id_usuario).query(`
        UPDATE ${schema}.USUARIO_GRUPO
        SET Vigencia_Hasta = CAST(GETDATE() AS DATE)
        WHERE ID_Usuario = @id_usuario AND Vigencia_Hasta IS NULL;
      `);

      await request.input("id_grupo_nuevo", sql.Int, id_grupo_nuevo).query(`
        INSERT INTO ${schema}.USUARIO_GRUPO (ID_Usuario, ID_Grupo, Vigencia_Desde, Vigencia_Hasta)
        VALUES (@id_usuario, @id_grupo_nuevo, CAST(GETDATE() AS DATE), NULL);
      `);

      await transaction.commit();

      res.json({ success: true, mensaje: "Grupo actualizado correctamente" });
    } catch (error) {
      console.error("Error cambiando grupo:", error);

      if (transaction) {
        try {
          await transaction.rollback();
        } catch (rollbackErr) {
          console.error("Error en rollback:", rollbackErr);
        }
      }

      res
        .status(500)
        .json({ success: false, mensaje: "Error interno del servidor" });
    }
  });
});
