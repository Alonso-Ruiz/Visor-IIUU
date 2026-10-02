        (function() {
            var modal = document.getElementById('welcome-modal');
            var cerrar = document.getElementById('btn-cerrar-portada');
            var pantallaOpciones = document.getElementById('portada-opciones');
            var pantallaProximamente = document.getElementById('portada-proximamente');
            var volver = document.getElementById('btn-volver-opciones');
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

            function regresarOpciones() {
                pantallaProximamente.hidden = true;
                pantallaOpciones.hidden = false;
                modal.setAttribute('aria-labelledby', 'welcome-title');
                if (cerrar) cerrar.hidden = true;
                if (opcionActiva) opcionActiva.focus();
            }

            if (cerrar) cerrar.addEventListener('click', regresarOpciones);
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
                    if (!pantallaProximamente.hidden) regresarOpciones();
                }
            });
        })();
