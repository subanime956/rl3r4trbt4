const GENEROS_DISPONIBLES = [
  "acción","artes marciales","aventuras","carreras","ciencia ficción","comedia",
  "demencia","demonios","deportes","drama","ecchi","escolares","espacial",
  "fantasía","harem","historico","infantil","josei","juegos","magia","mecha",
  "militar","misterio","música","parodia","policía","psicológico",
  "recuentos de la vida","romance","samurai","seinen","shoujo","shounen",
  "sobrenatural","superpoderes","suspenso","terror","vampiros","yaoi","yuri"
];

const CATEGORIAS_DISPONIBLES = [
  "genshin",
  "date a live",
  "honkai star rail"
];

const AUTORES_DISPONIBLES = [
  "maplestar",
  "raimbo",
  "minus8","demonios","deportes","drama","ecchi","escolares","espacial",
  "fantasía","harem","historico","infantil","josei","juegos","magia","mecha",
  "militar","misterio","música","parodia","policía","psicológico",
  "recuentos de la vida","romance","samurai","seinen","shoujo","shounen",
  "sobrenatural","superpoderes","suspenso","terror","vampiros","yaoi","yuri"
];        

const params = new URLSearchParams(window.location.search);
const search = params.get("search") || "";
const genres = params.getAll("genre");
const categorias = params.getAll("categoria");
const autores = params.getAll("autor");
const estado = params.get("estado") || "";
const idioma = params.get("idioma") || "";
const sinCensura = params.get("sin_censura") || "";
const page = parseInt(params.get("page")) || 1;
const porPagina = 20;

let categoriasSeleccionadasActuales = [...categorias];
let autoresSeleccionadosActuales = [...autores];

const resultados = document.getElementById("resultados");
const paginacion = document.getElementById("paginacion");
const resultadoCantidad = document.getElementById("resultadoCantidad");
const searchChip = document.getElementById("searchChip");
const searchChipText = document.getElementById("searchChipText");

const openFiltersBtn = document.getElementById("openFiltersBtn");
const closeFiltersBtn = document.getElementById("closeFiltersBtn");
const filterModal = document.getElementById("filterModal");
const filterModalBackdrop = document.getElementById("filterModalBackdrop");
const filterForm = document.getElementById("filterForm");
const filterCountBadge = document.getElementById("filterCountBadge");
const resetFiltrosBtn = document.getElementById("resetFiltros");

const genrePanel = document.getElementById("genrePanel");
const categoriasPanel = document.getElementById("categoriasPanel");
const autoresPanel = document.getElementById("autoresPanel");
const estadoPanel = document.getElementById("estadoPanel");
const idiomaPanel = document.getElementById("idiomaPanel");

const categoriasOptions = document.getElementById("categoriasOptions");
const autoresOptions = document.getElementById("autoresOptions");

const categoriasSearch = document.getElementById("categoriasSearch");
const autoresSearch = document.getElementById("autoresSearch");

const toggleGenresBtn = document.getElementById("toggleGenresBtn");
const toggleCategoriasBtn = document.getElementById("toggleCategoriasBtn");
const toggleAutoresBtn = document.getElementById("toggleAutoresBtn");
const toggleEstadoBtn = document.getElementById("toggleEstadoBtn");
const toggleIdiomaBtn = document.getElementById("toggleIdiomaBtn");

const genresSummary = document.getElementById("genresSummary");
const categoriasSummary = document.getElementById("categoriasSummary");
const autoresSummary = document.getElementById("autoresSummary");
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

function closeAllPanels(){
  genrePanel?.classList.remove("is-open");
  categoriasPanel?.classList.remove("is-open");
  autoresPanel?.classList.remove("is-open");
  estadoPanel?.classList.remove("is-open");
  idiomaPanel?.classList.remove("is-open");
}

function openModal(){
  filterModal?.classList.add("is-open");
  filterModalBackdrop?.classList.add("is-open");
  document.body.classList.add("no-scroll");
}

function closeModal(){
  filterModal?.classList.remove("is-open");
  filterModalBackdrop?.classList.remove("is-open");
  document.body.classList.remove("no-scroll");
  closeAllPanels();
  if (genrePanel) genrePanel.scrollTop = 0;
  if (categoriasPanel) categoriasPanel.scrollTop = 0;
  if (autoresPanel) autoresPanel.scrollTop = 0;
}

function closeModalInstant(){
  filterModal?.classList.remove("is-open");
  filterModalBackdrop?.classList.remove("is-open");
  document.body.classList.remove("no-scroll");
  closeAllPanels();
  if (genrePanel) genrePanel.scrollTop = 0;
  if (categoriasPanel) categoriasPanel.scrollTop = 0;
  if (autoresPanel) autoresPanel.scrollTop = 0;
}

function renderGenreOptions(){
  if (!genrePanel) return;

  genrePanel.innerHTML = GENEROS_DISPONIBLES.map(g => `
    <label class="option-row">
      <input type="checkbox" name="genre" value="${g}">
      <span class="check-ui"></span>
      <span>${capitalizeWords(g)}</span>
    </label>
  `).join("");
}

function renderCategoriasOptions(filterText = ""){
  if (!categoriasOptions) return;

  const needle = filterText.trim().toLowerCase();
  const filtradas = CATEGORIAS_DISPONIBLES.filter(c =>
    c.toLowerCase().includes(needle)
  );

  categoriasOptions.innerHTML = filtradas.map(c => `
    <label class="option-row">
      <input type="checkbox" name="categoria" value="${c}" ${categoriasSeleccionadasActuales.includes(c) ? "checked" : ""}>
      <span class="check-ui"></span>
      <span>${capitalizeWords(c)}</span>
    </label>
  `).join("");
}

function renderAutoresOptions(filterText = ""){
  if (!autoresOptions) return;

  const needle = filterText.trim().toLowerCase();
  const filtrados = AUTORES_DISPONIBLES.filter(a =>
    a.toLowerCase().includes(needle)
  );

  autoresOptions.innerHTML = filtrados.map(a => `
    <label class="option-row">
      <input type="checkbox" name="autor" value="${a}" ${autoresSeleccionadosActuales.includes(a) ? "checked" : ""}>
      <span class="check-ui"></span>
      <span>${capitalizeWords(a)}</span>
    </label>
  `).join("");
}

function updateSummaries(){
  const selectedGenres = [...document.querySelectorAll('input[name="genre"]:checked')].map(i => i.value);
  if (genresSummary) {
    genresSummary.textContent = selectedGenres.length
      ? `${selectedGenres.length} seleccionados`
      : "Seleccionar";
  }

  const selectedCategorias = categoriasSeleccionadasActuales;
  if (categoriasSummary) {
    categoriasSummary.textContent = selectedCategorias.length
      ? `${selectedCategorias.length} ${selectedCategorias.length === 1 ? "seleccionada" : "seleccionadas"}`
      : "Seleccionar";
  }

  const selectedAutores = autoresSeleccionadosActuales;
  if (autoresSummary) {
    autoresSummary.textContent = selectedAutores.length
      ? `${selectedAutores.length} ${selectedAutores.length === 1 ? "seleccionado" : "seleccionados"}`
      : "Seleccionar";
  }

  const estadoRadio = document.querySelector('input[name="estado"]:checked');
  const estadoMap = {
    "": "Seleccionar",
    finalizado: "Finalizado",
    emision: "En emisión"
  };
  if (estadoSummary) {
    estadoSummary.textContent = estadoRadio ? (estadoMap[estadoRadio.value] || estadoRadio.value) : "Seleccionar";
  }

  const idiomaRadio = document.querySelector('input[name="idioma"]:checked');
  const idiomaMap = {
    "": "Seleccionar",
    sub: "Subtitulado",
    latino: "Latino"
  };
  if (idiomaSummary) {
    idiomaSummary.textContent = idiomaRadio ? (idiomaMap[idiomaRadio.value] || idiomaRadio.value) : "Seleccionar";
  }
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
function restaurarFormularioDesdeURL() {
  categoriasSeleccionadasActuales = [...categorias];
  autoresSeleccionadosActuales = [...autores];

  if (categoriasSearch) categoriasSearch.value = "";
  if (autoresSearch) autoresSearch.value = "";

  renderCategoriasOptions();
  renderAutoresOptions();
  marcarFiltrosActuales();
  closeAllPanels();

  if (genrePanel) genrePanel.scrollTop = 0;
  if (categoriasPanel) categoriasPanel.scrollTop = 0;
  if (autoresPanel) autoresPanel.scrollTop = 0;
}

function resetearFormularioVisual() {
  document.querySelectorAll('input[name="genre"]').forEach(input => {
    input.checked = false;
  });

  categoriasSeleccionadasActuales = [];
  autoresSeleccionadosActuales = [];

  document.querySelectorAll('input[name="estado"]').forEach(input => {
    input.checked = input.value === "";
  });

  document.querySelectorAll('input[name="idioma"]').forEach(input => {
    input.checked = input.value === "";
  });

  const sinCensuraInput = document.getElementById("sinCensuraCheck");
  if (sinCensuraInput) sinCensuraInput.checked = false;

  if (categoriasSearch) categoriasSearch.value = "";
  if (autoresSearch) autoresSearch.value = "";

  renderCategoriasOptions();
  renderAutoresOptions();

  closeAllPanels();

  if (genrePanel) genrePanel.scrollTop = 0;
  if (categoriasPanel) categoriasPanel.scrollTop = 0;
  if (autoresPanel) autoresPanel.scrollTop = 0;

  updateSummaries();
}

function irConParams(nuevosParams) {
  const query = nuevosParams.toString();

  if (query) {
    window.location.search = query;
  } else {
    window.location.href = window.location.pathname;
  }
}

function updateFilterCount(){
  let total = 0;
  total += genres.length;
  total += categorias.length;
  total += autores.length;
  if (estado) total += 1;
  if (idioma) total += 1;
  if (sinCensura === "1") total += 1;

  if (!filterCountBadge) return;

  if (total > 0){
    filterCountBadge.style.display = "flex";
    filterCountBadge.textContent = total;
  } else {
    filterCountBadge.style.display = "none";
  }
}

openFiltersBtn?.addEventListener("click", openModal);
closeFiltersBtn?.addEventListener("click", closeModal);
filterModalBackdrop?.addEventListener("click", closeModal);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

window.addEventListener("pageshow", function (e) {
  const navEntry = performance.getEntriesByType("navigation")[0];
  const isBackForward = e.persisted || (navEntry && navEntry.type === "back_forward");

  if (isBackForward) {
    closeModalInstant();
    restaurarFormularioDesdeURL();
  }
});

toggleGenresBtn?.addEventListener("click", function(){
  if (!genrePanel) return;

  const willOpen = !genrePanel.classList.contains("is-open");
  closeAllPanels();

  if (willOpen) {
    genrePanel.classList.add("is-open");
    genrePanel.scrollTop = 0;
  }
});

toggleCategoriasBtn?.addEventListener("click", function(){
  if (!categoriasPanel) return;

  const willOpen = !categoriasPanel.classList.contains("is-open");
  closeAllPanels();

  if (willOpen) {
    categoriasPanel.classList.add("is-open");
    categoriasPanel.scrollTop = 0;
    categoriasSearch?.focus();
  }
});

toggleAutoresBtn?.addEventListener("click", function(){
  if (!autoresPanel) return;

  const willOpen = !autoresPanel.classList.contains("is-open");
  closeAllPanels();

  if (willOpen) {
    autoresPanel.classList.add("is-open");
    autoresPanel.scrollTop = 0;
    autoresSearch?.focus();
  }
});

toggleEstadoBtn?.addEventListener("click", function(){
  if (!estadoPanel) return;

  const willOpen = !estadoPanel.classList.contains("is-open");
  closeAllPanels();

  if (willOpen) estadoPanel.classList.add("is-open");
});

toggleIdiomaBtn?.addEventListener("click", function(){
  if (!idiomaPanel) return;

  const willOpen = !idiomaPanel.classList.contains("is-open");
  closeAllPanels();

  if (willOpen) idiomaPanel.classList.add("is-open");
});

categoriasSearch?.addEventListener("input", function(){
  renderCategoriasOptions(this.value);
});

autoresSearch?.addEventListener("input", function(){
  renderAutoresOptions(this.value);
});

document.addEventListener("click", function(e){
  const link = e.target.closest("a");
  if (link) {
    closeModalInstant();
    return;
  }

  if (!filterModal || !openFiltersBtn) return;
  if (!filterModal.contains(e.target) && !openFiltersBtn.contains(e.target)) return;

  if (toggleGenresBtn && genrePanel && !toggleGenresBtn.contains(e.target) && !genrePanel.contains(e.target)) {
    genrePanel.classList.remove("is-open");
    genrePanel.scrollTop = 0;
  }

  if (toggleCategoriasBtn && categoriasPanel && !toggleCategoriasBtn.contains(e.target) && !categoriasPanel.contains(e.target)) {
    categoriasPanel.classList.remove("is-open");
  }

  if (toggleAutoresBtn && autoresPanel && !toggleAutoresBtn.contains(e.target) && !autoresPanel.contains(e.target)) {
    autoresPanel.classList.remove("is-open");
  }

  if (toggleEstadoBtn && estadoPanel && !toggleEstadoBtn.contains(e.target) && !estadoPanel.contains(e.target)) {
    estadoPanel.classList.remove("is-open");
  }

  if (toggleIdiomaBtn && idiomaPanel && !toggleIdiomaBtn.contains(e.target) && !idiomaPanel.contains(e.target)) {
    idiomaPanel.classList.remove("is-open");
  }
});

document.addEventListener("change", function(e){
  if (e.target.matches('input[name="categoria"]')) {
    const value = e.target.value;

    if (e.target.checked) {
      if (!categoriasSeleccionadasActuales.includes(value)) {
        categoriasSeleccionadasActuales.push(value);
      }
    } else {
      categoriasSeleccionadasActuales = categoriasSeleccionadasActuales.filter(v => v !== value);
    }

    updateSummaries();
    return;
  }

  if (e.target.matches('input[name="autor"]')) {
    const value = e.target.value;

    if (e.target.checked) {
      if (!autoresSeleccionadosActuales.includes(value)) {
        autoresSeleccionadosActuales.push(value);
      }
    } else {
      autoresSeleccionadosActuales = autoresSeleccionadosActuales.filter(v => v !== value);
    }

    updateSummaries();
    return;
  }

  if (
    e.target.matches('input[name="genre"]') ||
    e.target.matches('input[name="estado"]') ||
    e.target.matches('input[name="idioma"]')
  ) {
    updateSummaries();
  }
});

resetFiltrosBtn?.addEventListener("click", function () {
  resetearFormularioVisual();

  const nuevosParams = new URLSearchParams();
  irConParams(nuevosParams);
});

filterForm?.addEventListener("submit", function(e){
  e.preventDefault();

  const nuevosParams = new URLSearchParams();

  const generosSeleccionados = [...document.querySelectorAll('input[name="genre"]:checked')]
    .map(input => input.value);
  generosSeleccionados.forEach(g => nuevosParams.append("genre", g));

  categoriasSeleccionadasActuales.forEach(c => nuevosParams.append("categoria", c));
  autoresSeleccionadosActuales.forEach(a => nuevosParams.append("autor", a));

  const estadoSeleccionado = document.querySelector('input[name="estado"]:checked')?.value || "";
  const idiomaSeleccionado = document.querySelector('input[name="idioma"]:checked')?.value || "";
  const nuevoSinCensura = document.getElementById("sinCensuraCheck")?.checked;

  if (estadoSeleccionado) nuevosParams.set("estado", estadoSeleccionado);
  if (idiomaSeleccionado) nuevosParams.set("idioma", idiomaSeleccionado);
  if (nuevoSinCensura) nuevosParams.set("sin_censura", "1");

  irConParams(nuevosParams);
});

if (search.trim()) {
  if (searchChip) searchChip.style.display = "flex";
  if (searchChipText) searchChipText.textContent = search;
} else {
  if (searchChip) searchChip.style.display = "none";
}

function buildQuery(pageNum){
  const params = new URLSearchParams();

  genres.forEach(g => params.append("genre", g));
  categorias.forEach(c => params.append("categoria", c));
  autores.forEach(a => params.append("autor", a));
  if (estado) params.set("estado", estado);
  if (idioma) params.set("idioma", idioma);
  if (sinCensura === "1") params.set("sin_censura", "1");
  if (pageNum > 1) params.set("page", pageNum);

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

  if (categorias.length > 0){
    filtrados = filtrados.filter(item => {
      if (!item.categoria) return false;
      const itemCategorias = item.categoria.toLowerCase().split(",").map(c => c.trim());
      return categorias.every(c => itemCategorias.includes(c.toLowerCase()));
    });
  }

  if (autores.length > 0){
    filtrados = filtrados.filter(item => {
      if (!item.autor) return false;
      const itemAutores = item.autor.toLowerCase().split(",").map(a => a.trim());
      return autores.every(a => itemAutores.includes(a.toLowerCase()));
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
    if (resultados) {
      resultados.innerHTML = `<div class="empty-state">No se encontraron resultados.</div>`;
    }
    return;
  }

  if (!resultados) return;

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

  if (!paginacion) return;

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
  renderCategoriasOptions();
  renderAutoresOptions();
  marcarFiltrosActuales();
  updateFilterCount();

  const data = await loadData();
  const filtrados = filtrarCatalogo(data);

  if (resultadoCantidad) {
    resultadoCantidad.textContent = filtrados.length;
  }

  const inicio = (page - 1) * porPagina;
  const fin = inicio + porPagina;
  const paginaItems = filtrados.slice(inicio, fin);

  renderCards(paginaItems);
  renderPagination(filtrados.length);
}

init();

function blindarInputBuscador(inputEl, uniqueName) {
  if (!inputEl) return;

  // Que no parezca campo de login / datos sensibles
  inputEl.type = "search";
  inputEl.name = uniqueName;
  inputEl.id = inputEl.id; // mantiene tu id actual
  inputEl.setAttribute("autocomplete", "new-password");
  inputEl.setAttribute("autocorrect", "off");
  inputEl.setAttribute("autocapitalize", "off");
  inputEl.setAttribute("spellcheck", "false");
  inputEl.setAttribute("inputmode", "search");
  inputEl.setAttribute("enterkeyhint", "search");

  // Truco anti-autofill
  inputEl.setAttribute("readonly", "readonly");

  const quitarReadonly = () => {
    inputEl.removeAttribute("readonly");
  };

  const ponerReadonly = () => {
    // cuando se cierra teclado / pierdes foco
    inputEl.setAttribute("readonly", "readonly");
  };

  inputEl.addEventListener("focus", () => {
    quitarReadonly();
    acomodarInputSobreTeclado(inputEl);
  });

  inputEl.addEventListener("click", () => {
    quitarReadonly();
    acomodarInputSobreTeclado(inputEl);
  });

  inputEl.addEventListener("touchstart", () => {
    quitarReadonly();
  }, { passive: true });

  inputEl.addEventListener("blur", () => {
    ponerReadonly();
  });
}

function acomodarInputSobreTeclado(inputEl) {
  if (!inputEl) return;

  setTimeout(() => {
    inputEl.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }, 180);
}

// Aplicarlo a los dos inputs
blindarInputBuscador(categoriasSearch, "catalogo_categoria_search");
blindarInputBuscador(autoresSearch, "catalogo_autor_search");

// Reacomodar si cambia el viewport al abrir/cerrar teclado
if (window.visualViewport) {
  const reacomodarSiActivo = () => {
    const active = document.activeElement;
    if (active === categoriasSearch || active === autoresSearch) {
      acomodarInputSobreTeclado(active);
    }
  };

  window.visualViewport.addEventListener("resize", reacomodarSiActivo);
  window.visualViewport.addEventListener("scroll", reacomodarSiActivo);
}

function bloquearEnter(inputEl) {
  if (!inputEl) return;

  inputEl.addEventListener("keydown", function(e){
    if (e.key === "Enter") {
      e.preventDefault();
    }
  });
}

// Aplicar
bloquearEnter(categoriasSearch);
bloquearEnter(autoresSearch);

function mejorarClearInput(inputEl) {
  if (!inputEl) return;

  // Oculta la X nativa (Chrome/Safari)
  const style = document.createElement("style");
  style.textContent = `
    input[type="search"]::-webkit-search-cancel-button {
      display: none;
    }
  `;
  document.head.appendChild(style);

  // Crear botón X custom
  const wrapper = document.createElement("div");
  wrapper.style.position = "relative";
  inputEl.parentNode.insertBefore(wrapper, inputEl);
  wrapper.appendChild(inputEl);

  const btn = document.createElement("button");
  btn.type = "button";
  btn.innerHTML = "✕";

  Object.assign(btn.style, {
    position: "absolute",
    right: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    border: "none",
    background: "transparent",
    color: "#bbb",
    fontSize: "14px",
    cursor: "pointer",
    display: "none"
  });

  wrapper.appendChild(btn);

  // Mostrar/ocultar
  inputEl.addEventListener("input", () => {
    btn.style.display = inputEl.value ? "block" : "none";
  });

  // Limpiar
  btn.addEventListener("click", () => {
    inputEl.value = "";
    inputEl.dispatchEvent(new Event("input"));
    inputEl.focus();
  });
}

// Aplicar
mejorarClearInput(categoriasSearch);
mejorarClearInput(autoresSearch);

btn.style.color = "#a78bfa";
btn.style.transition = "0.2s";

btn.addEventListener("mouseenter", () => {
  btn.style.color = "#fff";
});
btn.addEventListener("mouseleave", () => {
  btn.style.color = "#a78bfa";
});
