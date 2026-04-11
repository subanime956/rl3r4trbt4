(function(){
  const zoom = window.innerWidth <= 768 ? 0.85 : 1.00; // móvil 85%, desktop 100%

  const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');

  if(!isFirefox){
    document.documentElement.style.zoom = zoom;
  } else {
    document.documentElement.style.zoom = '';
    document.documentElement.style.transformOrigin = 'top left';
    document.documentElement.style.transform = `scale(${zoom})`;
    document.documentElement.style.width = `calc(100% / ${zoom})`;
  }
})();
