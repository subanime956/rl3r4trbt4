function toggleMenu() {
  const menu = document.getElementById("menu");
  const overlay = document.getElementById("overlay");

  const isOpen = menu.classList.toggle("open");
  overlay.classList.toggle("active");

  document.body.classList.toggle("no-scroll", isOpen);
}

function abrirBusqueda(){
  const bar = document.getElementById("searchBar");
  bar.classList.add("active");

  setTimeout(() => {
    document.getElementById("searchInput").focus();
  }, 200);
}

function cerrarBusqueda(){
  document.getElementById("searchBar").classList.remove("active");
}

document.getElementById("searchInput").addEventListener("keydown", function(e){
  if(e.key === "Enter"){
    const valor = this.value.trim();
    if(valor !== ""){
      window.location.href = "/catalogo?search=" + encodeURIComponent(valor);
    }
  }
});




const btn = document.getElementById("notifToggle");
const icon = document.getElementById("bellIcon");

const warning = document.getElementById("notifWarning");
const closeWarning = document.getElementById("closeWarning");

const toast = document.getElementById("notifToast");
const toastText = document.getElementById("toastText");
const closeToast = document.getElementById("closeToast");

let toastTimeout;

// estado inicial
if (Notification.permission === "granted") {
  icon.className = "fa fa-bell";
  btn.classList.add("active");
} else {
  icon.className = "fa fa-bell-slash";
  btn.classList.add("inactive");
}

function updateUI(state){
  if(state){
    icon.className = "fa fa-bell";
    btn.classList.add("active");
    btn.classList.remove("inactive");
  } else {
    icon.className = "fa fa-bell-slash";
    btn.classList.add("inactive");
    btn.classList.remove("active");
  }
}

function showToast(text){
  warning.style.display = "none";
  toastText.textContent = text;
  toast.style.display = "block";

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.style.display = "none";
  }, 2000);
}

window.OneSignalDeferred = window.OneSignalDeferred || [];

OneSignalDeferred.push(async function(OneSignal){

  function sync(){
    updateUI(OneSignal.User.PushSubscription.optedIn);
  }

  setTimeout(sync, 100);

  btn.addEventListener("click", async function(){

    const permission = Notification.permission;

    if(permission === "denied"){
      toast.style.display = "none";
      warning.style.display = "block";
      return;
    }

    const opted = OneSignal.User.PushSubscription.optedIn;

    if(opted){
      await OneSignal.User.PushSubscription.optOut();
      updateUI(false);
      showToast("🔕 Desactivaste las notificaciones");
    } else {

      if(permission === "default"){
        await OneSignal.Notifications.requestPermission();
      } else {
        await OneSignal.User.PushSubscription.optIn();
      }

      updateUI(true);
      showToast("🔔 Activaste las notificaciones");
    }
  });

  closeWarning.onclick = () => warning.style.display = "none";
  closeToast.onclick = () => toast.style.display = "none";

});
