(function(){
  "use strict";

  const STORAGE_KEY = "rtrBibliotecaV9";
  const LISTS = ["favorito", "pendiente", "completado", "descartado"];
  const LIST_LABELS = { favorito:"Favoritos", pendiente:"Pendiente", completado:"Completado", descartado:"Descartado" };
  const LIST_ICONS = { favorito:"fa-star", pendiente:"fa-clock-o", completado:"fa-check-circle", descartado:"fa-trash" };

  window.RTR_BIBLIO = {
    STORAGE_KEY, LISTS, LIST_LABELS, LIST_ICONS,
    getState, saveState, normalizeItem, mergeItems, escapeHtml, downloadJson, readJsonFile,
    getUserName, setUserName, getPersonalList, setPersonalList, getItemCurrentList, setItemSingleList,
    removeItemFromList, clearPersonalLibrary, removeSharedOwner, updateSharedAlias,
    findSharedByOwnerName, findSharedLibrariesByOwnerName, getSharedDisplayName,
    addSharedLibrary, mergeSharedLibrary, importOwnBackup,
    exportBackupPayload, exportFriendPayload, backupFileName
  };

  function baseState(){ return { version:9, userName:"", personal:Object.fromEntries(LISTS.map(k=>[k,[]])), shared:{}, ui:{ currentView:"personal:favorito" } }; }

  function getState(){
    let state = null;
    try { state = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); } catch(_){ state = null; }
    if (!state){
      try {
        const old = JSON.parse(localStorage.getItem("rtrBibliotecaV8") || localStorage.getItem("rtrBibliotecaV7") || "null");
        if (old && typeof old === "object") state = old;
      } catch(_){}
    }
    if (!state || typeof state !== "object") state = baseState();
    state.version = 9;
    state.personal = state.personal && typeof state.personal === "object" ? state.personal : {};
    LISTS.forEach(k => state.personal[k] = Array.isArray(state.personal[k]) ? state.personal[k].map(normalizeItem).filter(Boolean) : []);
    state.shared = state.shared && typeof state.shared === "object" ? state.shared : {};
    Object.keys(state.shared).forEach(id => {
      const lib = state.shared[id] || {};
      lib.ownerName = String(lib.ownerName || lib.name || "Usuario compartido").trim() || "Usuario compartido";
      lib.alias = String(lib.alias || "").trim();
      lib.sections = lib.sections && typeof lib.sections === "object" ? lib.sections : {};
      if (!Array.isArray(lib.sectionKeys)){
        lib.sectionKeys = LISTS.filter(k => Array.isArray(lib.sections[k]) && lib.sections[k].length);
        if (!lib.sectionKeys.length) lib.sectionKeys = LISTS.filter(k => Object.prototype.hasOwnProperty.call(lib.sections, k));
      }
      lib.sectionKeys.forEach(k => lib.sections[k] = Array.isArray(lib.sections[k]) ? lib.sections[k].map(normalizeItem).filter(Boolean) : []);
      state.shared[id] = lib;
    });
    state.ui = state.ui && typeof state.ui === "object" ? state.ui : { currentView:"personal:favorito" };
    saveState(state);
    return state;
  }

  function saveState(state){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

  function normalizeItem(raw){
    if (!raw || typeof raw !== "object") return null;
    const id = String(raw.id || raw.slug || raw.url || raw.link || "").trim();
    const titulo = String(raw.titulo || raw.title || raw.nombre || "Sin título").trim();
    const imagen = String(raw.imagen || raw.img || raw.image || "").trim();
    const url = String(raw.url || raw.link || raw.href || "#").trim();
    const badge = String(raw.badge || raw.tipo || raw.label || "").trim();
    if (!id && !url) return null;
    return { id:id || url, titulo, imagen, url, badge };
  }
  function itemKey(item){ const clean = normalizeItem(item); return clean ? String(clean.id || clean.url).toLowerCase() : ""; }
  function mergeItems(base, incoming){
    const map = new Map();
    (base || []).forEach(i => { const c = normalizeItem(i); if (c) map.set(itemKey(c), c); });
    (incoming || []).forEach(i => { const c = normalizeItem(i); if (c) map.set(itemKey(c), c); });
    return [...map.values()];
  }
  function escapeHtml(str){ return String(str ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;"); }
  function safeFileName(name){ return String(name || "biblioteca").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-zA-Z0-9-_() ]/g,"").trim().replace(/\s+/g,"-").slice(0,90) || "biblioteca"; }
  function slugifyName(name){ return String(name || "usuario").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"") || "usuario"; }
  function uniqueSharedKey(state, base){
    const root=slugifyName(base);
    if(!state.shared[root]) return root;
    let n=2;
    while(state.shared[`${root}-${n}`]) n++;
    return `${root}-${n}`;
  }
  function prettyDateForFile(date=new Date()){
    const pad=n=>String(n).padStart(2,"0");
    const dd=pad(date.getDate()), mm=pad(date.getMonth()+1), yyyy=String(date.getFullYear());
    return `--`;
  }
  function backupFileName(userName){ return `${String(userName||"Usuario").trim()||"Usuario"}-CS-(${prettyDateForFile()})`; }
  function downloadJson(payload, filename){
    const blob = new Blob([JSON.stringify(payload,null,2)], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = safeFileName(filename).replace(/\.json$/i,"") + ".json";
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }
  function readJsonFile(file){
    return new Promise((resolve,reject)=>{
      if (!file) return reject(new Error("Selecciona un archivo JSON."));
      const reader = new FileReader();
      reader.onload = () => { try { resolve(JSON.parse(String(reader.result || ""))); } catch(_){ reject(new Error("El archivo no parece ser un JSON válido.")); } };
      reader.onerror = () => reject(new Error("No se pudo leer el archivo."));
      reader.readAsText(file);
    });
  }
  function getUserName(){ return getState().userName || ""; }
  function setUserName(name){ const s=getState(); s.userName=String(name||"").trim().slice(0,30); saveState(s); return s.userName; }
  function getPersonalList(key){ return getState().personal[key] || []; }
  function setPersonalList(key, items){ if(!LISTS.includes(key)) return; const s=getState(); s.personal[key]=mergeItems([],items||[]); saveState(s); }
  function getItemCurrentList(item){ const key=itemKey(item); if(!key) return ""; const s=getState(); return LISTS.find(list => (s.personal[list]||[]).some(saved => itemKey(saved)===key)) || ""; }
  function setItemSingleList(item, listKey){
    const clean=normalizeItem(item); if(!clean || !LISTS.includes(listKey)) return "";
    const s=getState(); const key=itemKey(clean);
    const current=LISTS.find(list => (s.personal[list]||[]).some(saved => itemKey(saved)===key));
    LISTS.forEach(list => s.personal[list]=(s.personal[list]||[]).filter(saved => itemKey(saved)!==key));
    if(current !== listKey) s.personal[listKey].unshift(clean);
    saveState(s); return current === listKey ? "" : listKey;
  }
  function removeItemFromList(scope, listKey, itemId, ownerId){
    const s=getState(); const id=String(itemId||"").toLowerCase();
    if(scope==="personal" && LISTS.includes(listKey)) s.personal[listKey]=(s.personal[listKey]||[]).filter(i=>itemKey(i)!==id);
    if(scope==="shared"){
      const lib=s.shared[ownerId];
      if(lib && lib.sections && LISTS.includes(listKey)) lib.sections[listKey]=(lib.sections[listKey]||[]).filter(i=>itemKey(i)!==id);
    }
    saveState(s);
  }
  function clearPersonalLibrary(){ const s=getState(); LISTS.forEach(k => s.personal[k]=[]); saveState(s); }
  function removeSharedOwner(ownerId){ const s=getState(); delete s.shared[ownerId]; if((s.ui.currentView||"").startsWith(`shared:${ownerId}:`)) s.ui.currentView="personal:favorito"; saveState(s); }
  function updateSharedAlias(ownerId, alias){
    const s=getState();
    if(!s.shared[ownerId]) return "";
    s.shared[ownerId].alias = String(alias || "").trim().slice(0,30);
    s.shared[ownerId].updatedAt = new Date().toISOString();
    saveState(s);
    return s.shared[ownerId].alias;
  }
  function sharedOwnerNameFromPayload(payload){
    return String(payload.ownerName || payload.userName || payload.name || "Usuario compartido").trim().slice(0,40) || "Usuario compartido";
  }
  function sharedSectionsFromPayload(payload){
    const source=payload.sections || payload.personal || {};
    let sectionKeys = Array.isArray(payload.sectionKeys) ? payload.sectionKeys.filter(k=>LISTS.includes(k)) : LISTS.filter(k=>Object.prototype.hasOwnProperty.call(source,k));
    if(!sectionKeys.length) sectionKeys = LISTS.filter(k => Array.isArray(source[k]) && source[k].length);
    const sections={}; sectionKeys.forEach(k => sections[k]=mergeItems([], source[k] || []));
    return { sections, sectionKeys };
  }
  function findSharedLibrariesByOwnerName(ownerName){
    const target=String(ownerName || "").trim().toLowerCase();
    if(!target) return [];
    const s=getState();
    return Object.keys(s.shared || {}).filter(id => String((s.shared[id]||{}).ownerName || "").trim().toLowerCase() === target);
  }
  function findSharedByOwnerName(ownerName){ return findSharedLibrariesByOwnerName(ownerName)[0] || ""; }
  function getSharedDisplayName(lib){
    if(!lib) return "Usuario compartido";
    const ownerName=String(lib.ownerName || "Usuario compartido").trim() || "Usuario compartido";
    const alias=String(lib.alias || "").trim();
    return alias ? `${ownerName} (${alias})` : ownerName;
  }
  function addSharedLibrary(payload, alias){
    const s=getState();
    const ownerName=sharedOwnerNameFromPayload(payload);
    const cleanAlias=String(alias || "").trim().slice(0,30);
    const ownerId=uniqueSharedKey(s, cleanAlias ? `${ownerName}-${cleanAlias}` : ownerName);
    const data=sharedSectionsFromPayload(payload);
    s.shared[ownerId]={ ownerId, ownerName, alias:cleanAlias, createdAt:new Date().toISOString(), sections:data.sections, sectionKeys:data.sectionKeys };
    saveState(s); return ownerId;
  }
  function mergeSharedLibrary(ownerId, payload){
    const s=getState();
    if(!s.shared[ownerId]) return addSharedLibrary(payload);
    const incoming=sharedSectionsFromPayload(payload);
    const lib=s.shared[ownerId];
    lib.sections = lib.sections || {};
    const keys=new Set([...(lib.sectionKeys || []), ...incoming.sectionKeys]);
    incoming.sectionKeys.forEach(k => lib.sections[k]=mergeItems(lib.sections[k] || [], incoming.sections[k] || []));
    lib.sectionKeys=[...keys].filter(k=>LISTS.includes(k));
    lib.updatedAt=new Date().toISOString();
    s.shared[ownerId]=lib;
    saveState(s); return ownerId;
  }
  function importOwnBackup(payload){
    const s=getState(); const source=payload.sections || payload.personal || {};
    if(payload.userName && !s.userName) s.userName=String(payload.userName).slice(0,30);
    LISTS.forEach(k => { if (source[k]) s.personal[k]=mergeItems(s.personal[k], source[k] || []); });
    saveState(s);
  }
  function exportBackupPayload(){ const s=getState(); return { type:"rtr-library-backup", version:9, exportedAt:new Date().toISOString(), userName:s.userName || "Usuario", personal:s.personal }; }
  function exportFriendPayload(sectionKeys){
    const s=getState(); const cleanKeys=(sectionKeys||[]).filter(k=>LISTS.includes(k)); const sections={};
    cleanKeys.forEach(k => sections[k]=s.personal[k] || []);
    return { type:"rtr-library-share", version:9, exportedAt:new Date().toISOString(), ownerName:s.userName || "Usuario", sectionKeys:cleanKeys, sections };
  }
})();
