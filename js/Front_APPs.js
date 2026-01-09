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

  // ------------------------------
  // 2) ARRAY ORIGINAL DE APPS
  // ------------------------------
  const apps = [
    { id: 4, name: "Robot Itas", category: "Personal", collection: "Bots", img: "../images/robot.png", url: "../pages/EjecucionesPorRobot.html" },
    { id: 3, name: "APP Ordenes SF", category: "Personal", collection: "Bots", img: "../images/robot_01.png", url: "../pages/AppOrdenesSf.html" },
    { id: 7, name: "Helix", category: "Personal", collection: "Gestión", img: "../images/bmx_helix.png" },
 // { id: 9, name: "Compartido", category: "Privado", collection: "Gestión", img: "https://img.icons8.com/fluency/48/folder-invoices.png" },
    { id: 8, name: "Monitoreo", category: "Personal", collection: "Gestión", img: "../images/Grafana.png", url: "https://portal-itas.telecom.com.ar:3000/grafana/public-dashboards/e5368ad7e39f41d99b6f28c003e9f998" },
    { id: 1, name: "ABM Usuarios", category: "Privado", collection: "Gestión", img: "../images/ABM.jpg", url: "../pages/ModulosAbmUsuarios.html" }
  ];

  // ------------------------------
  // 3) TRAER PERMISOS DEL BACKEND
  // ------------------------------
  let appsPermitidas = []; // Si el backend dice nada → mostramos todas

  try {
    const res = await fetch(`${basePath}/permisos`, {
    credentials: "include"
    });

    const data = await res.json();

    if (data.ok && Array.isArray(data.aplicacionesPermitidas)) {
      appsPermitidas = data.aplicacionesPermitidas; // ej: [2,3,6]
    }
  } catch (error) {
    console.error("Error obteniendo permisos:", error);
  }

  console.log("Apps permitidas por backend:", appsPermitidas);

  // ------------------------------
  // 4) APLICAR FILTRO DE PERMISOS
  // ------------------------------
  let appsFiltradas = apps;

  if (appsPermitidas.length > 0) {
    appsFiltradas = apps.filter(app => appsPermitidas.includes(app.id));
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
      const resp = await fetch(basePath + '/me');
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
