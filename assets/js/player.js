function RTR_replaceIframe(url){
    const wrap = document.getElementById("iframeWrap");
    const old = document.getElementById("videoFrame");

    const fr = document.createElement("iframe");
    fr.id = "videoFrame";
    fr.src = url;
    fr.title = "Reproductor";
    fr.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    fr.allowFullscreen = true;

    if(old) old.remove();
    wrap.appendChild(fr);
  }

function setIframe(url, btn){
  RTR_replaceIframe(url);

  // quitar active de todos
  document.querySelectorAll(".servers button")
    .forEach(b => b.classList.remove("active"));

  // poner active al clickeado
  btn.classList.add("active");
}

  

  function RTR_setNav(id, url){
    const el = document.getElementById(id);
    const ok = !!(url && String(url).trim().length);

    if(ok){
      el.href = url;
      el.classList.remove("rtr-disabled");
      el.setAttribute("aria-disabled","false");
      el.tabIndex = 0;
    }else{
      el.removeAttribute("href");
      el.classList.add("rtr-disabled");
      el.setAttribute("aria-disabled","true");
      el.tabIndex = -1;
    }
  }

  RTR_setNav("prevBtn", NAV_LINKS.prev);
  RTR_setNav("nextBtn", NAV_LINKS.next);

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
      tag.textContent = d.tag === "PREMIUM" ? "PREMIUM" : "GRATIS";

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
