(function() {
    var tituloPrincipal = document.getElementById('titulo-visor-principal');
    var tituloOriginal = tituloPrincipal ? tituloPrincipal.textContent : '';
    var subtitulo = document.querySelector('.encabezado-subtitulo');
    var subtituloOriginal = subtitulo ? subtitulo.textContent : '';
    var cabecera = document.getElementById('retiros-cabecera');
    var estado = document.getElementById('retiros-estado');
    var capaRetirosContexto = null;
    var capaRetirosLotes = null;
    var capaRetirosCompatibles = null;
    var capaRetirosPoligonos = null;
    var capaRetirosLineas3m = null;
    var capaRetirosLineas5m = null;
    var panelCapas = document.getElementById('panel-capas-retiros');
    var panelDetalle = document.getElementById('panel-usos');
    var tituloDetalle = document.getElementById('nombre-uso-titulo');
    var ayudaDetalle = document.getElementById('ayuda-panel');
    var detalleRetiros = document.getElementById('retiros-detalle');
    var camposDetalleRetiros = document.getElementById('retiros-detalle-campos');
    var tituloPanelOriginal = document.querySelector('#panel-usos .cabecera-negra h4');
    var tituloPanelTextoOriginal = tituloPanelOriginal ? tituloPanelOriginal.textContent : '';
    var panelCapasAuxiliares = document.getElementById('panel-capas-auxiliares');
    var botonCapasAuxiliares = document.getElementById('boton-capas-auxiliares');
    var contenidoBotonCapasOriginal = botonCapasAuxiliares ? botonCapasAuxiliares.innerHTML : '';
    var etiquetaBotonCapasOriginal = botonCapasAuxiliares ? botonCapasAuxiliares.getAttribute('aria-label') : '';
    var carga = null;
    var estadoAnterior = null;
    var activo = false;
    var sesion = 0;
    var indiceClicPoligonos = Object.create(null);
    var tamanoCeldaClic = 0.001;
    var ultimoClicDeCapa = null;

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
        if (window.geojsonRetirosContexto && window.geojsonRetirosLotes && window.geojsonRetirosCompatibles && window.geojsonRetirosPoligonos && window.geojsonRetirosLineas) return Promise.resolve();
        carga = Promise.all([
            agregarScript('data/retiros_contexto.js?v=20261009-1'),
            agregarScript('data/retiros_lotes.js?v=20261009-1'),
            agregarScript('data/retiros_compatibles.js?v=20261009-1'),
            agregarScript('data/retiros_poligonos.js?v=20261009-1'),
            agregarScript('data/retiros_lineas.js?v=20261009-1')
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

    function areaGeometriaM2(geometria) {
        if (!geometria || !geometria.coordinates) return 0;
        var radio = 6378137;
        function areaAnillo(anillo) {
            var suma = 0;
            for (var i = 0; i < anillo.length - 1; i++) {
                var a = anillo[i], b = anillo[i + 1];
                suma += (b[0] - a[0]) * Math.PI / 180 * (2 + Math.sin(a[1] * Math.PI / 180) + Math.sin(b[1] * Math.PI / 180));
            }
            return Math.abs(suma * radio * radio / 2);
        }
        function areaPoligono(poligono) {
            if (!poligono.length) return 0;
            return Math.max(0, areaAnillo(poligono[0]) - poligono.slice(1).reduce(function(total, anillo) { return total + areaAnillo(anillo); }, 0));
        }
        if (geometria.type === 'Polygon') return areaPoligono(geometria.coordinates);
        if (geometria.type === 'MultiPolygon') return geometria.coordinates.reduce(function(total, poligono) { return total + areaPoligono(poligono); }, 0);
        return 0;
    }

    function limitesGeometria(geometria) {
        if (!geometria || !geometria.coordinates) return null;
        var limites = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
        function visitar(coordenadas) {
            if (!coordenadas) return;
            if (typeof coordenadas[0] === 'number' && typeof coordenadas[1] === 'number') {
                limites.minX = Math.min(limites.minX, coordenadas[0]);
                limites.maxX = Math.max(limites.maxX, coordenadas[0]);
                limites.minY = Math.min(limites.minY, coordenadas[1]);
                limites.maxY = Math.max(limites.maxY, coordenadas[1]);
                return;
            }
            coordenadas.forEach(visitar);
        }
        visitar(geometria.coordinates);
        return Number.isFinite(limites.minX) ? limites : null;
    }

    function celdaClic(x, y) { return Math.floor(x / tamanoCeldaClic) + ':' + Math.floor(y / tamanoCeldaClic); }

    function indexarPoligonos(datos, titulo, prioridad) {
        (datos && datos.features || []).forEach(function(feature) {
            if (!feature.geometry || !/Polygon/.test(feature.geometry.type)) return;
            var geometria = feature.geometry;
            var partes = geometria.type === 'Polygon' ? [geometria] : geometria.coordinates.map(function(coordenadas) {
                return { type: 'Polygon', coordinates: coordenadas };
            });
            partes.forEach(function(parte) {
                var limites = limitesGeometria(parte);
                if (!limites) return;
                var registro = { feature: feature, geometria: parte, titulo: titulo, limites: limites, prioridad: prioridad };
                var minX = Math.floor(limites.minX / tamanoCeldaClic);
                var maxX = Math.floor(limites.maxX / tamanoCeldaClic);
                var minY = Math.floor(limites.minY / tamanoCeldaClic);
                var maxY = Math.floor(limites.maxY / tamanoCeldaClic);
                for (var x = minX; x <= maxX; x++) {
                    for (var y = minY; y <= maxY; y++) {
                        var llave = x + ':' + y;
                        if (!indiceClicPoligonos[llave]) indiceClicPoligonos[llave] = [];
                        indiceClicPoligonos[llave].push(registro);
                    }
                }
            });
        });
    }

    function puntoEnAnillo(punto, anillo) {
        var dentro = false;
        for (var i = 0, j = anillo.length - 1; i < anillo.length; j = i++) {
            var xi = anillo[i][0], yi = anillo[i][1], xj = anillo[j][0], yj = anillo[j][1];
            var cruza = ((yi > punto[1]) !== (yj > punto[1])) &&
                (punto[0] < (xj - xi) * (punto[1] - yi) / ((yj - yi) || 1e-15) + xi);
            if (cruza) dentro = !dentro;
        }
        return dentro;
    }

    function puntoEnGeometria(punto, geometria) {
        var poligonos = geometria.type === 'Polygon' ? [geometria.coordinates] : geometria.coordinates;
        return poligonos.some(function(poligono) {
            return poligono.length && puntoEnAnillo(punto, poligono[0]) &&
                !poligono.slice(1).some(function(hueco) { return puntoEnAnillo(punto, hueco); });
        });
    }

    function poligonoBajoPunto(punto) {
        var candidatos = indiceClicPoligonos[celdaClic(punto[0], punto[1])] || [];
        for (var i = 0; i < candidatos.length; i++) {
            var candidato = candidatos[i], limites = candidato.limites;
            if (punto[0] < limites.minX || punto[0] > limites.maxX ||
                punto[1] < limites.minY || punto[1] > limites.maxY) continue;
            if (puntoEnGeometria(punto, candidato.geometria)) return candidato;
        }
        return null;
    }

    function buscarPoligonoPorClic(e) {
        if (!activo || !e || !e.latlng) return;
        if (ultimoClicDeCapa && Date.now() - ultimoClicDeCapa.tiempo < 120 &&
            map.distance(ultimoClicDeCapa.latlng, e.latlng) < 1) return;
        var candidato = poligonoBajoPunto([e.latlng.lng, e.latlng.lat]);
        if (!candidato) return;
        map.closePopup();
        mostrarDetalle(candidato.titulo, candidato.feature.properties, candidato.feature, e.latlng);
    }

    function actualizarCursorRetiros(e) {
        if (!activo || !e || !e.latlng) return;
        var candidato = poligonoBajoPunto([e.latlng.lng, e.latlng.lat]);
        map.getContainer().classList.toggle('retiros-cursor-clicable', Boolean(candidato));
    }

    map.on('click', buscarPoligonoPorClic);
    map.on('mousemove', actualizarCursorRetiros);
    map.on('mouseout', function() {
        map.getContainer().classList.remove('retiros-cursor-clicable');
    });

    function mostrarDetalle(titulo, propiedades, feature, latlng) {
        if (!activo || !latlng) return;
        propiedades = propiedades || {};
        var entradas = Object.keys(propiedades).filter(function(clave) {
            return propiedades[clave] !== null && propiedades[clave] !== undefined && String(propiedades[clave]).trim() !== '';
        });
        var html = '';
        entradas.forEach(function(clave) {
            var valor = propiedades[clave];
            if (clave === 'AREA' && Number.isFinite(Number(valor))) {
                valor = Number(valor).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' m²';
            }
            html += '<div class="retiros-dato"><span>' + textoSeguro(clave.replace(/_/g, ' ')) + '</span><strong>' + textoSeguro(valor) + '</strong></div>';
        });
        if (feature && feature.geometry && /Polygon/.test(feature.geometry.type)) {
            var area = areaGeometriaM2(feature.geometry);
            if (area > 0 && !Object.keys(propiedades).some(function(k) {
                return /area/i.test(k) && propiedades[k] !== null && propiedades[k] !== undefined && String(propiedades[k]).trim() !== '';
            })) {
                html += '<div class="retiros-dato"><span>Área calculada</span><strong>' + area.toLocaleString('es-PE', { maximumFractionDigits: 1 }) + ' m²</strong></div>';
            }
        }
        if (!html) html = '<p class="retiros-sin-datos">Este elemento no tiene atributos asociados; se muestra su geometría de referencia.</p>';
        var contenido = '<div class="retiros-popup-ficha"><strong class="retiros-popup-titulo">' +
            textoSeguro(titulo) + '</strong><div class="retiros-popup-campos">' + html + '</div></div>';
        L.popup({
            className: 'popup-retiros-ficha',
            closeButton: true,
            maxWidth: 300,
            minWidth: 150,
            autoPan: true,
            autoPanPaddingTopLeft: [18, 72],
            autoPanPaddingBottomRight: [18, 24]
        }).setLatLng(latlng).setContent(contenido).openOn(map);
    }

    function hacerClicable(feature, layer, titulo) {
        layer.on('click', function(e) {
            ultimoClicDeCapa = { tiempo: Date.now(), latlng: e.latlng };
            mostrarDetalle(titulo, feature.properties, feature, e.latlng);
            if (e && e.originalEvent) L.DomEvent.stopPropagation(e);
        });
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
        var ancho = String(feature.properties && feature.properties.ANCHO || '');
        var color = '#6cd4da';
        if (compatibilidad === 'Con compatibilidad de uso') color = '#d31d13';
        else if (compatibilidad === 'Con compatibilidad de uso * solo obra nueva') color = '#db1e2a';
        return {
            pane: 'pane_retiros_nuevas_lineas',
            color: color,
            weight: ancho.indexOf('5') === 0 ? 2.7 : 1.8,
            opacity: 0.95,
            lineCap: 'round',
            lineJoin: 'round',
            interactive: true
        };
    }

    function crearCapas() {
        if (capaRetirosPoligonos) return;
        indiceClicPoligonos = Object.create(null);
        indexarPoligonos(window.geojsonRetirosLotes, 'Lote', 1);
        indexarPoligonos(window.geojsonRetirosCompatibles, 'Lote compatible', 2);
        indexarPoligonos(window.geojsonRetirosPoligonos, 'Área de retiro', 3);
        Object.keys(indiceClicPoligonos).forEach(function(llave) {
            indiceClicPoligonos[llave].sort(function(a, b) { return b.prioridad - a.prioridad; });
        });
        [
            ['pane_retiros_contexto', 410],
            ['pane_retiros_lotes', 420],
            ['pane_retiros_compatibles', 425],
            ['pane_retiros_nuevos_poligonos', 430],
            ['pane_retiros_nuevas_lineas', 440]
        ].forEach(function(definicion) {
            if (!map.getPane(definicion[0])) {
                map.createPane(definicion[0]);
                map.getPane(definicion[0]).style.zIndex = definicion[1];
                map.getPane(definicion[0]).style.pointerEvents = 'auto';
            }
        });

        function capaPoligonal(datos, pane, estilo, titulo) {
            return L.geoJSON(datos, {
                pane: pane,
                renderer: L.canvas({ pane: pane, padding: 0.2, tolerance: 6 }),
                smoothFactor: 1,
                interactive: true,
                style: estilo,
                onEachFeature: function(feature, layer) { hacerClicable(feature, layer, titulo); }
            });
        }

        capaRetirosContexto = capaPoligonal(window.geojsonRetirosContexto, 'pane_retiros_contexto', {
            color: '#cccccc', weight: 0, fillColor: '#e6e6e6', fillOpacity: 1
        }, 'Área urbana');
        capaRetirosLotes = capaPoligonal(window.geojsonRetirosLotes, 'pane_retiros_lotes', {
            color: 'rgba(197,197,197,0.85)', weight: 0.8, fillColor: '#f2f2f2', fillOpacity: 1
        }, 'Lote');
        capaRetirosCompatibles = capaPoligonal(window.geojsonRetirosCompatibles, 'pane_retiros_compatibles', {
            color: 'rgba(255,255,255,0.82)', weight: 0.8, dashArray: '5 2',
            fillColor: '#3368a0', fillOpacity: 1
        }, 'Lote compatible');

        capaRetirosPoligonos = L.geoJSON(window.geojsonRetirosPoligonos, {
            pane: 'pane_retiros_nuevos_poligonos',
            interactive: true,
            renderer: L.canvas({ pane: 'pane_retiros_nuevos_poligonos', padding: 0.2, tolerance: 6 }),
            smoothFactor: 1,
            style: estiloPoligono,
            onEachFeature: function(feature, layer) {
                hacerClicable(feature, layer, 'Área de retiro');
            }
        });
        function crearLineas(ancho) {
            var features = window.geojsonRetirosLineas.features.filter(function(feature) {
                return String(feature.properties && feature.properties.ANCHO || '').indexOf(ancho) === 0;
            });
            return L.geoJSON({ type: 'FeatureCollection', features: features }, {
                pane: 'pane_retiros_nuevas_lineas',
                interactive: true,
                renderer: L.canvas({ pane: 'pane_retiros_nuevas_lineas', padding: 0.2, tolerance: 7 }),
                smoothFactor: 1,
                style: estiloLinea,
                onEachFeature: function(feature, layer) {
                    hacerClicable(feature, layer, 'Línea de retiro');
                }
            });
        }
        capaRetirosLineas3m = crearLineas('3');
        capaRetirosLineas5m = crearLineas('5');
        window.capaRetirosNormativosPoligonos = capaRetirosPoligonos;
        window.capaRetirosNormativosLineas3m = capaRetirosLineas3m;
        window.capaRetirosNormativosLineas5m = capaRetirosLineas5m;
    }

    function mostrarPanelCapas(mostrar) {
        if (panelCapas) panelCapas.hidden = !mostrar;
    }

    function obtenerCapas() {
        return {
            contexto: capaRetirosContexto,
            lotes: capaRetirosLotes,
            compatibles: capaRetirosCompatibles,
            poligonos: capaRetirosPoligonos,
            lineas3: capaRetirosLineas3m,
            lineas5: capaRetirosLineas5m
        };
    }

    function conectarPanelCapas() {
        if (panelCapas && panelCapasAuxiliares && panelCapas.parentElement !== panelCapasAuxiliares) {
            panelCapasAuxiliares.appendChild(panelCapas);
        }
        if (panelCapas) panelCapas.querySelectorAll('[data-retiro-capa]').forEach(function(input) {
            input.addEventListener('change', function() {
                if (input.dataset.retiroCapa === 'vias') {
                    if (window.establecerVisibilidadVias) window.establecerVisibilidadVias(input.checked);
                    return;
                }
                var capa = obtenerCapas()[input.dataset.retiroCapa];
                if (!capa) return;
                if (input.checked) capa.addTo(map);
                else map.removeLayer(capa);
            });
        });
    }

    conectarPanelCapas();

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
        map.getContainer().classList.remove('retiros-cursor-clicable');
        var sesionActual = ++sesion;
        estadoAnterior = {
            centro: map.getCenter(),
            zoom: map.getZoom(),
            viasVisibles: window.obtenerVisibilidadVias ? window.obtenerVisibilidadVias() : true,
            capas: [window.layer_usos_compatibles_0, window.layer_usos_compatibles_planes,
                window.layer_usos_compatibles_on, window.layer_parques_alineados,
                window.capaRetiros].filter(Boolean).map(function(capa) {
                    return { capa: capa, visible: map.hasLayer(capa) };
                })
        };
        document.body.classList.add('modo-retiros');
        if (cabecera) cabecera.hidden = false;
        mostrarPanelCapas(true);
        if (botonCapasAuxiliares) botonCapasAuxiliares.setAttribute('aria-label', 'Abrir capas de retiros y vías');
        if (botonCapasAuxiliares) botonCapasAuxiliares.innerHTML = '<svg class="icono-capas-retiros" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m12 3 9 4.5-9 4.5-9-4.5L12 3Z"></path><path d="m3 12 9 4.5 9-4.5M3 16.5 12 21l9-4.5"></path></svg>';
        if (tituloPrincipal) tituloPrincipal.textContent = 'Visor de retiros normativos del distrito de San Borja';
        if (subtitulo) subtitulo.textContent = 'Consulta de polígonos y líneas de retiro';
        if (tituloPanelOriginal) tituloPanelOriginal.textContent = 'Información de retiros normativos';
        if (tituloDetalle) tituloDetalle.textContent = 'Selecciona un elemento';
        if (ayudaDetalle) ayudaDetalle.textContent = 'Haz clic en un lote, área o línea del mapa para consultar sus datos.';
        if (detalleRetiros) detalleRetiros.hidden = false;
        if (panelDetalle) {
            panelDetalle.classList.remove('minimizado');
            panelDetalle.classList.add('panel-expandido');
        }
        if (window.cerrarPanelesMapa) window.cerrarPanelesMapa();
        if (window.cerrarPanelDetalle) window.cerrarPanelDetalle();
        ocultarCapasPrincipales();
        if (window.limpiarRetiroResaltado) window.limpiarRetiroResaltado();
        map.closePopup();
        if (estado) { estado.textContent = 'Cargando capas…'; estado.hidden = false; }
        map.invalidateSize({ pan: false });

        cargarDatos().then(function() {
            if (!activo || sesionActual !== sesion) return;
            crearCapas();
            var controles = panelCapas ? panelCapas.querySelectorAll('[data-retiro-capa]') : [];
            Array.prototype.forEach.call(controles, function(input) { input.disabled = false; });
            var viasControl = panelCapas && panelCapas.querySelector('[data-retiro-capa="vias"]');
            if (viasControl && window.establecerVisibilidadVias) window.establecerVisibilidadVias(viasControl.checked);
            var capas = obtenerCapas();
            Array.prototype.forEach.call(controles, function(input) {
                var capa = capas[input.dataset.retiroCapa];
                if (input.checked && capa) capa.addTo(map);
            });
            var limites = capaRetirosContexto.getBounds();
            [capaRetirosLotes, capaRetirosCompatibles, capaRetirosPoligonos,
                capaRetirosLineas3m, capaRetirosLineas5m].forEach(function(capa) {
                if (capa.getBounds().isValid()) limites.extend(capa.getBounds());
            });
            if (limites.isValid()) map.fitBounds(limites, { paddingTopLeft: [34, 34], paddingBottomRight: [panelCapas && !panelCapas.hidden ? 360 : 34, 34], maxZoom: 17, animate: false });
            if (estado) { estado.textContent = ''; estado.hidden = true; }
        }).catch(function(error) {
            if (sesionActual !== sesion) return;
            console.error('No se pudieron cargar las capas de retiros.', error);
            if (estado) { estado.textContent = 'No se pudieron cargar las capas. Vuelve a intentarlo.'; estado.hidden = false; }
            activo = false;
        });
    }

    function salir() {
        if (!activo && !document.body.classList.contains('modo-retiros')) return;
        activo = false;
        map.getContainer().classList.remove('retiros-cursor-clicable');
        sesion += 1;
        document.body.classList.remove('modo-retiros');
        if (cabecera) cabecera.hidden = true;
        mostrarPanelCapas(false);
        if (botonCapasAuxiliares) botonCapasAuxiliares.setAttribute('aria-label', etiquetaBotonCapasOriginal || 'Abrir capas adicionales');
        if (botonCapasAuxiliares) botonCapasAuxiliares.innerHTML = contenidoBotonCapasOriginal;
        [capaRetirosContexto, capaRetirosLotes, capaRetirosCompatibles,
            capaRetirosPoligonos, capaRetirosLineas3m, capaRetirosLineas5m].forEach(function(capa) {
            if (capa) map.removeLayer(capa);
        });
        var viasVisiblesAntes = estadoAnterior ? estadoAnterior.viasVisibles : true;
        restaurarCapasPrincipales();
        if (window.establecerVisibilidadVias) window.establecerVisibilidadVias(viasVisiblesAntes);
        if (tituloPrincipal) tituloPrincipal.textContent = tituloOriginal;
        if (subtitulo) subtitulo.textContent = subtituloOriginal;
        if (tituloPanelOriginal) tituloPanelOriginal.textContent = tituloPanelTextoOriginal;
        if (tituloDetalle) tituloDetalle.textContent = 'Seleccione un polígono';
        if (ayudaDetalle) ayudaDetalle.textContent = 'Haz clic en un lote del mapa para consultar usos compatibles.';
        if (detalleRetiros) detalleRetiros.hidden = true;
        if (panelDetalle) {
            panelDetalle.classList.add('minimizado');
            panelDetalle.classList.remove('panel-expandido');
        }
        if (estado) { estado.textContent = ''; estado.hidden = true; }
        map.closePopup();
        map.invalidateSize({ pan: false });
    }

    window.visorRetiros = { entrar: entrar, salir: salir };
})();
