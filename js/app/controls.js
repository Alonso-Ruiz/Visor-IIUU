        L.control.scale({position: 'bottomleft', metric: true, imperial: false}).addTo(map);
        var norteControl = L.control({position: 'bottomleft'});
        norteControl.onAdd = function (map) {
            var div = L.DomUtil.create('div', 'norte-magnetico-flotante');
            div.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                            '<polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>' +
                            '<text x="12" y="16" font-family="Arial" font-size="8" fill="#333" text-anchor="middle" stroke="none" font-weight="bold">N</text></svg>';
            return div;
        };
        norteControl.addTo(map);

        function cerrarPanelesMapa(excepto) {
            if (excepto !== 'leyenda') {
                var leyenda = document.querySelector('.info.legend');
                var listaLeyenda = document.getElementById('leyenda-lista');
                var flechaLeyenda = document.getElementById('leyenda-arrow');
                var botonLeyenda = document.getElementById('leyenda-header');
                if (leyenda && listaLeyenda) {
                    listaLeyenda.style.display = 'none';
                    leyenda.classList.remove('leyenda-abierta');
                    leyenda.classList.add('leyenda-cerrada');
                    if (flechaLeyenda) flechaLeyenda.innerHTML = '▼';
                    if (botonLeyenda) {
                        botonLeyenda.setAttribute('aria-expanded', 'false');
                        botonLeyenda.setAttribute('aria-label', 'Abrir leyenda de usos');
                    }
                }
            }

            if (excepto !== 'capas') {
                var capas = document.getElementById('control-capas-auxiliares');
                var botonCapas = document.getElementById('boton-capas-auxiliares');
                var panelCapas = document.getElementById('panel-capas-auxiliares');
                if (capas && panelCapas) {
                    capas.classList.remove('capas-auxiliares-abiertas');
                    capas.classList.add('capas-auxiliares-cerradas');
                    panelCapas.setAttribute('aria-hidden', 'true');
                    if (botonCapas) {
                        botonCapas.setAttribute('aria-expanded', 'false');
                        botonCapas.setAttribute('aria-label', 'Abrir capas adicionales');
                    }
                }
            }

            if (excepto !== 'transparencia') {
                var transparencia = document.getElementById('control-transparencia-mapa');
                var botonTransparencia = document.getElementById('boton-transparencia-mapa');
                var panelTransparencia = document.getElementById('panel-transparencia-mapa');
                if (transparencia && panelTransparencia) {
                    transparencia.classList.remove('transparencia-abierta');
                    transparencia.classList.add('transparencia-cerrada');
                    panelTransparencia.setAttribute('aria-hidden', 'true');
                    if (botonTransparencia) {
                        botonTransparencia.setAttribute('aria-expanded', 'false');
                        botonTransparencia.setAttribute('aria-label', 'Abrir transparencia del mapa');
                    }
                }
            }
        }

        window.cerrarPanelesMapa = cerrarPanelesMapa;

        var informacionControl = L.control({position: 'bottomleft'});
        informacionControl.onAdd = function() {
            var div = L.DomUtil.create('div', 'control-info-titulo titulo-info-cerrado');
            div.id = 'control-info-titulo';
            div.innerHTML =
                '<button type="button" id="boton-info-titulo" class="boton-info-titulo" aria-label="Mostrar encabezado del visor" aria-expanded="true">' +
                    '<i class="fas fa-info" aria-hidden="true"></i>' +
                '</button>';
            L.DomEvent.disableClickPropagation(div);
            return div;
        };
        informacionControl.addTo(map);

        (function iniciarTituloInformativo() {
            var tarjeta = document.getElementById('tarjeta-titulo');
            var bloque = document.getElementById('bloque-superior-izquierdo');
            var boton = document.getElementById('boton-info-titulo');
            if (!tarjeta || !bloque || !boton) return;

            function fijarVisible(visible) {
                bloque.classList.toggle('titulo-oculto', !visible);
                document.body.classList.toggle('titulo-visible', visible);
                document.body.classList.toggle('titulo-oculto', !visible);
                boton.setAttribute('aria-expanded', visible ? 'true' : 'false');
                boton.setAttribute('aria-label', visible ? 'Ocultar encabezado del visor' : 'Mostrar encabezado del visor');
            }

            boton.addEventListener('click', function() {
                cerrarPanelesMapa();
                fijarVisible(bloque.classList.contains('titulo-oculto'));
            });

            setTimeout(function() {
                fijarVisible(false);
            }, 3600);
        })();

        // --- LEYENDA (INTERACTIVA) ---
        window.toggleConcepto = function(id) {
            var el = document.getElementById(id);
            document.querySelectorAll('.leyenda-concepto').forEach(c => { if(c.id !== id) c.style.display = 'none'; });
            el.style.display = (el.style.display === 'none' || el.style.display === '') ? 'block' : 'none';
        };

        var legend = L.control({position: 'bottomleft'});
        legend.onAdd = function (map) {
            var div = L.DomUtil.create('div', 'info legend');
            div.classList.add('leyenda-cerrada');
            L.DomEvent.disableClickPropagation(div);
            L.DomEvent.disableScrollPropagation(div);
            div.innerHTML += '<button type="button" id="leyenda-header" class="leyenda-header" aria-label="Abrir leyenda de usos" aria-expanded="false">' +
                             '<span class="leyenda-boton-icon" aria-hidden="true"><img src="assets/icon_leyenda.png" alt=""></span>' +
                             '<span><strong>Leyenda de usos</strong><small>Colores del mapa</small></span>' +
                             '<span id="leyenda-arrow" class="leyenda-arrow">▼</span></button>';

            var listaHtml = '<div id="leyenda-lista" class="leyenda-lista" style="display: none;">' +
                            '<div class="leyenda-panel-titulo"><strong>Leyenda de usos</strong><small>Colores del mapa</small></div>';

            var cats = [
                { id: 'Uso Mixto Especializado', n: 'Mixto Especializado', c: '#7a0403' }, { id: 'Uso Mixto Intensivo', n: 'Mixto Intensivo', c: '#b72020' },
                { id: 'Uso Mixto Metropolitano', n: 'Mixto Metropolitano', c: '#9b5847' }, { id: 'Uso Mixto Zonal', n: 'Mixto Zonal', c: '#f47a7a' },
                { id: 'Uso Mixto Vecinal', n: 'Mixto Vecinal', c: '#f27144' }, { id: 'Uso Residencial Preferente', n: 'Residencial Preferente', c: '#f4c644' },
                { id: 'Uso Residencial Especial', n: 'Residencial Especial', c: '#feac00' }, { id: 'Uso Residencial Exclusivo', n: 'Residencial Exclusivo', c: '#f4f4f4' },
                { id: 'Usos Específicos - Otros Usos', n: 'Usos Específicos - Otros Usos', c: '#818181' },
                { id: 'Usos Específicos - Educación', n: 'Usos Específicos - Educación', c: '#818181' },
                { id: 'Usos Específicos - Hospital', n: 'Usos Específicos - Hospital', c: '#818181' },
                { id: 'Uso de Recreación Pública', n: 'Recreación Pública', c: '#a4cda3' },
                { id: 'Planes Especiales', n: 'Planes Especiales', c: 'repeating-linear-gradient(45deg, #000 0, #000 2px, #fff 2px, #fff 4px)' },
                { id: 'Planes Especiales - Uso Mixto Zonal', n: 'P.E. Uso Mixto Zonal', c: '#f47a7a' },
                { id: 'Planes Especiales - Uso Mixto Vecinal', n: 'P.E. Uso Mixto Vecinal', c: '#f27144' }
            ];

            cats.forEach((i, idx) => {
                var txt = definicionesZonas[i.id];
                if (window.categoriasUsoActivas && !i.tipo) window.categoriasUsoActivas[i.id] = true;
                listaHtml += `
                <div>
                    <div class="leyenda-item-titulo">
                        <label class="leyenda-check-label" title="Mostrar u ocultar ${i.n}">
                            <input type="checkbox" class="leyenda-checkbox" data-uso="${i.id}" data-tipo="${i.tipo || 'uso'}" checked>
                            <span class="leyenda-check-custom" aria-hidden="true"></span>
                        </label>
                        <button type="button" class="leyenda-concepto-toggle" data-concepto="concepto-${idx}">
                            <i style="background: ${i.c};"></i> <span>${i.n}</span>
                        </button>
                    </div>
                    <div id="concepto-${idx}" class="leyenda-concepto">${txt}</div>
                </div>`;
            });
            div.innerHTML += listaHtml + '</div>';

            setTimeout(function() {
                var listaScroll = document.getElementById('leyenda-lista');
                if (listaScroll) {
                    var detenerPropagacionMapa = function(e) {
                        e.stopPropagation();
                    };
                    ['wheel', 'mousewheel', 'DOMMouseScroll', 'touchstart', 'touchmove', 'pointerdown', 'pointermove'].forEach(function(evento) {
                        listaScroll.addEventListener(evento, detenerPropagacionMapa, { passive: true });
                    });
                }

                document.getElementById('leyenda-header').addEventListener('click', function() {
                    var l = document.getElementById('leyenda-lista'); var a = document.getElementById('leyenda-arrow');
                    var h = l.style.display === 'none';
                    if (h) cerrarPanelesMapa('leyenda');
                    l.style.display = h ? 'block' : 'none';
                    a.innerHTML = h ? '▲' : '▼';
                    this.closest('.legend').classList.toggle('leyenda-abierta', h);
                    this.closest('.legend').classList.toggle('leyenda-cerrada', !h);
                    this.setAttribute('aria-expanded', h ? 'true' : 'false');
                    this.setAttribute('aria-label', h ? 'Cerrar leyenda de usos' : 'Abrir leyenda de usos');
                });

                document.querySelectorAll('.leyenda-concepto-toggle').forEach(function(btn) {
                    btn.addEventListener('click', function() {
                        toggleConcepto(this.getAttribute('data-concepto'));
                    });
                });

                document.querySelectorAll('.leyenda-checkbox').forEach(function(chk) {
                    chk.addEventListener('change', function() {
                        var listaLeyenda = this.closest('.leyenda-lista');
                        var scrollLeyenda = listaLeyenda ? listaLeyenda.scrollTop : 0;

                        if (!window.categoriasUsoActivas) window.categoriasUsoActivas = {};
                        window.categoriasUsoActivas[this.getAttribute('data-uso')] = this.checked;
                        if (window.actualizarVisibilidadUsos) window.actualizarVisibilidadUsos();

                        if (listaLeyenda) {
                            requestAnimationFrame(function() {
                                listaLeyenda.scrollTop = scrollLeyenda;
                            });
                        }
                    });
                });
            }, 100);
            return div;
        };
        legend.addTo(map);

        // --- CAPAS AUXILIARES: RETIROS Y BORDES ---
        var capasAuxiliaresControl = L.control({position: 'bottomleft'});
        capasAuxiliaresControl.onAdd = function() {
            var div = L.DomUtil.create('div', 'control-capas-auxiliares capas-auxiliares-cerradas');
            div.id = 'control-capas-auxiliares';
            div.innerHTML =
                '<button type="button" id="boton-capas-auxiliares" class="boton-capas-auxiliares" aria-label="Abrir capas adicionales" aria-expanded="false">' +
                    '<i class="fas fa-clone" aria-hidden="true"></i>' +
                '</button>' +
                '<div id="panel-capas-auxiliares" class="panel-capas-auxiliares" aria-hidden="true">' +
                    '<div class="panel-capas-titulo"><i class="fas fa-clone" aria-hidden="true"></i><span>Capas adicionales</span></div>' +
                    '<label class="capa-auxiliar-item" for="capa-retiros-visible">' +
                        '<input type="checkbox" id="capa-retiros-visible" checked>' +
                        '<span class="capa-auxiliar-check" aria-hidden="true"></span>' +
                        '<i class="muestra-capa muestra-retiro" aria-hidden="true"></i>' +
                        '<span>Retiro</span>' +
                    '</label>' +
                    '<label class="capa-auxiliar-item" for="capa-bordes-visible">' +
                        '<input type="checkbox" id="capa-bordes-visible" checked>' +
                        '<span class="capa-auxiliar-check" aria-hidden="true"></span>' +
                        '<i class="muestra-capa muestra-borde" aria-hidden="true"></i>' +
                        '<span>Borde</span>' +
                    '</label>' +
                '</div>';

            L.DomEvent.disableClickPropagation(div);
            L.DomEvent.disableScrollPropagation(div);
            return div;
        };
        capasAuxiliaresControl.addTo(map);

        (function iniciarCapasAuxiliares() {
            var control = document.getElementById('control-capas-auxiliares');
            var boton = document.getElementById('boton-capas-auxiliares');
            var panel = document.getElementById('panel-capas-auxiliares');
            var retiros = document.getElementById('capa-retiros-visible');
            var bordes = document.getElementById('capa-bordes-visible');

            function alternarPanel(forzarAbierto) {
                var abrir = typeof forzarAbierto === 'boolean'
                    ? forzarAbierto
                    : !control.classList.contains('capas-auxiliares-abiertas');

                if (abrir) cerrarPanelesMapa('capas');
                control.classList.toggle('capas-auxiliares-abiertas', abrir);
                control.classList.toggle('capas-auxiliares-cerradas', !abrir);
                boton.setAttribute('aria-expanded', abrir ? 'true' : 'false');
                boton.setAttribute('aria-label', abrir ? 'Cerrar capas adicionales' : 'Abrir capas adicionales');
                panel.setAttribute('aria-hidden', abrir ? 'false' : 'true');
            }

            boton.addEventListener('click', function() { alternarPanel(); });
            retiros.addEventListener('change', function() {
                if (window.actualizarVisibilidadRetiros) window.actualizarVisibilidadRetiros(this.checked);
            });
            bordes.addEventListener('change', function() {
                if (window.actualizarVisibilidadBordes) window.actualizarVisibilidadBordes(this.checked);
            });

            document.addEventListener('click', function(e) {
                if (!control.contains(e.target)) alternarPanel(false);
            });
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') alternarPanel(false);
            });
        })();

        var transparenciaControl = L.control({position: 'bottomleft'});
        transparenciaControl.onAdd = function() {
            var div = L.DomUtil.create('div', 'control-transparencia-mapa transparencia-cerrada');
            div.id = 'control-transparencia-mapa';
            div.setAttribute('aria-label', 'Control de transparencia del mapa');
            div.innerHTML =
                '<button type="button" id="boton-transparencia-mapa" class="boton-transparencia-mapa" aria-label="Abrir transparencia del mapa" aria-expanded="false">' +
                    '<i class="fas fa-adjust" aria-hidden="true"></i>' +
                '</button>' +
                '<div id="panel-transparencia-mapa" class="panel-transparencia-mapa" aria-hidden="true">' +
                    '<label for="map-opacity">' +
                        '<i class="fas fa-layer-group" aria-hidden="true"></i>' +
                        '<span>Transparencia del mapa</span>' +
                    '</label>' +
                    '<input type="range" id="map-opacity" min="0" max="0.95" step="0.05" value="0.9" aria-label="Transparencia del mapa">' +
                '</div>';
            return div;
        };
        transparenciaControl.addTo(map);

        // --- LÓGICA DE VÍAS ---
        function actualizarTamanioLetrasVias() {
            var zoom = map.getZoom();
            var root = document.documentElement;
            var fe = '0px', fa = '0px', fc = '0px', fl = '0px';
            var oe = 0, oa = 0, oc = 0, ol = 0;

            if (zoom >= 17) { fe = '16px'; fa = '15px'; fc = '13px'; fl = '11px'; oe = 1; oa = 1; oc = 1; ol = 1; }
            else if (zoom === 16) { fe = '14px'; fa = '12px'; fc = '10px'; fl = '0px'; oe = 1; oa = 1; oc = 1; ol = 0; }
            else if (zoom === 15) { fe = '11px'; fa = '10px'; fc = '0px'; fl = '0px'; oe = 1; oa = 1; oc = 0; ol = 0; }
            else if (zoom <= 14) { fe = '10px'; fa = '0px'; fc = '0px'; fl = '0px'; oe = 1; oa = 0; oc = 0; ol = 0; }

            root.style.setProperty('--font-expresa', fe); root.style.setProperty('--op-expresa', oe);
            root.style.setProperty('--font-arterial', fa); root.style.setProperty('--op-arterial', oa);
            root.style.setProperty('--font-colectora', fc); root.style.setProperty('--op-colectora', oc);
            root.style.setProperty('--font-local', fl); root.style.setProperty('--op-local', ol);
        }
        map.on('zoomend', actualizarTamanioLetrasVias); actualizarTamanioLetrasVias();
