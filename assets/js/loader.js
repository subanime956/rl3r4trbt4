
// 🔒 activar bloqueo apenas carga el script
document.body.classList.add("loading");

window.addEventListener("load", () => {
  const loader = document.getElementById("loader");

  if (loader) {
    loader.style.transition = "opacity .3s ease";
    loader.style.opacity = "0";
 
    setTimeout(() => {
      loader.remove();

      // 🔓 liberar scroll
      document.body.classList.remove("loading");
    }, 100);
  }
});
