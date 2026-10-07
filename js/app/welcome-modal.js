        (function() {
            var modal = document.getElementById('welcome-modal');
            var cerrar = document.getElementById('btn-cerrar-portada');
            var pantallaOpciones = document.getElementById('portada-opciones');
            var pantallaProximamente = document.getElementById('portada-proximamente');
            var pantallaConsultaCiiu = document.getElementById('portada-consulta-ciiu');
            var abrirRetiros = modal ? modal.querySelector('[data-open-retiros]') : null;
            var volverRetiros = document.getElementById('btn-volver-retiros');
            var volver = document.getElementById('btn-volver-opciones');
            var volverConsultaCiiu = document.getElementById('btn-volver-consulta-ciiu');
            var abrirConsultaCiiu = document.getElementById('boton-consulta-ciiu');
            var opciones = modal ? modal.querySelectorAll('[data-open-visor]') : [];
            var proximamente = modal ? modal.querySelectorAll('[data-coming-soon]') : [];
            var tituloProximamente = document.getElementById('portada-proximamente-titulo');
            var descripcionProximamente = document.getElementById('portada-proximamente-descripcion');
            var opcionActiva = null;

            if (!modal) return;

            // Solo la tarjeta de Giros permitidos puede cerrar la portada.
            // La X aparece únicamente en la pantalla secundaria y vuelve al menú.
            if (cerrar) cerrar.hidden = true;

            function cerrarModal() {
                modal.classList.add('oculto');
            }

            function abrirVisorRetiros() {
                opcionActiva = abrirRetiros;
                modal.classList.add('oculto');
                if (window.visorRetiros) window.visorRetiros.entrar();
            }

            function cerrarVisorRetiros() {
                if (window.visorRetiros) window.visorRetiros.salir();
                modal.classList.remove('oculto');
                regresarOpciones();
            }

            function regresarOpciones() {
                pantallaProximamente.hidden = true;
                if (pantallaConsultaCiiu) pantallaConsultaCiiu.hidden = true;
                pantallaOpciones.hidden = false;
                modal.querySelector('.modal-content').classList.remove('consulta-ciiu-activa');
                modal.setAttribute('aria-labelledby', 'welcome-title');
                if (cerrar) {
                    cerrar.title = 'Volver a las opciones';
                    cerrar.setAttribute('aria-label', 'Volver a las opciones');
                }
                if (cerrar) cerrar.hidden = true;
                if (opcionActiva) opcionActiva.focus();
            }

            function abrirPantallaConsultaCiiu() {
                opcionActiva = abrirConsultaCiiu;
                pantallaOpciones.hidden = true;
                pantallaProximamente.hidden = true;
                pantallaConsultaCiiu.hidden = false;
                modal.querySelector('.modal-content').classList.add('consulta-ciiu-activa');
                modal.setAttribute('aria-labelledby', 'consulta-ciiu-titulo');
                cerrar.hidden = false;
                cerrar.title = 'Volver al mapa';
                cerrar.setAttribute('aria-label', 'Cerrar consulta y volver al mapa');
                modal.classList.remove('oculto');
                pantallaConsultaCiiu.scrollTop = 0;
                var busqueda = pantallaConsultaCiiu.querySelector('[data-ciiu-panel]:not([hidden]) input, [data-ciiu-panel]:not([hidden]) select');
                if (busqueda) busqueda.focus();
            }

            function cerrarConsultaCiiu() {
                pantallaConsultaCiiu.hidden = true;
                pantallaOpciones.hidden = false;
                modal.querySelector('.modal-content').classList.remove('consulta-ciiu-activa');
                modal.setAttribute('aria-labelledby', 'welcome-title');
                if (cerrar) {
                    cerrar.title = 'Volver a las opciones';
                    cerrar.setAttribute('aria-label', 'Volver a las opciones');
                    cerrar.hidden = true;
                }
                modal.classList.add('oculto');
                if (opcionActiva) opcionActiva.focus();
            }

            if (cerrar) cerrar.addEventListener('click', function() {
                if (pantallaConsultaCiiu && !pantallaConsultaCiiu.hidden) cerrarConsultaCiiu();
                else regresarOpciones();
            });
            if (abrirRetiros) abrirRetiros.addEventListener('click', abrirVisorRetiros);
            if (volverRetiros) volverRetiros.addEventListener('click', cerrarVisorRetiros);
            if (abrirConsultaCiiu) abrirConsultaCiiu.addEventListener('click', function() {
                if (window.cerrarPanelesMapa) window.cerrarPanelesMapa();
                abrirPantallaConsultaCiiu();
            });
            if (volverConsultaCiiu) volverConsultaCiiu.addEventListener('click', cerrarConsultaCiiu);
            opciones.forEach(function(opcion) {
                opcion.addEventListener('click', cerrarModal);
            });
            proximamente.forEach(function(opcion) {
                opcion.addEventListener('click', function() {
                    opcionActiva = opcion;
                    var titulo = opcion.querySelector('.portada-tarjeta-titulo');
                    pantallaOpciones.hidden = true;
                    pantallaProximamente.hidden = false;
                    modal.setAttribute('aria-labelledby', 'portada-proximamente-titulo');
                    cerrar.hidden = false;
                    tituloProximamente.textContent = 'Estamos preparando este visor';
                    descripcionProximamente.textContent = 'El módulo «' + (titulo ? titulo.textContent.trim() : 'seleccionado') + '» está en proceso de construcción. Estamos preparando este espacio para reunir su información y herramientas de consulta. Mientras tanto, puedes volver a las opciones e ingresar al visor de Giros permitidos.';
                    volver.focus();
                });
            });
            if (volver) volver.addEventListener('click', regresarOpciones);

            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && !modal.classList.contains('oculto')) {
                    if (pantallaConsultaCiiu && !pantallaConsultaCiiu.hidden) cerrarConsultaCiiu();
                    else if (!pantallaProximamente.hidden) regresarOpciones();
                }
                if (e.key === 'Escape' && document.body.classList.contains('modo-retiros')) cerrarVisorRetiros();
            });
        })();
