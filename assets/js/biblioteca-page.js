(function(){
  "use strict";
  const API = window.RTR_BIBLIO;
  if (!API) return;

  const PER_PAGE = 20;
  const $ = (sel) => document.querySelector(sel);
  const resultados = $("#resultados");
  const paginacion = $("#paginacion");
  const cantidad = $("#resultadoCantidad");
  const title = $("#biblioTitle");
  const subtitle = $("#biblioSubtitle");
  const listLabel = $("#biblioCurrentListText");
  const modal = $("#biblioModal");
  const modalBackdrop = $("#biblioModalBackdrop");
  const importModal = $("#biblioImportModal");
  const exportModal = $("#biblioExportModal");
  const nameModal = $("#biblioNameModal");
  const settingsModal = $("#biblioSettingsModal");
  const nameInput = $("#biblioNameInput");

  function params(){ return new URLSearchParams(location.search); }
  function getPage(){ return Math.max(1, parseInt(params().get("page") || "1", 10) || 1); }

  function resetWhenEnteringFromOutside(){
    let navType = "navigate";
    try { navType = (performance.getEntriesByType("navigation")[0] || {}).type || "navigate"; } catch(_){}
    if (navType !== "navigate") return;

    let samePageRef = false;
    try {
      if (document.referrer){
        const ref = new URL(document.referrer);
        samePageRef = ref.origin === location.origin && ref.pathname === location.pathname;
      }
    } catch(_){}

    if (!samePageRef){
      const state = API.getState();
      state.ui.currentView = "personal:favorito";
      API.saveState(state);
      const next = new URLSearchParams();
      next.set("view", "personal:favorito");
      next.set("page", "1");
      history.replaceState(null, "", `${location.pathname}?${next.toString()}`);
    }
  }

  function getView(){
    const q = params().get("view");
    const state = API.getState();
    return q || state.ui.currentView || "personal:favorito";
  }
  function setView(view){
    const state = API.getState();
    state.ui.currentView = view;
    API.saveState(state);
    const next = new URLSearchParams();
    next.set("view", view);
    next.set("page", "1");
    history.pushState(null, "", `${location.pathname}?${next.toString()}`);
    render();
  }
  function setPage(page){
    const next=params();
    next.set("page", String(page));
    if(!next.get("view")) next.set("view", getView());
    history.pushState(null,"",`${location.pathname}?${next.toString()}`);
    render();
  }

  function openModal(el){
    if(!el) return;
    el.classList.add("is-open");
    modalBackdrop?.classList.add("is-open");
    el.setAttribute("aria-hidden","false");
  }
  function closeModals(){
    [modal,importModal,exportModal,nameModal,settingsModal].forEach(el=>{
      if(!el)return;
      el.classList.remove("is-open");
      el.setAttribute("aria-hidden","true");
    });
    modalBackdrop?.classList.remove("is-open");
  }

  function viewInfo(view){
    const parts = String(view || "personal:favorito").split(":");
    const state = API.getState();

    if (parts[0] === "shared"){
      const ownerId = parts[1];
      const list = parts[2] || "favorito";
      const shared = state.shared[ownerId];
      return {
        scope:"shared",
        ownerId,
        ownerName: shared ? API.getSharedDisplayName(shared) : "Usuario compartido",
        list,
        title: API.LIST_LABELS[list] || "Favoritos",
        items: shared && shared.sections ? (shared.sections[list] || []) : []
      };
    }

    const list = parts[1] || "favorito";
    return {
      scope:"personal",
      list,
      title:API.LIST_LABELS[list] || "Favoritos",
      items:state.personal[list] || []
    };
  }

  function renderCard(item, context){
    const safeId = API.escapeHtml(item.id || item.url);
    return `
      <div class="biblio-card-shell">
        <button class="biblio-card-remove" type="button" title="Eliminar" aria-label="Eliminar" data-remove-scope="${context.scope}" data-remove-list="${context.list}" data-remove-owner="${context.ownerId || ""}" data-remove-id="${safeId}"><i class="fa fa-trash"></i></button>
        <a class="card" href="${API.escapeHtml(item.url)}">
          <div class="card-thumb">
            ${item.badge ? `<div class="card-badge-wrap"><div class="card-badge">${API.escapeHtml(item.badge)}</div></div>` : ""}
            <img src="${API.escapeHtml(item.imagen)}" alt="${API.escapeHtml(item.titulo)}" loading="lazy">
          </div>
          <div class="card-content"><h3>${API.escapeHtml(item.titulo)}</h3></div>
        </a>
      </div>`;
  }

  function renderEmpty(){
    resultados.className = "biblio-empty-container";
    resultados.innerHTML = `<div class="biblio-empty"><div class="biblio-empty-icon"><i class="fa fa-bookmark-o"></i></div><h2>No hay guardados aquí</h2><p>Guarda portadas desde una página usando el botón <strong>Guardar</strong>.</p></div>`;
    if(paginacion) paginacion.innerHTML = "";
  }

  function renderPagination(total,current){
    if(!paginacion) return;
    const totalPages=Math.ceil(total/PER_PAGE);
    if(totalPages<=1){paginacion.innerHTML="";return;}
    let html="";
    const maxVisible=5;
    if(current>1) html+=`<a href="#" data-page="${current-1}">«</a>`;
    let start=Math.max(1,current-Math.floor(maxVisible/2));
    let end=start+maxVisible-1;
    if(end>totalPages){end=totalPages; start=Math.max(1,end-maxVisible+1);}
    if(start>1){html+=`<a href="#" data-page="1">1</a>`; if(start>2) html+=`<span>...</span>`;}
    for(let i=start;i<=end;i++) html+= i===current ? `<a href="#" data-page="${i}" class="active">${i}</a>` : `<a href="#" data-page="${i}">${i}</a>`;
    if(end<totalPages){ if(end<totalPages-1) html+=`<span>...</span>`; html+=`<a href="#" data-page="${totalPages}">${totalPages}</a>`; }
    if(current<totalPages) html+=`<a href="#" data-page="${current+1}">»</a>`;
    paginacion.innerHTML=html;
  }

  function firstSharedView(ownerId, lib){
    const keys=(lib.sectionKeys||[]).filter(k=>API.LISTS.includes(k));
    return keys.length ? `shared:${ownerId}:${keys[0]}` : `shared:${ownerId}:favorito`;
  }

  function renderPicker(){
    const state=API.getState();
    const current=getView();
    const personalWrap=$("#biblioPersonalOptions");
    const sharedWrap=$("#biblioSharedOptions");

    if(personalWrap){
      personalWrap.innerHTML = API.LISTS.map(key=>{
        const count=(state.personal[key]||[]).length;
        const view=`personal:${key}`;
        return `<button type="button" class="biblio-list-option ${current===view?"is-current":""}" data-view="${view}"><i class="fa ${API.LIST_ICONS[key]}"></i><span>${API.LIST_LABELS[key]}</span><strong>${count}</strong></button>`;
      }).join("");
    }

    if(sharedWrap){
      const sharedIds=Object.keys(state.shared||{});
      if(!sharedIds.length){
        sharedWrap.innerHTML=`<div class="biblio-shared-empty">Todavía no importaste listas compartidas.</div>`;
      } else {
        sharedWrap.innerHTML = sharedIds.map(ownerId=>{
          const lib=state.shared[ownerId];
          const keys=(lib.sectionKeys||API.LISTS).filter(k=>API.LISTS.includes(k));
          const isInside=current.startsWith(`shared:${ownerId}:`);
          return `<details class="biblio-shared-group" ${isInside?"open":""}>
            <summary><span><i class="fa fa-user-circle"></i> ${API.escapeHtml(API.getSharedDisplayName(lib))}</span><div class="biblio-shared-actions"><button type="button" class="biblio-mini-edit" data-edit-shared="${API.escapeHtml(ownerId)}" title="Editar apodo" aria-label="Editar apodo"><i class="fa fa-pencil"></i></button><button type="button" class="biblio-mini-danger" data-delete-shared="${API.escapeHtml(ownerId)}" title="Eliminar compartido" aria-label="Eliminar compartido"><i class="fa fa-trash"></i></button></div></summary>
            <div class="biblio-shared-lists">
              ${keys.map(key=>{
                const view=`shared:${ownerId}:${key}`;
                const count=((lib.sections||{})[key]||[]).length;
                return `<button type="button" class="biblio-list-option ${current===view?"is-current":""}" data-view="${API.escapeHtml(view)}"><i class="fa ${API.LIST_ICONS[key]}"></i><span>${API.LIST_LABELS[key]}</span><strong>${count}</strong></button>`;
              }).join("")}
            </div>
          </details>`;
        }).join("");
      }
    }
  }

  function render(){
    const state=API.getState();
    const user=state.userName || "Usuario";
    const info=viewInfo(getView());
    const page=getPage();
    const total=info.items.length;
    const totalPages=Math.max(1,Math.ceil(total/PER_PAGE));
    const fixedPage=Math.min(page,totalPages);
    if(fixedPage!==page){ setPage(fixedPage); return; }

    if(info.scope === "shared"){
      if(title) title.textContent=`Biblioteca de ${info.ownerName}`;
      if(subtitle) subtitle.innerHTML=`<i class="fa fa-users"></i> Biblioteca compartida de guardados`;
      if(listLabel) listLabel.textContent=API.LIST_LABELS[info.list] || "Favoritos";
    } else {
      if(title) title.textContent=`Favoritos de ${user}`;
      if(subtitle) subtitle.innerHTML=`<i class="fa fa-bookmark"></i> Biblioteca local de guardados`;
      if(listLabel) listLabel.textContent=API.LIST_LABELS[info.list] || "Favoritos";
    }

    if(cantidad) cantidad.textContent=String(total);
    renderPicker();

    if(!total){ renderEmpty(); return; }

    resultados.className="container";
    const start=(fixedPage-1)*PER_PAGE;
    resultados.innerHTML=info.items.slice(start,start+PER_PAGE).map(item=>renderCard(item,info)).join("");
    renderPagination(total,fixedPage);
  }

  function maybeAskName(){
    const state=API.getState();
    if(!state.userName){ nameInput.value=""; openModal(nameModal); }
  }

  function setupImport(){
    const fileInput=$("#biblioImportFile");
    const preview=$("#biblioImportPreview");
    const choices=$("#biblioImportChoices");
    const conflict=$("#biblioImportConflict");
    const conflictText=$("#biblioImportConflictText");
    let parsed=null;
    let pendingOwnerName="";

    function resetImportUI(){
      parsed=null;
      pendingOwnerName="";
      if(fileInput) fileInput.value="";
      if(preview) preview.innerHTML=`<span class="biblio-muted">Primero selecciona tu archivo .json.</span>`;
      choices?.classList.remove("is-ready");
      conflict?.classList.remove("is-open");
      if(conflictText) conflictText.innerHTML="";
    }

    function renderAliasStep(ownerName, isDuplicate){
      const intro = isDuplicate
        ? `Ya tienes un compartido llamado <strong>${API.escapeHtml(ownerName)}</strong>. Para guardarlo como otro compartido separado, ponle un apodo.`
        : `Vas a guardar la biblioteca de <strong>${API.escapeHtml(ownerName)}</strong>. Puedes ponerle un apodo opcional.`;
      if(conflictText){
        conflictText.innerHTML = `
          <div class="biblio-conflict-title">Nuevo compartido</div>
          <p>${intro}</p>
          <label class="biblio-small-label" for="biblioSharedAliasInput">Apodo ${isDuplicate ? '<span>(obligatorio)</span>' : '<span>(opcional)</span>'}</label>
          <input class="biblio-input" id="biblioSharedAliasInput" type="text" maxlength="30" placeholder="Ejemplo: Celular, Backup viejo, Amigo" data-alias-required="${isDuplicate ? '1' : '0'}">
          <div class="biblio-inline-error" id="biblioAliasError" aria-live="polite"></div>
          <div class="biblio-conflict-actions biblio-conflict-actions-row">
            <button class="biblio-btn biblio-btn-primary" type="button" data-import-action="save-new-shared"><i class="fa fa-plus"></i> Guardar compartido</button>
            <button class="biblio-btn biblio-btn-soft" type="button" data-import-action="back-main"><i class="fa fa-arrow-left"></i> Volver</button>
          </div>`;
      }
      conflict?.classList.add("is-open");
      setTimeout(()=>document.getElementById("biblioSharedAliasInput")?.focus(), 0);
    }

    function renderDuplicateStep(ownerName){
      if(conflictText){
        conflictText.innerHTML = `
          <div class="biblio-conflict-title">El usuario ${API.escapeHtml(ownerName)} ya existe</div>
          <p>¿Quieres integrar esta lista a un compartido existente o guardarla como nuevo compartido?</p>
          <div class="biblio-conflict-actions">
            <button class="biblio-btn biblio-btn-primary" type="button" data-import-action="choose-existing"><i class="fa fa-compress"></i> Integrar a existente</button>
            <button class="biblio-btn biblio-btn-soft" type="button" data-import-action="new-with-alias"><i class="fa fa-plus"></i> Guardar como nuevo</button>
            <button class="biblio-btn biblio-btn-ghost" type="button" data-import-action="cancel-conflict">Cancelar</button>
          </div>`;
      }
      conflict?.classList.add("is-open");
    }

    function renderChooseExisting(ownerName){
      const ids=API.findSharedLibrariesByOwnerName(ownerName);
      const state=API.getState();
      if(conflictText){
        conflictText.innerHTML = `
          <div class="biblio-conflict-title">Elige dónde integrar</div>
          <p>Selecciona a cuál biblioteca de <strong>${API.escapeHtml(ownerName)}</strong> quieres agregarle las nuevas portadas.</p>
          <div class="biblio-existing-list">
            ${ids.map(id=>{
              const lib=state.shared[id];
              return `<button class="biblio-list-option" type="button" data-import-action="merge-existing" data-owner-id="${API.escapeHtml(id)}"><i class="fa fa-user-circle"></i><span>${API.escapeHtml(API.getSharedDisplayName(lib))}</span><strong>+</strong></button>`;
            }).join("")}
          </div>
          <div class="biblio-conflict-actions biblio-conflict-actions-row">
            <button class="biblio-btn biblio-btn-soft" type="button" data-import-action="back-duplicate"><i class="fa fa-arrow-left"></i> Volver</button>
          </div>`;
      }
      conflict?.classList.add("is-open");
    }

    $("#biblioOpenImport")?.addEventListener("click",()=>{
      resetImportUI();
      closeModals();
      openModal(importModal);
    });

    fileInput?.addEventListener("change", async()=>{
      try{
        parsed=await API.readJsonFile(fileInput.files[0]);
        pendingOwnerName="";
        conflict?.classList.remove("is-open");
        if(conflictText) conflictText.innerHTML="";
        const name=parsed.ownerName||parsed.userName||"Sin nombre";
        const type=parsed.type||"desconocido";
        const source=parsed.sections||parsed.personal||{};
        const total=API.LISTS.reduce((sum,k)=>sum+((source[k]||[]).length),0);
        preview.innerHTML=`<strong>Archivo cargado:</strong> ${API.escapeHtml(fileInput.files[0].name)}<br><span>${API.escapeHtml(name)} · ${API.escapeHtml(type)} · ${total} portadas</span>`;
        choices?.classList.add("is-ready");
      } catch(err){
        parsed=null;
        preview.innerHTML=`<span class="biblio-error">${API.escapeHtml(err.message)}</span>`;
        choices?.classList.remove("is-ready");
        conflict?.classList.remove("is-open");
      }
    });

    $("#biblioImportOwn")?.addEventListener("click",()=>{
      if(!parsed)return;
      API.importOwnBackup(parsed);
      closeModals();
      render();
    });

    $("#biblioImportShared")?.addEventListener("click",()=>{
      if(!parsed)return;
      pendingOwnerName=String(parsed.ownerName || parsed.userName || parsed.name || "Usuario compartido").trim() || "Usuario compartido";
      const existing=API.findSharedLibrariesByOwnerName(pendingOwnerName);
      if(existing.length){ renderDuplicateStep(pendingOwnerName); return; }
      renderAliasStep(pendingOwnerName, false);
    });

    conflict?.addEventListener("click",(e)=>{
      const btn=e.target.closest("[data-import-action]");
      if(!btn || !parsed) return;
      const action=btn.dataset.importAction;
      if(action==="cancel-conflict"){
        conflict.classList.remove("is-open");
        if(conflictText) conflictText.innerHTML="";
      }
      if(action==="choose-existing") renderChooseExisting(pendingOwnerName);
      if(action==="new-with-alias") renderAliasStep(pendingOwnerName, true);
      if(action==="back-duplicate") renderDuplicateStep(pendingOwnerName);
      if(action==="back-main"){
        const existing=API.findSharedLibrariesByOwnerName(pendingOwnerName);
        if(existing.length) renderDuplicateStep(pendingOwnerName);
        else conflict.classList.remove("is-open");
      }
      if(action==="save-new-shared"){
        const input=document.getElementById("biblioSharedAliasInput");
        const alias=input?.value.trim() || "";
        const required=input?.dataset.aliasRequired === "1";
        const error=document.getElementById("biblioAliasError");
        if(required && !alias){
          if(error) error.textContent="Pon un apodo para diferenciar este compartido.";
          input?.focus();
          return;
        }
        const ownerId=API.addSharedLibrary(parsed, alias);
        const lib=API.getState().shared[ownerId];
        closeModals();
        setView(firstSharedView(ownerId, lib));
      }
      if(action==="merge-existing"){
        const ownerId=btn.dataset.ownerId;
        const mergedId=API.mergeSharedLibrary(ownerId, parsed);
        const lib=API.getState().shared[mergedId];
        closeModals();
        setView(firstSharedView(mergedId, lib));
      }
    });
  }
  function setupExport(){
    const checksWrap=$("#biblioExportChecks");
    const friendPanel=$("#biblioFriendPanel");
    if(checksWrap){
      checksWrap.innerHTML=API.LISTS.map(key=>`<label class="biblio-check"><input type="checkbox" value="${key}"><span>${API.LIST_LABELS[key]}</span></label>`).join("");
    }
    $("#biblioOpenExport")?.addEventListener("click",()=>{
      friendPanel?.classList.remove("is-open");
      document.querySelectorAll("#biblioExportChecks input").forEach(i=>i.checked=false);
      const msg=$("#biblioExportMsg"); if(msg) msg.textContent="";
      closeModals();
      openModal(exportModal);
    });
    $("#biblioExportBackup")?.addEventListener("click",()=>{
      const user=API.getUserName()||"Usuario";
      API.downloadJson(API.exportBackupPayload(), API.backupFileName(user));
    });
    $("#biblioShowFriendExport")?.addEventListener("click",()=>{ friendPanel?.classList.add("is-open"); });
    $("#biblioExportFriend")?.addEventListener("click",()=>{
      const selected=[...document.querySelectorAll("#biblioExportChecks input:checked")].map(i=>i.value);
      if(!selected.length){
        const msg=$("#biblioExportMsg");
        if(msg) msg.textContent="Elige al menos una sección para compartir.";
        return;
      }
      const user=API.getUserName()||"Usuario";
      API.downloadJson(API.exportFriendPayload(selected), `${user} catalogo fv para amigos`);
    });
  }

  document.addEventListener("DOMContentLoaded",()=>{
    resetWhenEnteringFromOutside();

    $("#biblioOpenList")?.addEventListener("click",()=>openModal(modal));
    $("#biblioOpenSettings")?.addEventListener("click",()=>openModal(settingsModal));
    $("#biblioChangeName")?.addEventListener("click",()=>{ closeModals(); nameInput.value=API.getUserName()||""; openModal(nameModal); });
    $("#biblioClearAll")?.addEventListener("click",()=>{ if(confirm("¿Vaciar todas tus listas personales? Los compartidos no se borran.")){ API.clearPersonalLibrary(); closeModals(); setView("personal:favorito"); } });

    document.addEventListener("click",(e)=>{
      if(e.target.closest("[data-biblio-close]") || e.target===modalBackdrop) closeModals();

      const viewBtn=e.target.closest("[data-view]");
      if(viewBtn){ closeModals(); setView(viewBtn.dataset.view); }

      const pageBtn=e.target.closest("#paginacion [data-page]");
      if(pageBtn){ e.preventDefault(); setPage(parseInt(pageBtn.dataset.page,10)); }

      const removeBtn=e.target.closest("[data-remove-id]");
      if(removeBtn){
        API.removeItemFromList(removeBtn.dataset.removeScope, removeBtn.dataset.removeList, removeBtn.dataset.removeId, removeBtn.dataset.removeOwner);
        render();
      }

      const editShared=e.target.closest("[data-edit-shared]");
      if(editShared){
        e.preventDefault();
        e.stopPropagation();
        const ownerId=editShared.dataset.editShared;
        const lib=API.getState().shared[ownerId];
        if(!lib) return;
        const ownerName=String(lib.ownerName || "Usuario compartido");
        const alias=prompt(`Apodo para ${ownerName}:`, String(lib.alias || ""));
        if(alias === null) return;
        API.updateSharedAlias(ownerId, alias);
        render();
        return;
      }

      const deleteShared=e.target.closest("[data-delete-shared]");
      if(deleteShared){
        e.preventDefault();
        e.stopPropagation();
        API.removeSharedOwner(deleteShared.dataset.deleteShared);
        setView("personal:favorito");
      }
    });

    $("#biblioSaveName")?.addEventListener("click",()=>{ API.setUserName(nameInput.value||"Usuario"); closeModals(); render(); });
    nameInput?.addEventListener("keydown",e=>{ if(e.key==="Enter") $("#biblioSaveName")?.click(); });

    setupImport();
    setupExport();
    window.addEventListener("popstate",render);
    render();
    maybeAskName();
  });
})();
