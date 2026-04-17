/* Flechas L/R para categorías + ocultar/mostrar según scroll */
(function(){
  const tags = document.getElementById("rtrTags");
  if(!tags) return;

  const leftBtn  = document.querySelector(".rtr-tags-left");
  const rightBtn = document.querySelector(".rtr-tags-right");

  function updateArrows(){
    const max = tags.scrollWidth - tags.clientWidth;
    const x = tags.scrollLeft;

    if(leftBtn)  leftBtn.classList.toggle("is-hidden", x <= 2);
    if(rightBtn) rightBtn.classList.toggle("is-hidden", x >= max - 2 || max <= 2);
  }

  function scrollByAmount(dir){
    const amount = Math.min(220, Math.max(140, tags.clientWidth * 0.45));
    tags.scrollBy({ left: dir * amount, behavior:"smooth" });
  }

  leftBtn && leftBtn.addEventListener("click",  () => scrollByAmount(-1));
  rightBtn && rightBtn.addEventListener("click", () => scrollByAmount(1));

  tags.addEventListener("scroll", updateArrows, { passive:true });
  window.addEventListener("resize", updateArrows);

  updateArrows();
  setTimeout(updateArrows, 250);
})();
  
/* Idiomas + filtrar episodios */
(function(){
  const langWrap = document.querySelector(".rtr-lang");
  const btn = document.getElementById("langBtn");
  const menu = document.getElementById("langMenu");
  const pill = document.getElementById("langCurrentPill");
  const grid = document.getElementById("episodesGrid");

  if(!langWrap || !btn || !menu || !pill || !grid) return;

  const labels = { raw:"Raw", sub:"Sub", latino:"Latino" };

  function setOpen(v){
    langWrap.classList.toggle("open", v);
    btn.setAttribute("aria-expanded", v ? "true" : "false");
  }

  function applyLang(lang){
    pill.textContent = labels[lang] || lang;

    grid.querySelectorAll(".rtr-ep-card").forEach(card=>{
      card.style.display = (card.dataset.lang === lang) ? "" : "none";
    });

    menu.querySelectorAll(".rtr-lang-item").forEach(i=>{
      i.classList.toggle("is-active", i.dataset.lang === lang);
    });
  }

  btn.addEventListener("click", (e)=>{
    e.stopPropagation();
    setOpen(!langWrap.classList.contains("open"));
  });

  menu.addEventListener("click", (e)=>{
    const item = e.target.closest(".rtr-lang-item");
    if(!item) return;
    applyLang(item.dataset.lang);
    setOpen(false);
  });

  document.addEventListener("click", ()=> setOpen(false));
  document.addEventListener("keydown", (e)=>{ if(e.key === "Escape") setOpen(false); });
  menu.addEventListener("click", (e)=> e.stopPropagation());




  const activeItem = menu.querySelector(".rtr-lang-item.is-active");
  const firstItem = menu.querySelector(".rtr-lang-item");
  const initialLang = activeItem?.dataset.lang || firstItem?.dataset.lang;

  if(initialLang) applyLang(initialLang);
})();
