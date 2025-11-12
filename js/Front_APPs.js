document.addEventListener("DOMContentLoaded", () => {
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
 
  const apps = [
    { id: 1, name: "Robot Itas", category: "Telecom", collection: "Bots", img: "../images/robot.png" ,url: "../pages/EjecucionesPorRobot.html" },
    { id: 2, name: "APP Ordenes SF", category: "Telecom", collection: "Bots", img: "../images/robot_01.png",url:"../pages/AppOrdenesSf.html" },
    { id: 3, name: "Helix", category: "Telecom", collection: "Gestión", img: "../images/bmx_helix.png" },
    { id: 4, name: "Compartido", category: "Privados", collection: "Gestión", img: "https://img.icons8.com/fluency/48/folder-invoices.png" },
    { id: 5, name: "Grafana", category: "Telecom", collection: "Gestión", img: "../images/Grafana.png",url:"http://10.4.48.116:3000/login" },
    { id: 6, name: "ABM Usuarios", category: "Privado", collection: "Gestión", img: "../images/ABM.jpg",url:"../pages/ModulosAbmUsuarios.html" }
  ];
 
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
 
      // Fav click
      const favBtn = card.querySelector(".favorite");
      favBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        favorites.has(app.id) ? favorites.delete(app.id) : favorites.add(app.id);
        updateCounters();
        renderApps(filterApps());
      });
 
      // Modal on click
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
    countAll.textContent = apps.length;
    countFavorites.textContent = favorites.size;
  }
 
  function filterApps() {
    const query = searchInput.value.toLowerCase();
    const category = categoryFilter.value;
    const collection = collectionFilter.value;
 
    return apps.filter(app => {
      const matchSearch = app.name.toLowerCase().includes(query);
      const matchCategory = category === "all" || app.category === category;
      const matchCollection = collection === "all" || app.collection === collection;
      const matchFavorite = filterFavorites.classList.contains("active-filter") ? favorites.has(app.id) : true;
 
      return matchSearch && matchCategory && matchCollection && matchFavorite;
    });
  }
 
  function initFilters() {
    const categories = [...new Set(apps.map(a => a.category))];
    categories.forEach(cat => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      categoryFilter.appendChild(opt);
    });
 
    const collections = [...new Set(apps.map(a => a.collection))];
    collections.forEach(col => {
      const opt = document.createElement("option");
      opt.value = col;
      opt.textContent = col;
      collectionFilter.appendChild(opt);
    });
  }
 
  // Eventos
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
 
  // Carga inicial
  loading.classList.remove("d-none");
  setTimeout(() => {
    loading.classList.add("d-none");
    initFilters();
    updateCounters();
    renderApps(apps);
  }, 800);
});
 
 