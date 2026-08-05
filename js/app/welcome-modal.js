        (function() {
            var modal = document.getElementById('welcome-modal');
            var cerrar = document.getElementById('btn-cerrar-portada');
            var ingresar = document.getElementById('btn-ingresar-visor');

            if (!modal) return;

            function cerrarModal() {
                modal.classList.add('oculto');
            }

            if (cerrar) cerrar.addEventListener('click', cerrarModal);
            if (ingresar) ingresar.addEventListener('click', cerrarModal);

            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && !modal.classList.contains('oculto')) {
                    cerrarModal();
                }
            });
        })();
