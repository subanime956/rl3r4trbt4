(function(){
  "use strict";
  const API = window.RTR_BIBLIO;
  if (!API) return;

  function getItemFromPage(){
    const el = document.querySelector("[data-rtr-item]");
    if (!el) return null;
    return API.normalizeItem({
      id: el.dataset.id,
      titulo: el.dataset.titulo,
      imagen: el.dataset.imagen,
      url: el.dataset.url,
      badge: el.dataset.badge
    });
  }

  function ensureModal(){
    let modal = document.getElementById("biblioSaveModal");
    if (modal) return modal;
    modal = document.createElement("div");
    modal.innerHTML = `
      <div class="biblio-modal-backdrop" id="biblioSaveBackdrop"></div>
      <div class="biblio-modal" id="biblioSaveModal" aria-hidden="true">
        <div class="biblio-modal-box biblio-save-modal-box">
          <div class="biblio-modal-head">
            <div><h2>Guardar</h2><p>Elige una sola sección. Si presionas la misma, se quita.</p></div>
            <button class="biblio-close" type="button" data-save-close>×</button>
          </div>
          <div class="biblio-modal-body">
            <div class="biblio-list-options" id="biblioSaveOptions"></div>
          </div>
        </div>
      </div>`;
    document.body.appendChild(modal);
    return document.getElementById("biblioSaveModal");
  }

  function openSaveModal(item, mainBtn){
    const modal = ensureModal();
    const backdrop = document.getElementById("biblioSaveBackdrop");
    const options = document.getElementById("biblioSaveOptions");
    const active = API.getItemCurrentList(item);
    options.innerHTML = API.LISTS.map(key => `
      <button type="button" class="biblio-list-option ${active === key ? "is-current" : ""}" data-save-choice="${key}">
        <i class="fa ${API.LIST_ICONS[key]}"></i>
        <span>${API.LIST_LABELS[key]}</span>
        ${active === key ? "<strong>ON</strong>" : ""}
      </button>`).join("");
    modal.classList.add("is-open");
    backdrop?.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");

    function close(){
      modal.classList.remove("is-open");
      backdrop?.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      document.removeEventListener("click", handler, true);
    }
    function handler(e){
      if (e.target.closest("[data-save-close]") || e.target === backdrop){ close(); return; }
      const choice = e.target.closest("[data-save-choice]");
      if (choice){
        API.setItemSingleList(item, choice.dataset.saveChoice);
        updateButton(item, mainBtn);
        close();
      }
    }
    setTimeout(() => document.addEventListener("click", handler, true), 0);
  }

  function updateButton(item, btn){
    const active = API.getItemCurrentList(item);
    if (!active){
      btn.classList.remove("is-active");
      btn.innerHTML = '<i class="fa fa-bookmark-o"></i> Guardar <i class="fa fa-angle-down"></i>';
      return;
    }
    btn.classList.add("is-active");
    btn.innerHTML = `<i class="fa ${API.LIST_ICONS[active]}"></i> ${API.LIST_LABELS[active]} <i class="fa fa-angle-down"></i>`;
  }

  document.addEventListener("DOMContentLoaded", () => {
    const item = getItemFromPage();
    const btn = document.querySelector("[data-biblio-open-save]");
    if (!item || !btn) return;
    updateButton(item, btn);
    btn.addEventListener("click", () => openSaveModal(item, btn));
  });
})();
