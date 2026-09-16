// --- SISTEMA DE RESALTADO ---
        function resaltarLote(feature) {
            if (capaLoteResaltado) map.removeLayer(capaLoteResaltado);
            window.capaLoteResaltado = null;
            if (!map.getPane('pane_lote_resaltado')) {
                map.createPane('pane_lote_resaltado');
                map.getPane('pane_lote_resaltado').style.zIndex = 650;
                map.getPane('pane_lote_resaltado').style.pointerEvents = 'none';
            }
            capaLoteResaltado = L.geoJson(feature, {
                pane: 'pane_lote_resaltado',
                style: {
                    color: '#00D9FF',
                    weight: 5,
                    opacity: 1,
                    dashArray: '9 6',
                    lineCap: 'round',
                    lineJoin: 'round',
                    fill: true,
                    fillOpacity: 0.22,
                    fillColor: '#00D9FF',
                    className: 'lote-resaltado-animacion'
                },
                interactive: false
            }).addTo(map);
            window.capaLoteResaltado = capaLoteResaltado;
            if (capaLoteResaltado.bringToFront) capaLoteResaltado.bringToFront();
        }

        function enfocarSeleccion(layer) {
            if (!layer || !layer.getBounds) return;
            var limites = layer.getBounds();
            if (!limites || !limites.isValid()) return;

            var esMovil = window.innerWidth <= 896;
            if (esMovil) map.closePopup();

            window.setTimeout(function() {
                if (!esMovil) {
                    var panelDetalle = document.getElementById('panel-usos');
                    var anchoPanel = panelDetalle && !panelDetalle.classList.contains('minimizado')
                        ? Math.round(panelDetalle.getBoundingClientRect().width)
                        : 0;

                    map.flyToBounds(limites, {
                        paddingTopLeft: [24, 64],
                        paddingBottomRight: [anchoPanel + 24, 24],
                        maxZoom: 20,
                        animate: true,
                        duration: 0.45
                    });
                    return;
                }

                map.flyToBounds(limites, {
                    paddingTopLeft: [18, 82],
                    paddingBottomRight: [18, Math.round(window.innerHeight * 0.58)],
                    maxZoom: 20,
                    animate: true,
                    duration: 0.45
                });
            }, 40);
        }

        // --- LÓGICA DEL LOTE Y EL POPUP ---
        function pop_usos_compatibles_0(feature, layer) {
            var miZona = feature.properties['USOS_COMPA'] || '';
            if (miZona === 'Usos Específicos' || miZona === 'Otros Usos') miZona = 'Usos Específicos - Otros Usos';
            if (window.normalizarCategoriaUso) miZona = window.normalizarCategoriaUso(miZona);

            var zonVig     = feature.properties['ZON_VIG']     || '';
            var zreUsocom  = feature.properties['ZRE_USOCOM']  || '';

            // Calculamos el espacio para que en celular el popup no quede tapado por el panel
            var paddingAbajo = window.innerWidth <= 896 ? (window.innerHeight * 0.55) : 50;

            layer.bindPopup(miZona, {
                className: 'popup-limpio',
                closeButton: false,
                autoPanPaddingBottomRight: [10, paddingAbajo],
                autoPanPaddingTopLeft: [10, 50]
            });

            layer.on('click', function(e) {
                if ((window.categoriaUsoVisible && !window.categoriaUsoVisible(feature.properties['USOS_COMPA'])) ||
                    (window.zonaZreVisible && !window.zonaZreVisible(feature))) {
                    map.closePopup();
                    if (L.DomEvent) L.DomEvent.stop(e);
                    return;
                }
                resaltarLote(feature);
                if(window.actualizarLista) window.actualizarLista(miZona, zonVig, zreUsocom, feature.properties || {});
                enfocarSeleccion(layer);
            });
        }

        map.createPane('pane_usos_compatibles_0');
        map.getPane('pane_usos_compatibles_0').style.zIndex = 400;
        map.getPane('pane_usos_compatibles_0').style['mix-blend-mode'] = 'normal';
        map.createPane('pane_tramado_planes_especiales');
        map.getPane('pane_tramado_planes_especiales').style.zIndex = 401;
        map.getPane('pane_tramado_planes_especiales').style['mix-blend-mode'] = 'normal';

        // El tramado vive en un SVG independiente, encima de la capa que
        // conserva el color y los bordes originales de cada poligono.
        var rendererPlanesEspecialesSvg = L.svg({ pane: 'pane_tramado_planes_especiales', padding: 0.35 });
        var pattern_usos_compatibles_0_0 = new L.StripePattern({
            pane: 'pane_tramado_planes_especiales',
            renderer: rendererPlanesEspecialesSvg,
            weight: 0.45,
            spaceWeight: 1.0,
            color: '#000000',
            opacity: 1.0,
            spaceOpacity: 0,
            angle: 315
        });
        pattern_usos_compatibles_0_0.addTo(map);
        function style_usos_compatibles_0_0(feature) {
            var categoriaEstilo = window.normalizarCategoriaUso
                ? window.normalizarCategoriaUso(feature.properties['USOS_COMPA'])
                : String(feature.properties['USOS_COMPA']);
            switch(categoriaEstilo) {
                case 'Uso Mixto Especializado': return { pane: 'pane_usos_compatibles_0', opacity: 1, color: 'rgba(35,35,35,0.81)', weight: 1.0, fill: true, fillOpacity: 1, fillColor: 'rgba(122,4,3,1.0)', interactive: true, }
                case 'Uso Mixto Intensivo': return { pane: 'pane_usos_compatibles_0', opacity: 1, color: 'rgba(35,35,35,0.81)', weight: 1.0, fill: true, fillOpacity: 1, fillColor: 'rgba(183,32,32,1.0)', interactive: true, }
                case 'Uso Mixto Metropolitano': return { pane: 'pane_usos_compatibles_0', opacity: 1, color: 'rgba(35,35,35,0.81)', weight: 1.0, fill: true, fillOpacity: 1, fillColor: 'rgba(155,88,71,1.0)', interactive: true, }
                case 'Uso Mixto Zonal': return { pane: 'pane_usos_compatibles_0', opacity: 1, color: 'rgba(35,35,35,0.81)', weight: 1.0, fill: true, fillOpacity: 1, fillColor: 'rgba(244,122,122,1.0)', interactive: true, }
                case 'Uso Mixto Vecinal': return { pane: 'pane_usos_compatibles_0', opacity: 1, color: 'rgba(35,35,35,0.81)', weight: 1.0, fill: true, fillOpacity: 1, fillColor: 'rgba(242,113,68,1.0)', interactive: true, }
                case 'Uso Residencial Preferente': return { pane: 'pane_usos_compatibles_0', opacity: 1, color: 'rgba(35,35,35,0.81)', weight: 1.0, fill: true, fillOpacity: 1, fillColor: 'rgba(244,198,68,1.0)', interactive: true, }
                case 'Uso Residencial Especial': return { pane: 'pane_usos_compatibles_0', opacity: 1, color: 'rgba(35,35,35,0.81)', weight: 1.0, fill: true, fillOpacity: 1, fillColor: 'rgba(254,172,0,1.0)', interactive: true, }
                case 'Uso Residencial Exclusivo': return { pane: 'pane_usos_compatibles_0', opacity: 1, color: 'rgba(35,35,35,0.81)', weight: 1.0, fill: true, fillOpacity: 1, fillColor: 'rgba(244,244,244,1.0)', interactive: true, }
                case 'Planes Especiales': return { pane: 'pane_usos_compatibles_0', opacity: 1, color: 'rgba(35,35,35,0.81)', weight: 1.0, fill: true, fillOpacity: 1, fillColor: 'rgba(244,244,244,1.0)', interactive: true, }
                case 'Planes Especiales - Uso Mixto Zonal': return { pane: 'pane_usos_compatibles_0', opacity: 1, color: 'rgba(35,35,35,0.81)', weight: 1.0, fill: true, fillOpacity: 1, fillColor: 'rgba(244,122,122,1.0)', interactive: true, }
                case 'Planes Especiales - Uso Mixto Vecinal': return { pane: 'pane_usos_compatibles_0', opacity: 1, color: 'rgba(35,35,35,0.81)', weight: 1.0, fill: true, fillOpacity: 1, fillColor: 'rgba(242,113,68,1.0)', interactive: true, }
                case 'Usos Específicos': return { pane: 'pane_usos_compatibles_0', opacity: 1, color: 'rgba(35,35,35,0.81)', weight: 1.0, fill: true, fillOpacity: 1, fillColor: 'rgba(129,129,129,1.0)', interactive: true, }
                case 'Usos Específicos - Otros Usos': return { pane: 'pane_usos_compatibles_0', opacity: 1, color: 'rgba(35,35,35,0.81)', weight: 1.0, fill: true, fillOpacity: 1, fillColor: 'rgba(129,129,129,1.0)', interactive: true, }
                case 'Usos Específicos - Educación': return { pane: 'pane_usos_compatibles_0', opacity: 1, color: 'rgba(35,35,35,0.81)', weight: 1.0, fill: true, fillOpacity: 1, fillColor: 'rgba(129,129,129,1.0)', interactive: true, }
                case 'Usos Específicos - Hospital': return { pane: 'pane_usos_compatibles_0', opacity: 1, color: 'rgba(35,35,35,0.81)', weight: 1.0, fill: true, fillOpacity: 1, fillColor: 'rgba(129,129,129,1.0)', interactive: true, }
                case 'Uso de Recreación Pública': return { pane: 'pane_usos_compatibles_0', opacity: 1, color: 'rgba(35,35,35,0.81)', weight: 1.0, fill: true, fillOpacity: 1, fillColor: 'rgba(164,205,163,1.0)', interactive: true, }
                default: return { pane: 'pane_usos_compatibles_0', opacity: 1, color: 'rgba(35,35,35,0.81)', weight: 1.0, fill: true, fillOpacity: 1, fillColor: 'rgba(129,129,129,1.0)', interactive: true, }
            }
        }

        function esPlanEspecialRayado(feature) {
            var categoria = window.normalizarCategoriaUso
                ? window.normalizarCategoriaUso(feature.properties['USOS_COMPA'])
                : String(feature.properties['USOS_COMPA']);
            return categoria.indexOf('Planes Especiales') === 0;
        }

        function style_tramado_planes_especiales() {
            return {
                pane: 'pane_tramado_planes_especiales',
                stroke: false,
                fill: true,
                fillOpacity: 1,
                fillPattern: pattern_usos_compatibles_0_0,
                interactive: true
            };
        }

        var rendererLotesCanvas = L.canvas({ pane: 'pane_usos_compatibles_0', padding: 0.35, tolerance: 6 });
        var layer_usos_compatibles_0 = new L.geoJson(json_usos_compatibles_0, {
            attribution: '',
            interactive: true,
            dataVar: 'json_usos_compatibles_0',
            layerName: 'layer_usos_compatibles_0',
            pane: 'pane_usos_compatibles_0',
            renderer: rendererLotesCanvas,
            onEachFeature: pop_usos_compatibles_0,
            style: style_usos_compatibles_0_0,
        });
        window.layer_usos_compatibles_0 = layer_usos_compatibles_0;
        bounds_group.addLayer(layer_usos_compatibles_0); map.addLayer(layer_usos_compatibles_0);

        var layer_usos_compatibles_planes = new L.geoJson(json_usos_compatibles_0, {
            attribution: '',
            interactive: true,
            dataVar: 'json_usos_compatibles_0',
            layerName: 'layer_usos_compatibles_planes',
            pane: 'pane_tramado_planes_especiales',
            renderer: rendererPlanesEspecialesSvg,
            filter: esPlanEspecialRayado,
            onEachFeature: pop_usos_compatibles_0,
            style: style_tramado_planes_especiales,
        });
        window.layer_usos_compatibles_planes = layer_usos_compatibles_planes;
        bounds_group.addLayer(layer_usos_compatibles_planes); map.addLayer(layer_usos_compatibles_planes);

        map.createPane('pane_Bordes_1'); map.getPane('pane_Bordes_1').style.zIndex = 460; map.getPane('pane_Bordes_1').style.pointerEvents = 'none';
        var rendererBordesCanvas = L.canvas({ pane: 'pane_Bordes_1', padding: 0.35 });
        var layer_Bordes_1 = new L.geoJson(json_Bordes_1, {
            pane: 'pane_Bordes_1',
            renderer: rendererBordesCanvas,
            interactive: false,
            style: {
                color: 'rgba(0,0,0,1.0)',
                weight: 2.0,
                fill: false,
                fillOpacity: 0
            }
        });
        window.layer_Bordes_1 = layer_Bordes_1;
        window.actualizarVisibilidadBordes = function(visible) {
            if (visible) {
                if (!map.hasLayer(layer_Bordes_1)) map.addLayer(layer_Bordes_1);
            } else if (map.hasLayer(layer_Bordes_1)) {
                map.removeLayer(layer_Bordes_1);
            }
        };
        map.addLayer(layer_Bordes_1);
