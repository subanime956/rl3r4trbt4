  const btn = document.getElementById("scrollToTopBtn");

  window.addEventListener("scroll", () => {
    btn.style.display = (window.scrollY > 200) ? "block" : "none";
  });

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });