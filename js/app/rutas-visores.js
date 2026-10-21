(function () {
    'use strict';
    var rutaRetiros = '/niveles-operacionales/';
    function esRetiros() {
        return /^\/niveles-operacionales(?:\/|\/index\.html)?$/.test(window.location.pathname);
    }
    function navegar(visor) {
        var ruta = visor === '3' ? rutaRetiros : '/';
        if (window.location.pathname !== ruta || window.location.hash) {
            window.history.pushState(null, '', ruta + window.location.search);
        }
    }
    // Retira las coordenadas de enlaces antiguos de Leaflet Hash.
    if (/^#\d+\/-?[\d.]+\/-?[\d.]+$/.test(window.location.hash)) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    if (esRetiros()) document.documentElement.classList.add('inicio-retiros');
    window.rutasVisores = { esRetiros: esRetiros, navegar: navegar };
})();
