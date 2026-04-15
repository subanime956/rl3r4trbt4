const GENEROS_DISPONIBLES = [
  "acción","artes marciales","aventuras","carreras","ciencia ficción","comedia",
  "demencia","demonios","deportes","drama","ecchi","escolares","espacial",
  "fantasía","harem","historico","infantil","josei","juegos","magia","mecha",
  "militar","misterio","música","parodia","policía","psicológico",
  "recuentos de la vida","romance","samurai","seinen","shoujo","shounen",
  "sobrenatural","superpoderes","suspenso","terror","vampiros","yaoi","yuri"
];

const params = new URLSearchParams(window.location.search);
const search = params.get("search") || "";
const genres = params.getAll("genre");
const estado = params.get("estado") || "";
const idioma = params.get("idioma") || "";
const sinCensura = params.get("sin_censura") || "";
const page = parseInt(params.get("page")) || 1;
const porPagina = 20;

const resultados = document.getElementById("resultados");
const paginacion = document.getElementById("paginacion");
const resultadoCantidad = document.getElementById("resultadoCantidad");
const searchChip = document.getElementById("searchChip");
const searchChipText = document.getElementById("searchChipText");

const openFiltersBtn = document.getElementById("openFiltersBtn");
const closeFiltersBtn = document.getElementById("closeFiltersBtn");
const filterModal = document.getElementById("filterModal");
const filterModalBackdrop = document.getElementById("filterModalBackdrop");

function cerrarTodosLosModales() {
  // Cerrar modal principal (seguro)
  if (filterModal) filterModal.classList.remove("is-open");
  if (filterModalBackdrop) filterModalBackdrop.classList.remove("is-open");
  document.body.classList.remove("no-scroll");

  // Cerrar paneles internos
  if (typeof closeAllPanels === "function") closeAllPanels();

  // Resetear scroll del panel de géneros (seguro)
  if (typeof genrePanel !== "undefined" && genrePanel) {
    genrePanel.scrollTop = 0;
  }
}

const filterForm = document.getElementById("filterForm");
const filterCountBadge = document.getElementById("filterCountBadge");

const genrePanel = document.getElementById("genrePanel");
const estadoPanel = document.getElementById("estadoPanel");
const idiomaPanel = document.getElementById("idiomaPanel");
const toggleGenresBtn = document.getElementById("toggleGenresBtn");
const toggleEstadoBtn = document.getElementById("toggleEstadoBtn");
const toggleIdiomaBtn = document.getElementById("toggleIdiomaBtn");
const genresSummary = document.getElementById("genresSummary");
const estadoSummary = document.getElementById("estadoSummary");
const idiomaSummary = document.getElementById("idiomaSummary");

function escapeHtml(str){
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#39;");
}

function capitalizeWords(text){
  return text
    .toLowerCase()
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function renderGenreOptions(){
  genrePanel.innerHTML = GENEROS_DISPONIBLES.map(g => `
    <label class="option-row">
      <input type="checkbox" name="genre" value="${g}">
      <span class="check-ui"></span>
      <span>${capitalizeWords(g)}</span>
    </label>
  `).join("");
}

function openModal(){
  filterModal.classList.add("is-open");
  filterModalBackdrop.classList.add("is-open");
  document.body.classList.add("no-scroll");
}


function closeAllPanels(){
  genrePanel.classList.remove("is-open");
  estadoPanel.classList.remove("is-open");
  idiomaPanel.classList.remove("is-open");
}

function closeModal(){
  filterModal.classList.remove("is-open");
  filterModalBackdrop.classList.remove("is-open");
  document.body.classList.remove("no-scroll");
  closeAllPanels();
}

openFiltersBtn?.addEventListener("click", openModal);
closeFiltersBtn?.addEventListener("click", closeModal);
filterModalBackdrop?.addEventListener("click", closeModal);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

window.addEventListener("pageshow", cerrarTodosLosModales);
window.addEventListener("popstate", cerrarTodosLosModales);

toggleGenresBtn?.addEventListener("click", function(){
  const willOpen = !genrePanel.classList.contains("is-open");
  closeAllPanels();
if (willOpen) {
  genrePanel.classList.add("is-open");
  genrePanel.scrollTop = 0;
}
});

toggleEstadoBtn?.addEventListener("click", function(){
  const willOpen = !estadoPanel.classList.contains("is-open");
  closeAllPanels();
  if (willOpen) estadoPanel.classList.add("is-open");
});

toggleIdiomaBtn?.addEventListener("click", function(){
  const willOpen = !idiomaPanel.classList.contains("is-open");
  closeAllPanels();
  if (willOpen) idiomaPanel.classList.add("is-open");
});

document.addEventListener("click", function(e){
  const link = e.target.closest("a");
  if (link) {
    cerrarTodosLosModales();
    return;
  }

  if (!filterModal.contains(e.target) && !openFiltersBtn.contains(e.target)) return;

  if (!toggleGenresBtn.contains(e.target) && !genrePanel.contains(e.target)) {
    genrePanel.classList.remove("is-open");
    genrePanel.scrollTop = 0;
  }

  if (!toggleEstadoBtn.contains(e.target) && !estadoPanel.contains(e.target)) {
    estadoPanel.classList.remove("is-open");
  }

  if (!toggleIdiomaBtn.contains(e.target) && !idiomaPanel.contains(e.target)) {
    idiomaPanel.classList.remove("is-open");
  }
});
if (search.trim()) {
  searchChip.style.display = "flex";
  searchChipText.textContent = search;
} else {
  searchChip.style.display = "none";
}

function updateFilterCount(){
  let total = 0;
  total += genres.length;
  if (estado) total += 1;
  if (idioma) total += 1;
  if (sinCensura === "1") total += 1;

  if (total > 0){
    filterCountBadge.style.display = "flex";
    filterCountBadge.textContent = total;
  } else {
    filterCountBadge.style.display = "none";
  }
}

function updateSummaries(){
  const selectedGenres = [...document.querySelectorAll('input[name="genre"]:checked')].map(i => i.value);
  genresSummary.textContent = selectedGenres.length ? `${selectedGenres.length} seleccionados` : "Seleccionar";

  const estadoRadio = document.querySelector('input[name="estado"]:checked');
  const estadoMap = {
    "": "Seleccionar",
    finalizado: "Finalizado",
    emision: "En emisión"
  };
  estadoSummary.textContent = estadoRadio ? (estadoMap[estadoRadio.value] || estadoRadio.value) : "Seleccionar";

  const idiomaRadio = document.querySelector('input[name="idioma"]:checked');
  const idiomaMap = {
    "": "Seleccionar",
    sub: "Subtitulado",
    latino: "Latino"
  };
  idiomaSummary.textContent = idiomaRadio ? (idiomaMap[idiomaRadio.value] || idiomaRadio.value) : "Seleccionar";
}

function marcarFiltrosActuales(){
  document.querySelectorAll('input[name="genre"]').forEach(input => {
    input.checked = genres.includes(input.value);
  });

  document.querySelectorAll('input[name="estado"]').forEach(input => {
    input.checked = estado ? input.value === estado : input.value === "";
  });

  document.querySelectorAll('input[name="idioma"]').forEach(input => {
    input.checked = idioma ? input.value === idioma : input.value === "";
  });

  const sinCensuraCheck = document.getElementById("sinCensuraCheck");
  if (sinCensuraCheck) sinCensuraCheck.checked = sinCensura === "1";

  updateSummaries();
}

document.addEventListener("change", function(e){
  if (
    e.target.matches('input[name="genre"]') ||
    e.target.matches('input[name="estado"]') ||
    e.target.matches('input[name="idioma"]')
  ) {
    updateSummaries();
  }
});
const resetFiltrosBtn = document.getElementById("resetFiltros");

function resetearFormularioVisual() {
  // Géneros
  document.querySelectorAll('input[name="genre"]').forEach(input => {
    input.checked = false;
  });

  // Estado
  document.querySelectorAll('input[name="estado"]').forEach(input => {
    input.checked = input.value === "";
  });

  // Idioma
  document.querySelectorAll('input[name="idioma"]').forEach(input => {
    input.checked = input.value === "";
  });

  // Sin censura
  const sinCensuraInput = document.getElementById("sinCensuraCheck");
  if (sinCensuraInput) sinCensuraInput.checked = false;

  // Cerrar paneles abiertos
  closeAllPanels();

  // Refrescar textos visuales
  updateSummaries();
}

resetFiltrosBtn?.addEventListener("click", function () {
  resetearFormularioVisual();

  // Deja únicamente la búsqueda actual si existe
  const nuevosParams = new URLSearchParams();
  if (search.trim()) nuevosParams.set("search", search);

  const query = nuevosParams.toString();

if (query) {
  window.location.search = query;
} else {
  window.location.href = window.location.pathname;
}
});
filterForm?.addEventListener("submit", function(e){
  e.preventDefault();

  const nuevosParams = new URLSearchParams();
  if (search.trim()) nuevosParams.set("search", search);

  const generosSeleccionados = [...document.querySelectorAll('input[name="genre"]:checked')].map(input => input.value);
  generosSeleccionados.forEach(g => nuevosParams.append("genre", g));

  const estadoSeleccionado = document.querySelector('input[name="estado"]:checked')?.value || "";
  const idiomaSeleccionado = document.querySelector('input[name="idioma"]:checked')?.value || "";
  const nuevoSinCensura = document.getElementById("sinCensuraCheck")?.checked;

  if (estadoSeleccionado) nuevosParams.set("estado", estadoSeleccionado);
  if (idiomaSeleccionado) nuevosParams.set("idioma", idiomaSeleccionado);
  if (nuevoSinCensura) nuevosParams.set("sin_censura", "1");

const query = nuevosParams.toString();

if (query) {
  window.location.search = query;
} else {
  window.location.href = window.location.pathname;
}
});

function buildQuery(pageNum){
  const params = new URLSearchParams();

  if (search.trim()) params.set("search", search);
  genres.forEach(g => params.append("genre", g));
  if (estado) params.set("estado", estado);
  if (idioma) params.set("idioma", idioma);
  if (sinCensura === "1") params.set("sin_censura", "1");
  params.set("page", pageNum);

  return params.toString();
}

function filtrarCatalogo(data){
  let filtrados = [...data];

  if (search){
    const needle = search.toLowerCase();
    filtrados = filtrados.filter(item => {
      const titulo = (item.titulo || "").toLowerCase();
      const keywords = (item.keywords || "").toLowerCase();
      return titulo.includes(needle) || keywords.includes(needle);
    });
  }

  if (genres.length > 0){
    filtrados = filtrados.filter(item => {
      if (!item.genero) return false;
      const itemGenres = item.genero.toLowerCase().split(",").map(g => g.trim());
      return genres.every(g => itemGenres.includes(g.toLowerCase()));
    });
  }

  if (estado){
    filtrados = filtrados.filter(item => (item.estado || "").toLowerCase() === estado.toLowerCase());
  }

  if (idioma){
    filtrados = filtrados.filter(item => (item.idioma || "").toLowerCase() === idioma.toLowerCase());
  }

  if (sinCensura === "1"){
    filtrados = filtrados.filter(item => (
      item.sin_censura === true ||
      item.sin_censura === 1 ||
      item.sin_censura === "1"
    ));
  }

  return filtrados;
}

function renderCards(items){
  if (!items.length){
    resultados.innerHTML = `<div class="empty-state">No se encontraron resultados.</div>`;
    return;
  }

  resultados.innerHTML = items.map(item => `
    <a class="card" href="${item.url}">
      <div class="card-thumb">
${item.badge ? `<div class="card-badge-wrap"><div class="card-badge">${escapeHtml(item.badge)}</div></div>` : ""}
        <img src="${item.imagen}" alt="${escapeHtml(item.titulo)}" loading="lazy">
      </div>
      <div class="card-content">
        <h3>${escapeHtml(item.titulo)}</h3>
      </div>
    </a>
  `).join("");
}

function renderPagination(totalItems){
  const totalPaginas = Math.ceil(totalItems / porPagina);

  if (totalPaginas <= 1){
    paginacion.innerHTML = "";
    return;
  }

  let pagHTML = "";
  const maxVisible = 5;

  if (page > 1) pagHTML += `<a href="?${buildQuery(page - 1)}">«</a>`;

  let start = Math.max(1, page - Math.floor(maxVisible / 2));
  let end = start + maxVisible - 1;

  if (end > totalPaginas){
    end = totalPaginas;
    start = Math.max(1, end - maxVisible + 1);
  }

  if (start > 1){
    pagHTML += `<a href="?${buildQuery(1)}">1</a>`;
    if (start > 2) pagHTML += `<span>...</span>`;
  }

  for (let i = start; i <= end; i++){
    pagHTML += i === page
      ? `<a href="?${buildQuery(i)}" class="active">${i}</a>`
      : `<a href="?${buildQuery(i)}">${i}</a>`;
  }

  if (end < totalPaginas){
    if (end < totalPaginas - 1) pagHTML += `<span>...</span>`;
    pagHTML += `<a href="?${buildQuery(totalPaginas)}">${totalPaginas}</a>`;
  }

  if (page < totalPaginas) pagHTML += `<a href="?${buildQuery(page + 1)}">»</a>`;

  paginacion.innerHTML = pagHTML;
}

async function loadData(){
  const res = await fetch("data.json", { cache: "no-store" });
  if (!res.ok) throw new Error("No se pudo cargar data.json");
  return await res.json();
}

async function init(){
  renderGenreOptions();
  marcarFiltrosActuales();
  updateFilterCount();

  const data = await loadData();
  const filtrados = filtrarCatalogo(data);
  resultadoCantidad.textContent = filtrados.length;

  const inicio = (page - 1) * porPagina;
  const fin = inicio + porPagina;
  const paginaItems = filtrados.slice(inicio, fin);

  renderCards(paginaItems);
  renderPagination(filtrados.length);
}

init();
