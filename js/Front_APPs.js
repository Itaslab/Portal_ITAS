document.addEventListener("DOMContentLoaded", async () => {
  const appGrid = document.querySelector("#appGrid");
  const searchInput = document.querySelector("#searchInput");
  const filterAll = document.querySelector("#filterAll");
  const filterFavorites = document.querySelector("#filterFavorites");
  const countAll = document.querySelector("#countAll");
  const countFavorites = document.querySelector("#countFavorites");
  const loading = document.querySelector("#loading");
  const noResults = document.querySelector("#noResults");
  const categoryFilter = document.querySelector("#categoryFilter");
  const collectionFilter = document.querySelector("#collectionFilter");
  const modal = new bootstrap.Modal(document.getElementById("appModal"));
  const modalMessage = document.querySelector("#modal-message");

  // --- USER PROFILE ---
  const userGreeting = document.getElementById('userGreeting');
  const openProfile = document.getElementById('openProfile');
  const perfilModalEl = document.getElementById('perfilModal');
  const perfilModal = perfilModalEl ? new bootstrap.Modal(perfilModalEl) : null;
  const perfilNombre = document.getElementById('perfilNombre');
  const perfilApellido = document.getElementById('perfilApellido');
  const perfilEmail = document.getElementById('perfilEmail');
  const perfilCurrentPass = document.getElementById('perfilCurrentPass');
  const perfilNewPass = document.getElementById('perfilNewPass');
  const perfilSaveBtn = document.getElementById('perfilSaveBtn');
  const perfilResult = document.getElementById('perfilResult');

  // --- MODAL CAMBIO OBLIGATORIO DE CONTRASEÑA ---
  const forcePasswordModalEl = document.getElementById('forcePasswordModal');
  const forcePasswordModal = forcePasswordModalEl ? new bootstrap.Modal(forcePasswordModalEl, { backdrop: 'static', keyboard: false }) : null;
  const forceNewPass1 = document.getElementById('forceNewPass1');
  const forceNewPass2 = document.getElementById('forceNewPass2');
  const forcePassSaveBtn = document.getElementById('forcePassSaveBtn');
  const forcePassResult = document.getElementById('forcePassResult');

  // --- DETECTAR SI ES CAMBIO OBLIGATORIO DE CONTRASEÑA ---
  const urlParams = new URLSearchParams(window.location.search);
  const forcePass = urlParams.get('forcePass') === '1';
  let passwordChangedOnce = false;

  // Si es cambio obligatorio, mostrar modal inmediatamente
  if (forcePass && forcePasswordModal) {
    setTimeout(() => {
      forceNewPass1.value = '';
      forceNewPass2.value = '';
      forcePassResult.innerHTML = '';
      forcePasswordModal.show();
    }, 800);
  }

  // Evento del botón para cambiar contraseña forzado
  if (forcePassSaveBtn) {
    forcePassSaveBtn.addEventListener('click', async () => {
      forcePassResult.innerHTML = '';
      const pass1 = forceNewPass1.value.trim();
      const pass2 = forceNewPass2.value.trim();

      // Validaciones
      if (!pass1 || !pass2) {
        forcePassResult.innerHTML = '<div class="alert alert-danger">Complete ambos campos</div>';
        return;
      }

      if (pass1 !== pass2) {
        forcePassResult.innerHTML = '<div class="alert alert-danger">Las contraseñas no coinciden</div>';
        return;
      }

      if (pass1.length < 8) {
        forcePassResult.innerHTML = '<div class="alert alert-danger">La contraseña debe tener al menos 8 caracteres</div>';
        return;
      }

      if (pass1.length > 15) {
        forcePassResult.innerHTML = '<div class="alert alert-danger">La contraseña no debe exceder 15 caracteres</div>';
        return;
      }

      try {
        // Para cambio forzado, usamos la contraseña actual del usuario (que está en la sesión)
        // El servidor la validará. El cliente envía la nueva contraseña dos veces para confirmar.
        const r = await fetch(basePath + '/me/password', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentPassword: '', newPassword: pass1, forcePassword: true })
        });

        // Verificar si la sesión es válida
        await verificarSesionValida(r, '/me/password');

        const d = await r.json();
        if (r.ok && d.success) {
          forcePassResult.innerHTML = '<div class="alert alert-success">Contraseña establecida correctamente</div>';
          setTimeout(() => {
            window.history.replaceState({}, document.title, window.location.pathname);
            forcePasswordModal.hide();
          }, 1200);
        } else {
          forcePassResult.innerHTML = `<div class="alert alert-danger">${d.error || d.mensaje || 'Error'}</div>`;
        }
      } catch (err) {
        console.error('Error actualizando contraseña:', err);
        forcePassResult.innerHTML = '<div class="alert alert-danger">Error al conectar con servidor</div>';
      }
    });
  }

  // ------------------------------
  // 2) ARRAY ORIGINAL DE APPS
  // ------------------------------
  const apps = [
    { id: 4, name: "Robot Itas", category: "Personal", collection: "Bots", img: "../images/robot.png", url: "../pages/EjecucionesPorRobot.html" },
    { id: 3, name: "APP Ordenes SF", category: "Personal", collection: "Bots", img: "../images/robot_01.png", url: "../pages/AppOrdenesSf.html" },
    { id: 7, name: "Helix", category: "Personal", collection: "Gestión", img: "../images/bmx_helix.png" },
    { id: 6, name: "Seguridad Informatica", category: "Privado", collection: "Gestión", img: "../images/SeguridadInformatica.jpg", url: "../pages/SeguridadInformatica.html" },
    { id: 8, name: "Monitoreo", category: "Personal", collection: "Gestión", img: "../images/Grafana.png", url: "https://portal-itas.telecom.com.ar:3000/grafana/public-dashboards/e5368ad7e39f41d99b6f28c003e9f998" },
    { id: 11, name: "ABM Usuarios", category: "Privado", collection: "Gestión", img: "../images/ABM.jpg", url: "../pages/ModulosAbmUsuarios.html" }
  ];

  // ------------------------------
  // 3) TRAER PERMISOS DEL BACKEND
  // ------------------------------
  let appsPermitidas = [];
  let usuarioEncontrado = false;
  let esAdmin = false;

  try {
    const res = await fetch(`${basePath}/permisos`, {
      credentials: "include"
    });

    // Verificar si la sesión es válida
    await verificarSesionValida(res, '/permisos');

    const data = await res.json();

    if (data.ok) {
      usuarioEncontrado = data.usuarioEncontrado || false;
      esAdmin = data.esAdmin || false;
      if (Array.isArray(data.aplicacionesPermitidas)) {
        appsPermitidas = data.aplicacionesPermitidas; // ej: [3,4,8]
      }
    } else {
      console.warn("Respuesta inesperada del servidor:", data);
    }
  } catch (error) {
    console.error("Error obteniendo permisos:", error);
  }

  console.log("Usuario encontrado:", usuarioEncontrado, "Es Admin:", esAdmin, "Apps permitidas:", appsPermitidas);

  // ------------------------------
  // 4) APLICAR FILTRO DE PERMISOS
  // ------------------------------
  let appsFiltradas = apps;

  // Si el usuario NO está en la tabla, no mostrar nada
  if (!usuarioEncontrado) {
    appsFiltradas = [];
  }
  // Si es admin, mostrar todas
  else if (esAdmin) {
    appsFiltradas = apps;
  }
  // Si tiene permisos específicos, filtrar
  else if (appsPermitidas.length > 0) {
    appsFiltradas = apps.filter(app => appsPermitidas.includes(app.id));
  }
  // Si está en la tabla pero sin permisos específicos, no mostrar nada
  else {
    appsFiltradas = [];
  }

  // ------------------------------
  // RESTO DEL CÓDIGO ORIGINAL
  // ------------------------------

  let favorites = new Set();

  function renderApps(data) {
    appGrid.innerHTML = "";
    if (data.length === 0) {
      noResults.classList.remove("d-none");
      return;
    }
    noResults.classList.add("d-none");

    data.forEach(app => {
      const col = document.createElement("div");
      col.className = "col";

      const card = document.createElement("div");
      card.className = "card h-100 text-center shadow-sm card-hover";

      card.innerHTML = `
        <div class="position-absolute top-0 end-0 p-2">
          <span class="favorite fs-4 ${favorites.has(app.id) ? 'text-warning' : 'text-muted'}" style="cursor:pointer;">★</span>
        </div>
        <img src="${app.img}" class="card-img-top mx-auto mt-4" style="width: 80px; height: 80px;" alt="${app.name}">
        <div class="card-body">
          <h5 class="card-title">${app.name}</h5>
          <p class="card-text text-muted">${app.category}</p>
        </div>
      `;

      const favBtn = card.querySelector(".favorite");
      favBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        favorites.has(app.id) ? favorites.delete(app.id) : favorites.add(app.id);
        updateCounters();
        renderApps(filterApps());
      });

      card.addEventListener("click", () => {
        if (app.url) {
          window.location.href = app.url;
        } else {
          modalMessage.textContent = `Has abierto la aplicación: ${app.name}`;
          modal.show();
        }
      });

      col.appendChild(card);
      appGrid.appendChild(col);
    });
  }

  function updateCounters() {
    countAll.textContent = appsFiltradas.length;
    countFavorites.textContent = favorites.size;
  }

  function filterApps() {
    const query = searchInput.value.toLowerCase();
    const category = categoryFilter.value;
    const collection = collectionFilter.value;

    return appsFiltradas.filter(app => {
      const matchSearch = app.name.toLowerCase().includes(query);
      const matchCategory = category === "all" || app.category === category;
      const matchCollection = collection === "all" || app.collection === collection;
      const matchFavorite = filterFavorites.classList.contains("active-filter")
        ? favorites.has(app.id)
        : true;

      return matchSearch && matchCategory && matchCollection && matchFavorite;
    });
  }

  function initFilters() {
    const categories = [...new Set(appsFiltradas.map(a => a.category))];
    categories.forEach(cat => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      categoryFilter.appendChild(opt);
    });

    const collections = [...new Set(appsFiltradas.map(a => a.collection))];
    collections.forEach(col => {
      const opt = document.createElement("option");
      opt.value = col;
      opt.textContent = col;
      collectionFilter.appendChild(opt);
    });
  }

  searchInput.addEventListener("input", () => renderApps(filterApps()));
  categoryFilter.addEventListener("change", () => renderApps(filterApps()));
  collectionFilter.addEventListener("change", () => renderApps(filterApps()));

  filterAll.addEventListener("click", () => {
    filterAll.classList.add("active-filter");
    filterFavorites.classList.remove("active-filter", "text-primary");
    renderApps(filterApps());
  });

  filterFavorites.addEventListener("click", () => {
    filterFavorites.classList.add("active-filter", "text-primary");
    filterAll.classList.remove("active-filter");
    renderApps(filterApps());
  });

  document.querySelector("#modal-close-btn").addEventListener("click", () => {
    modal.hide();
  });

  loading.classList.remove("d-none");
  setTimeout(() => {
    loading.classList.add("d-none");
    initFilters();
    updateCounters();
    renderApps(appsFiltradas);
  }, 800);

  // ------------------------------
  // Cargar info del usuario para el greeting y el modal
  // ------------------------------
  async function loadProfile() {
    try {
      const resp = await fetch(basePath + '/me', { credentials: "include" });
      
      // Verificar si la sesión es válida
      await verificarSesionValida(resp, '/me');
      
      if (!resp.ok) return;
      const data = await resp.json();
      if (!data.success || !data.usuario) return;
      const u = data.usuario;
      userGreeting.textContent = `Hola! ${u.Nombre || ''}`;
      if (perfilNombre) perfilNombre.value = u.Nombre || '';
      if (perfilApellido) perfilApellido.value = u.Apellido || '';
      if (perfilEmail) perfilEmail.value = u.Email || '';
    } catch (err) {
      console.error('Error cargando perfil:', err);
    }
  }

  loadProfile();

  if (openProfile && perfilModal) {
    openProfile.addEventListener('click', () => {
      perfilResult.textContent = '';
      perfilCurrentPass.value = '';
      perfilNewPass.value = '';
      perfilModal.show();
    });
  }

  if (perfilSaveBtn) {
    perfilSaveBtn.addEventListener('click', async () => {
      perfilResult.textContent = '';
      const current = perfilCurrentPass.value.trim();
      const nw = perfilNewPass.value.trim();
      if (!current || !nw) {
        perfilResult.innerHTML = '<div class="text-danger">Complete ambos campos</div>';
        return;
      }
      if (nw.length < 8) {
        perfilResult.innerHTML = '<div class="text-danger">La contraseña debe tener al menos 8 caracteres</div>';
        return;
      }
      if (nw.length > 15) {
        perfilResult.innerHTML = '<div class="text-danger">La contraseña no debe exceder 15 caracteres</div>';
        return;
      }
      // Ensure any pasted overlong password is clipped clientside (input has maxlength, but defensive)
      if (nw.length > 15) perfilNewPass.value = nw.slice(0, 15);
      try {
        const r = await fetch(basePath + '/me/password', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentPassword: current, newPassword: nw })
        });
        
        // Verificar si la sesión es válida
        await verificarSesionValida(r, '/me/password');
        
        const d = await r.json();
        if (r.ok && d.success) {
          perfilResult.innerHTML = '<div class="text-success">Contraseña actualizada correctamente</div>';
          setTimeout(() => { perfilModal.hide(); }, 1200);
        } else {
          perfilResult.innerHTML = `<div class="text-danger">${d.error || d.mensaje || 'Error'}</div>`;
        }
      } catch (err) {
        console.error('Error actualizando contraseña:', err);
        perfilResult.innerHTML = '<div class="text-danger">Error al conectar con servidor</div>';
      }
    });
  }
});
