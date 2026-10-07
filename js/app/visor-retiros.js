(function() {
    var tituloPrincipal = document.getElementById('titulo-visor-principal');
    var tituloOriginal = tituloPrincipal ? tituloPrincipal.textContent : '';
    var subtitulo = document.querySelector('.encabezado-subtitulo');
    var subtituloOriginal = subtitulo ? subtitulo.textContent : '';
    var cabecera = document.getElementById('retiros-cabecera');
    var estado = document.getElementById('retiros-estado');
    var capaRetirosPoligonos = null;
    var capaRetirosLineas = null;
    var controlCapas = null;
    var carga = null;
    var estadoAnterior = null;
    var activo = false;
    var sesion = 0;

    function agregarScript(ruta) {
        return new Promise(function(resolve, reject) {
            var script = document.createElement('script');
            script.src = ruta;
            script.async = true;
            script.onload = resolve;
            script.onerror = function() {
                script.remove();
                reject(new Error('No se pudo cargar ' + ruta));
            };
            document.head.appendChild(script);
        });
    }

    function cargarDatos() {
        if (carga) return carga;
        if (window.geojsonRetirosPoligonos && window.geojsonRetirosLineas) return Promise.resolve();
        carga = Promise.all([
            agregarScript('data/retiros_poligonos.js?v=20261007-1'),
            agregarScript('data/retiros_lineas.js?v=20261007-1')
        ]).catch(function(error) {
            carga = null;
            throw error;
        });
        return carga;
    }

    function textoSeguro(valor) {
        return String(valor === null || valor === undefined || valor === '' ? 'No disponible' : valor)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function contenidoPopup(titulo, propiedades, campos) {
        var contenido = '<div class="popup-retiro-contenido"><strong>' + titulo + '</strong>';
        campos.forEach(function(campo) {
            var valor = propiedades[campo.key];
            if (valor === null || valor === undefined || valor === '') return;
            if (campo.key === 'AREA' && Number.isFinite(Number(valor))) {
                valor = Number(valor).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' m²';
            }
            contenido += '<span><b>' + campo.label + ':</b> ' + textoSeguro(valor) + '</span>';
        });
        return contenido + '</div>';
    }

    function estiloPoligono(feature) {
        var categoria = String(feature.properties && feature.properties['CATEGORÍA'] || '');
        var compatible = categoria === 'Con usos compatibles';
        return {
            pane: 'pane_retiros_nuevos_poligonos',
            color: 'rgba(35,35,35,0.5)',
            weight: 1,
            opacity: 1,
            fill: true,
            fillColor: compatible ? '#333333' : '#78e1d8',
            fillOpacity: 0.5,
            interactive: true
        };
    }

    function estiloLinea(feature) {
        var compatibilidad = String(feature.properties && feature.properties['USOS COMPA'] || '');
        var color = '#6cd4da';
        if (compatibilidad === 'Con compatibilidad de uso') color = '#d31d13';
        else if (compatibilidad === 'Con compatibilidad de uso * solo obra nueva') color = '#db1e2a';
        return {
            pane: 'pane_retiros_nuevas_lineas',
            color: color,
            weight: compatibilidad.indexOf('solo obra nueva') !== -1 ? 2.5 : 2,
            opacity: 0.95,
            lineCap: 'round',
            lineJoin: 'round',
            interactive: true
        };
    }

    function crearCapas() {
        if (capaRetirosPoligonos) return;
        if (!map.getPane('pane_retiros_nuevos_poligonos')) {
            map.createPane('pane_retiros_nuevos_poligonos');
            map.getPane('pane_retiros_nuevos_poligonos').style.zIndex = 430;
        }
        if (!map.getPane('pane_retiros_nuevas_lineas')) {
            map.createPane('pane_retiros_nuevas_lineas');
            map.getPane('pane_retiros_nuevas_lineas').style.zIndex = 431;
        }

        capaRetirosPoligonos = L.geoJSON(window.geojsonRetirosPoligonos, {
            pane: 'pane_retiros_nuevos_poligonos',
            renderer: L.canvas({ pane: 'pane_retiros_nuevos_poligonos', padding: 0.2, tolerance: 6 }),
            smoothFactor: 1,
            style: estiloPoligono,
            onEachFeature: function(feature, layer) {
                layer.bindPopup(contenidoPopup('Polígono de retiro', feature.properties || {}, [
                    { key: 'CÓDIGO_RE', label: 'Código' },
                    { key: 'CATEGORÍA', label: 'Categoría' },
                    { key: 'AREA', label: 'Área' },
                    { key: 'ANCHO', label: 'Ancho' },
                    { key: 'USOS COMPA', label: 'Compatibilidad de uso' }
                ]), { className: 'popup-retiro', closeButton: false, maxWidth: 300 });
            }
        });
        capaRetirosLineas = L.geoJSON(window.geojsonRetirosLineas, {
            pane: 'pane_retiros_nuevas_lineas',
            renderer: L.canvas({ pane: 'pane_retiros_nuevas_lineas', padding: 0.2, tolerance: 7 }),
            smoothFactor: 1,
            style: estiloLinea,
            onEachFeature: function(feature, layer) {
                layer.bindPopup(contenidoPopup('Línea de retiro normativo', feature.properties || {}, [
                    { key: 'ANCHO', label: 'Ancho' },
                    { key: 'USOS COMPA', label: 'Compatibilidad de uso' }
                ]), { className: 'popup-retiro', closeButton: false, maxWidth: 300 });
            }
        });
        window.capaRetirosNormativosPoligonos = capaRetirosPoligonos;
        window.capaRetirosNormativosLineas = capaRetirosLineas;
    }

    function crearControlCapas() {
        if (controlCapas) return;
        controlCapas = L.control({ position: 'bottomleft' });
        controlCapas.onAdd = function() {
            var control = L.DomUtil.create('div', 'control-capas-retiros');
            control.innerHTML =
                '<button type="button" class="boton-capas-retiros" aria-label="Abrir leyenda y capas de retiros" aria-expanded="false"><i class="fas fa-layer-group" aria-hidden="true"></i></button>' +
                '<section class="panel-capas-retiros" hidden aria-label="Capas y leyenda de retiros">' +
                    '<h2>Capas de retiros</h2>' +
                    '<label><input type="checkbox" data-retiro-capa="poligonos" checked><i class="muestra-retiros-poligono" aria-hidden="true"></i><span>Polígonos de retiro</span></label>' +
                    '<label><input type="checkbox" data-retiro-capa="lineas" checked><i class="muestra-retiros-linea" aria-hidden="true"></i><span>Líneas de retiro</span></label>' +
                    '<div class="leyenda-retiros"><span><i class="muestra-retiros-compatible"></i>Con compatibilidad</span><span><i class="muestra-retiros-obra"></i>Solo obra nueva</span><span><i class="muestra-retiros-sin"></i>Sin compatibilidad</span></div>' +
                '</section>';
            var boton = control.querySelector('.boton-capas-retiros');
            var panel = control.querySelector('.panel-capas-retiros');
            boton.addEventListener('click', function() {
                panel.hidden = !panel.hidden;
                boton.setAttribute('aria-expanded', String(!panel.hidden));
            });
            control.querySelectorAll('[data-retiro-capa]').forEach(function(input) {
                input.addEventListener('change', function() {
                    var capa = input.dataset.retiroCapa === 'poligonos' ? capaRetirosPoligonos : capaRetirosLineas;
                    if (!capa) return;
                    if (input.checked) capa.addTo(map);
                    else map.removeLayer(capa);
                });
            });
            L.DomEvent.disableClickPropagation(control);
            L.DomEvent.disableScrollPropagation(control);
            return control;
        };
    }

    function ocultarCapasPrincipales() {
        [window.layer_usos_compatibles_0, window.layer_usos_compatibles_planes,
            window.layer_usos_compatibles_on, window.layer_parques_alineados,
            window.capaRetiros].forEach(function(capa) {
            if (capa && map.hasLayer(capa)) map.removeLayer(capa);
        });
    }

    function restaurarCapasPrincipales() {
        if (!estadoAnterior) return;
        estadoAnterior.capas.forEach(function(item) {
            if (item.visible && item.capa && !map.hasLayer(item.capa)) item.capa.addTo(map);
        });
        map.setView(estadoAnterior.centro, estadoAnterior.zoom, { animate: false });
        estadoAnterior = null;
    }

    function entrar() {
        if (activo) return;
        activo = true;
        var sesionActual = ++sesion;
        estadoAnterior = {
            centro: map.getCenter(),
            zoom: map.getZoom(),
            capas: [window.layer_usos_compatibles_0, window.layer_usos_compatibles_planes,
                window.layer_usos_compatibles_on, window.layer_parques_alineados,
                window.capaRetiros].filter(Boolean).map(function(capa) {
                    return { capa: capa, visible: map.hasLayer(capa) };
                })
        };
        document.body.classList.add('modo-retiros');
        if (cabecera) cabecera.hidden = false;
        if (tituloPrincipal) tituloPrincipal.textContent = 'Visor de retiros normativos del distrito de San Borja';
        if (subtitulo) subtitulo.textContent = 'Consulta de polígonos y líneas de retiro';
        if (window.cerrarPanelesMapa) window.cerrarPanelesMapa();
        if (window.cerrarPanelDetalle) window.cerrarPanelDetalle();
        ocultarCapasPrincipales();
        crearControlCapas();
        controlCapas.addTo(map);
        if (estado) estado.textContent = 'Cargando capas…';
        map.invalidateSize({ pan: false });

        cargarDatos().then(function() {
            if (!activo || sesionActual !== sesion) return;
            crearCapas();
            capaRetirosPoligonos.addTo(map);
            capaRetirosLineas.addTo(map);
            var limites = capaRetirosPoligonos.getBounds();
            if (capaRetirosLineas.getBounds().isValid()) limites.extend(capaRetirosLineas.getBounds());
            if (limites.isValid()) map.fitBounds(limites, { padding: [34, 34], maxZoom: 17, animate: false });
            if (estado) estado.textContent = 'Capas listas';
        }).catch(function(error) {
            if (sesionActual !== sesion) return;
            console.error('No se pudieron cargar las capas de retiros.', error);
            if (estado) estado.textContent = 'No se pudieron cargar las capas. Vuelve a intentarlo.';
            activo = false;
        });
    }

    function salir() {
        if (!activo && !document.body.classList.contains('modo-retiros')) return;
        activo = false;
        sesion += 1;
        document.body.classList.remove('modo-retiros');
        if (cabecera) cabecera.hidden = true;
        if (controlCapas) controlCapas.remove();
        if (capaRetirosPoligonos) map.removeLayer(capaRetirosPoligonos);
        if (capaRetirosLineas) map.removeLayer(capaRetirosLineas);
        restaurarCapasPrincipales();
        if (tituloPrincipal) tituloPrincipal.textContent = tituloOriginal;
        if (subtitulo) subtitulo.textContent = subtituloOriginal;
        if (estado) estado.textContent = '';
        map.closePopup();
        map.invalidateSize({ pan: false });
    }

    window.visorRetiros = { entrar: entrar, salir: salir };
})();
