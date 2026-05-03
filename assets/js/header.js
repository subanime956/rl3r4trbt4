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
let syncInterval = null;

const CACHE_KEY = "notif_ui_state_v1";

// =========================
// UI
// =========================
function updateUI(state) {
  if (state) {
    icon.className = "fa fa-bell";
    btn.classList.add("active");
    btn.classList.remove("inactive");
  } else {
    icon.className = "fa fa-bell-slash";
    btn.classList.add("inactive");
    btn.classList.remove("active");
  }
}

function saveCachedState(state) {
  try {
    localStorage.setItem(CACHE_KEY, state ? "on" : "off");
  } catch (e) {}
}

function getCachedState() {
  try {
    return localStorage.getItem(CACHE_KEY);
  } catch (e) {
    return null;
  }
}

function applyCachedState() {
  const cached = getCachedState();

  if (cached === "on") {
    updateUI(true);
    return true;
  }

  if (cached === "off") {
    updateUI(false);
    return true;
  }

  // fallback rápido si no hay cache
  updateUI(Notification.permission === "granted");
  return false;
}

function showToast(text) {
  warning.style.display = "none";
  toastText.textContent = text;
  toast.style.display = "block";

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.style.display = "none";
  }, 2000);
}

// =========================
// PINTADO INSTANTÁNEO DESDE CACHE
// =========================
applyCachedState();

// =========================
// ONESIGNAL
// =========================
window.OneSignalDeferred = window.OneSignalDeferred || [];

OneSignalDeferred.push(async function (OneSignal) {
  async function sync(forceCheckPermission = false) {
    try {
      const permission = Notification.permission;

      if (permission === "denied") {
        updateUI(false);
        saveCachedState(false);
        return;
      }

      const opted = !!OneSignal.User.PushSubscription.optedIn;

      if (forceCheckPermission && permission !== "granted") {
        updateUI(false);
        saveCachedState(false);
        return;
      }

      updateUI(opted);
      saveCachedState(opted);
    } catch (err) {
      console.error("Error al sincronizar notificaciones:", err);
    }
  }

  function startSyncLoop() {
    if (syncInterval) clearInterval(syncInterval);
    syncInterval = setInterval(sync, 1000); // cada 1 segundo
  }

  // sincronización inicial rápida
  sync();
  setTimeout(sync, 150);
  setTimeout(sync, 500);

  // loop constante
  startSyncLoop();

  // cuando vuelves a la pestaña
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      sync(true);
    }
  });

  // cuando vuelves a enfocar la ventana
  window.addEventListener("focus", () => {
    sync(true);
  });

  // cuando la página vuelve desde cache del navegador
  window.addEventListener("pageshow", () => {
    sync(true);
  });

  // si OneSignal detecta un cambio real
  if (OneSignal.User && OneSignal.User.PushSubscription) {
    OneSignal.User.PushSubscription.addEventListener("change", function () {
      sync(true);
    });
  }

  btn.addEventListener("click", async function () {
    try {
      const permission = Notification.permission;

      if (permission === "denied") {
        toast.style.display = "none";
        warning.style.display = "block";
        return;
      }

      const opted = !!OneSignal.User.PushSubscription.optedIn;

      if (opted) {
        // cambio visual instantáneo
        updateUI(false);
        saveCachedState(false);

        await OneSignal.User.PushSubscription.optOut();
        await sync(true);
        showToast("🔕 Desactivaste las notificaciones");
      } else {
        if (permission === "default") {
          await OneSignal.Notifications.requestPermission();
        }

        if (Notification.permission === "granted") {
          // cambio visual instantáneo
          updateUI(true);
          saveCachedState(true);

          await OneSignal.User.PushSubscription.optIn();
          await sync(true);
          showToast("🔔 Activaste las notificaciones");
        } else {
          updateUI(false);
          saveCachedState(false);
          await sync(true);
        }
      }
    } catch (err) {
      console.error("Error al cambiar notificaciones:", err);
      await sync(true);
    }
  });

  closeWarning.onclick = () => {
    warning.style.display = "none";
  };

  closeToast.onclick = () => {
    toast.style.display = "none";
  };
});
