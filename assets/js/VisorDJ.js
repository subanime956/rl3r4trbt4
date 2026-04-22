let currentPage = 0;

const viewer = document.getElementById("imageViewer");
const imgElement = document.getElementById("comic-image");
const pageInfoElement = document.getElementById("page-info");
const pageInputElement = document.getElementById("page-input");
const loadingPlaceholder = document.getElementById("loadingPlaceholder");
const fullscreenBtn = document.getElementById("fullscreen-btn");
const prevButton = document.getElementById("prev-page");
const nextButton = document.getElementById("next-page");
const firstButton = document.getElementById("first-page");
const lastButton = document.getElementById("last-page");
const leftZone = document.querySelector(".left-zone");
const rightZone = document.querySelector(".right-zone");
const imageContainer = document.getElementById("imageContainer");

const openInstructionsBtn = document.getElementById("openInstructions");
const instructionsModal = document.getElementById("instructionsModal");
const closeInstructionsBtn = document.getElementById("closeInstructions");
const instructionsBackdrop = document.getElementById("instructionsBackdrop");
const mobileFullscreenToast = document.getElementById("mobileFullscreenToast");

let mobileToastTimer = null;

const pageNodes = Array.from(document.querySelectorAll(".image-list img"));
const images = pageNodes
  .map((img) => img.dataset.src || img.getAttribute("src"))
  .filter(Boolean);

const imageCache = new Map();
const loadingPromises = new Map();

let renderToken = 0;

/* ===== PRECARGA CONTINUA EN BLOQUES ===== */
const PRELOAD_BATCH_SIZE = 9999;
let backgroundPreloadIndex = 0;
let isBackgroundPreloading = false;

function updateInputMax() {
  if (!pageInputElement) return;
  pageInputElement.max = images.length || 1;
}

function isIndexValid(index) {
  return index >= 0 && index < images.length;
}

function showLoading() {
  if (!loadingPlaceholder) return;
  loadingPlaceholder.style.display = "flex";
}

function hideLoading() {
  if (!loadingPlaceholder) return;
  loadingPlaceholder.style.display = "none";
}

function loadImage(index) {
  if (!isIndexValid(index)) {
    return Promise.reject(new Error("Índice inválido"));
  }

  if (imageCache.has(index)) {
    return Promise.resolve(imageCache.get(index));
  }

  if (loadingPromises.has(index)) {
    return loadingPromises.get(index);
  }

  const promise = new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";

    img.onload = () => {
      imageCache.set(index, img);
      loadingPromises.delete(index);
      resolve(img);
    };

    img.onerror = () => {
      loadingPromises.delete(index);
      reject(new Error(`Error cargando imagen ${index + 1}`));
    };

    img.src = images[index];
  });

  loadingPromises.set(index, promise);
  return promise;
}

async function preloadBatch(startIndex, batchSize = PRELOAD_BATCH_SIZE) {
  const tasks = [];

  for (let i = startIndex; i < startIndex + batchSize && i < images.length; i++) {
    if (!imageCache.has(i) && !loadingPromises.has(i)) {
      tasks.push(loadImage(i).catch(() => null));
    }
  }

  await Promise.all(tasks);
}

async function startContinuousPreload() {
  if (isBackgroundPreloading) return;
  isBackgroundPreloading = true;

  while (backgroundPreloadIndex < images.length) {
    await preloadBatch(backgroundPreloadIndex, PRELOAD_BATCH_SIZE);
    backgroundPreloadIndex += PRELOAD_BATCH_SIZE;

    await new Promise((resolve) => setTimeout(resolve, 80));
  }

  isBackgroundPreloading = false;
}

function preloadNearCurrent(index) {
  const near = [];

  for (let i = 1; i <= 5; i++) {
    const next = index + i;
    if (isIndexValid(next)) near.push(next);
  }

  for (let i = 1; i <= 2; i++) {
    const prev = index - i;
    if (isIndexValid(prev)) near.push(prev);
  }

  near.forEach((i) => {
    loadImage(i).catch(() => {});
  });
}

async function renderPage(index) {
  if (!isIndexValid(index)) return;

  currentPage = index;
  renderToken += 1;
  const myToken = renderToken;

  if (pageInfoElement) {
    pageInfoElement.textContent = `${currentPage + 1} de ${images.length}`;
  }

  if (pageInputElement) {
    pageInputElement.value = currentPage + 1;
  }

  updateInputMax();

  const altText = `Página ${currentPage + 1}`;

  imgElement.onload = null;
  imgElement.onerror = null;

  if (imageCache.has(index)) {
    imgElement.src = imageCache.get(index).src;
    imgElement.alt = altText;
    hideLoading();
    preloadNearCurrent(index);
    return;
  }

  showLoading();
  imgElement.alt = altText;

  /* BORRA la imagen anterior de verdad */
  imgElement.removeAttribute("src");

  /* fuerza repintado para que el navegador suelte la anterior */
  void imgElement.offsetHeight;

  imgElement.onload = () => {
    if (myToken !== renderToken) return;
    hideLoading();
    preloadNearCurrent(index);
  };

  imgElement.onerror = () => {
    if (myToken !== renderToken) return;
    showLoading();
  };

  /* pon la nueva en el siguiente frame */
  requestAnimationFrame(() => {
    if (myToken !== renderToken) return;
    imgElement.src = images[index];
  });
}

function goToPage(index) {
  if (!isIndexValid(index)) return;
  renderPage(index);
}

function isMobileView() {
  return window.innerWidth <= 768;
}

function openInstructionsModal() {
  if (!instructionsModal) return;
  instructionsModal.classList.add("is-open");
  instructionsModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeInstructionsModal() {
  if (!instructionsModal) return;
  instructionsModal.classList.remove("is-open");
  instructionsModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function showMobileFullscreenToast() {
  if (!mobileFullscreenToast) return;

  mobileFullscreenToast.classList.add("is-show");

  clearTimeout(mobileToastTimer);
  mobileToastTimer = setTimeout(() => {
    mobileFullscreenToast.classList.remove("is-show");
  }, 1800);
}

function scrollViewerBy(amount) {
  if (document.fullscreenElement && imageContainer) {
    imageContainer.scrollBy({
      top: amount,
      behavior: "smooth"
    });
  } else {
    window.scrollBy({
      top: amount,
      behavior: "smooth"
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  updateInputMax();

  if (!images.length) {
    if (pageInfoElement) pageInfoElement.textContent = "0 de 0";
    if (pageInputElement) pageInputElement.value = "";
    if (imgElement) imgElement.removeAttribute("src");
    hideLoading();
    return;
  }

  renderPage(0);
  startContinuousPreload();
});

if (openInstructionsBtn) {
  openInstructionsBtn.addEventListener("click", openInstructionsModal);
}

if (closeInstructionsBtn) {
  closeInstructionsBtn.addEventListener("click", closeInstructionsModal);
}

if (instructionsBackdrop) {
  instructionsBackdrop.addEventListener("click", closeInstructionsModal);
}

document.addEventListener("keydown", (event) => {
  const tag = event.target.tagName;
  const typing =
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    event.target.isContentEditable;

  if (
    event.key === "Escape" &&
    instructionsModal &&
    instructionsModal.classList.contains("is-open")
  ) {
    closeInstructionsModal();
    return;
  }

  if (typing) return;

  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
    event.preventDefault();
    goToPage(currentPage - 1);
    return;
  }

  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
    event.preventDefault();
    goToPage(currentPage + 1);
    return;
  }

  if (event.key.toLowerCase() === "w") {
    event.preventDefault();
    scrollViewerBy(-220);
    return;
  }

  if (event.key.toLowerCase() === "s") {
    event.preventDefault();
    scrollViewerBy(220);
    return;
  }

  if (event.key.toLowerCase() === "f") {
    event.preventDefault();

    if (document.fullscreenElement) {
      viewer.classList.toggle("fs-zoom");
    } else {
      viewer.classList.toggle("reader-wide");
    }

    return;
  }
});

document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement && viewer) {
    viewer.classList.remove("fs-zoom");
  }
});

if (nextButton) {
  nextButton.addEventListener("click", () => {
    goToPage(currentPage + 1);
  });
}

if (prevButton) {
  prevButton.addEventListener("click", () => {
    goToPage(currentPage - 1);
  });
}

if (firstButton) {
  firstButton.addEventListener("click", () => {
    goToPage(0);
  });
}

if (lastButton) {
  lastButton.addEventListener("click", () => {
    goToPage(images.length - 1);
  });
}

if (leftZone) {
  leftZone.addEventListener("click", () => {
    goToPage(currentPage - 1);
  });
}

if (rightZone) {
  rightZone.addEventListener("click", () => {
    goToPage(currentPage + 1);
  });
}

if (pageInputElement) {
  pageInputElement.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      const newPage = parseInt(pageInputElement.value, 10) - 1;

      if (!Number.isNaN(newPage) && isIndexValid(newPage)) {
        goToPage(newPage);
      } else {
        pageInputElement.value = images.length ? currentPage + 1 : "";
      }
    }
  });
}

if (fullscreenBtn) {
  fullscreenBtn.addEventListener("click", () => {
    if (isMobileView()) {
      showMobileFullscreenToast();
      return;
    }

    if (!document.fullscreenElement) {
      viewer.requestFullscreen().catch((err) => {
        console.log("Error al activar pantalla completa:", err);
      });
    } else {
      document.exitFullscreen();
    }
  });
}











  function RTR_openDownloads(){
    const list = document.getElementById("dlList");
     list.innerHTML = "";

 

    downloads.forEach(d => {
      const li = document.createElement("li");
      li.className = "rtr-item";

      const left = document.createElement("div");
      left.className = "rtr-name";
      left.textContent = d.name;

      const right = document.createElement("div");
      right.style.display = "flex";
      right.style.alignItems = "center";
      right.style.gap = "10px";

      const tag = document.createElement("span");
      tag.className = "rtr-tag" + (d.tag === "PREMIUM" ? " premium" : "");
      tag.textContent = d.tag === "PREMIUM" ? "PREMIUM" : "ESP";

      const a = document.createElement("a");
      a.className = "rtr-btn";
      a.href = d.href;
      a.target = "_blank";
      a.rel = "noopener";
      a.innerHTML = `
        <svg class="rtr-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 3v10m0 0 4-4m-4 4-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        Descargar
      `;
      right.appendChild(tag);
      right.appendChild(a);

      li.appendChild(left);
      li.appendChild(right);
      list.appendChild(li);
    });

    document.getElementById("rtrOverlay").classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function RTR_closeDownloads(){
    document.getElementById("rtrOverlay").classList.remove("active");
    document.body.style.overflow = "";
  }

  document.addEventListener("keydown", function(ev){
    if(ev.key === "Escape"){
      const ov = document.getElementById("rtrOverlay");
      if(ov.classList.contains("active")) RTR_closeDownloads();
    }
  });

function copyToClipboard(element) {
    const text = element.textContent;

    const tempInput = document.createElement("textarea");
    tempInput.value = text;

    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand("copy");
    document.body.removeChild(tempInput);

    alert("Contraseña copiada: " + text);
}
