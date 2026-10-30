(function () {
    'use strict';
    var modal = document.getElementById('welcome-modal');
    if (!modal) return;
    var info = document.getElementById('portada-info');
    var consulta = document.getElementById('portada-consulta-ciiu');
    var cerrar = document.getElementById('btn-cerrar-portada');
    var ingresar = document.getElementById('btn-ingresar-visor');
    var abrirConsulta = document.getElementById('boton-consulta-ciiu');
    var volverConsulta = document.getElementById('btn-volver-consulta-ciiu');
    var focoAnterior = null;
    function cerrarModal() {
        modal.classList.add('oculto');
        var destino = focoAnterior || document.getElementById('map');
        if (destino) destino.focus();
    }
    function mostrarConsulta() {
        focoAnterior = abrirConsulta;
        if (window.cerrarPanelesMapa) window.cerrarPanelesMapa();
        info.hidden = true;
        consulta.hidden = false;
        modal.querySelector('.modal-content').classList.add('consulta-ciiu-activa');
        modal.setAttribute('aria-labelledby', 'consulta-ciiu-titulo');
        cerrar.title = 'Volver al mapa';
        cerrar.setAttribute('aria-label', 'Cerrar consulta y volver al mapa');
        modal.classList.remove('oculto');
        consulta.scrollTop = 0;
        var campo = consulta.querySelector('[data-ciiu-panel]:not([hidden]) input, [data-ciiu-panel]:not([hidden]) select');
        if (campo) campo.focus();
    }
    cerrar.addEventListener('click', cerrarModal);
    ingresar.addEventListener('click', cerrarModal);
    if (abrirConsulta && consulta) abrirConsulta.addEventListener('click', mostrarConsulta);
    if (volverConsulta) volverConsulta.addEventListener('click', cerrarModal);
    document.addEventListener('keydown', function (evento) {
        if (modal.classList.contains('oculto')) return;
        if (evento.key === 'Escape') cerrarModal();
        if (evento.key !== 'Tab') return;
        var elementos = Array.from(modal.querySelectorAll('button, input, select, a[href], summary, [tabindex="0"]'))
            .filter(function (el) { return !el.disabled && el.getClientRects().length > 0; });
        var primero = elementos[0], ultimo = elementos[elementos.length - 1];
        if (evento.shiftKey && document.activeElement === primero) {
            evento.preventDefault(); ultimo.focus();
        } else if (!evento.shiftKey && document.activeElement === ultimo) {
            evento.preventDefault(); primero.focus();
        }
    });
    ingresar.focus();
})();
