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

        // --- LÓGICA DEL LOTE Y EL POPUP ---
        function pop_usos_compatibles_0(feature, layer) {
            var miZona = feature.properties['USOS_COMPA'] || '';
            if (miZona === 'Usos Específicos' || miZona === 'Otros Usos') miZona = 'Usos Específicos - Otros Usos';

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
                if (window.categoriaUsoVisible && !window.categoriaUsoVisible(feature.properties['USOS_COMPA'])) {
                    map.closePopup();
                    if (L.DomEvent) L.DomEvent.stop(e);
                    return;
                }
                resaltarLote(feature);
                if(window.actualizarLista) window.actualizarLista(miZona, zonVig, zreUsocom, feature.properties || {});
            });
        }

        var pattern_usos_compatibles_0_0 = new L.StripePattern({ weight: 0.45, spaceWeight: 1.0, color: '#000000', opacity: 1.0, spaceOpacity: 0, angle: 315 });
        pattern_usos_compatibles_0_0.addTo(map);
        function style_usos_compatibles_0_0(feature) {
            switch(String(feature.properties['USOS_COMPA'])) {
                case 'Uso Mixto Especializado': return { pane: 'pane_usos_compatibles_0', opacity: 1, color: 'rgba(35,35,35,0.81)', weight: 1.0, fill: true, fillOpacity: 1, fillColor: 'rgba(122,4,3,1.0)', interactive: true, }
                case 'Uso Mixto Intensivo': return { pane: 'pane_usos_compatibles_0', opacity: 1, color: 'rgba(35,35,35,0.81)', weight: 1.0, fill: true, fillOpacity: 1, fillColor: 'rgba(183,32,32,1.0)', interactive: true, }
                case 'Uso Mixto Metropolitano': return { pane: 'pane_usos_compatibles_0', opacity: 1, color: 'rgba(35,35,35,0.81)', weight: 1.0, fill: true, fillOpacity: 1, fillColor: 'rgba(155,88,71,1.0)', interactive: true, }
                case 'Uso Mixto Zonal': return { pane: 'pane_usos_compatibles_0', opacity: 1, color: 'rgba(35,35,35,0.81)', weight: 1.0, fill: true, fillOpacity: 1, fillColor: 'rgba(244,122,122,1.0)', interactive: true, }
                case 'Uso Mixto Vecinal': return { pane: 'pane_usos_compatibles_0', opacity: 1, color: 'rgba(35,35,35,0.81)', weight: 1.0, fill: true, fillOpacity: 1, fillColor: 'rgba(242,113,68,1.0)', interactive: true, }
                case 'Uso Residencial Preferente': return { pane: 'pane_usos_compatibles_0', opacity: 1, color: 'rgba(35,35,35,0.81)', weight: 1.0, fill: true, fillOpacity: 1, fillColor: 'rgba(244,198,68,1.0)', interactive: true, }
                case 'Uso Residencial Especial': return { pane: 'pane_usos_compatibles_0', opacity: 1, color: 'rgba(35,35,35,0.81)', weight: 1.0, fill: true, fillOpacity: 1, fillColor: 'rgba(254,172,0,1.0)', interactive: true, }
                case 'Uso Residencial Exclusivo': return { pane: 'pane_usos_compatibles_0', opacity: 1, color: 'rgba(35,35,35,0.81)', weight: 1.0, fill: true, fillOpacity: 1, fillColor: 'rgba(244,244,244,1.0)', interactive: true, }
                case 'Planes Especiales': return { pane: 'pane_usos_compatibles_0', opacity: 1, color: 'rgba(35,35,35,0.81)', weight: 1.5, fill: true, fillOpacity: 1, fillPattern: pattern_usos_compatibles_0_0, interactive: true, }
                case 'Usos Específicos': return { pane: 'pane_usos_compatibles_0', opacity: 1, color: 'rgba(35,35,35,0.81)', weight: 1.0, fill: true, fillOpacity: 1, fillColor: 'rgba(129,129,129,1.0)', interactive: true, }
                case 'Uso de Recreación Pública': return { pane: 'pane_usos_compatibles_0', opacity: 1, color: 'rgba(35,35,35,0.81)', weight: 1.0, fill: true, fillOpacity: 1, fillColor: 'rgba(164,205,163,1.0)', interactive: true, }
                default: return { pane: 'pane_usos_compatibles_0', opacity: 1, color: 'rgba(35,35,35,0.81)', weight: 1.0, fill: true, fillOpacity: 1, fillColor: 'rgba(129,129,129,1.0)', interactive: true, }
            }
        }

        map.createPane('pane_usos_compatibles_0'); map.getPane('pane_usos_compatibles_0').style.zIndex = 400; map.getPane('pane_usos_compatibles_0').style['mix-blend-mode'] = 'normal';
        var rendererLotesCanvas = L.canvas({ pane: 'pane_usos_compatibles_0', padding: 0.35, tolerance: 6 });
        var layer_usos_compatibles_0 = new L.geoJson(json_usos_compatibles_1, {
            attribution: '',
            interactive: true,
            dataVar: 'json_usos_compatibles_1',
            layerName: 'layer_usos_compatibles_0',
            pane: 'pane_usos_compatibles_0',
            renderer: rendererLotesCanvas,
            filter: function(feature) {
                return String(feature.properties['USOS_COMPA']) !== 'Planes Especiales';
            },
            onEachFeature: pop_usos_compatibles_0,
            style: style_usos_compatibles_0_0,
        });
        window.layer_usos_compatibles_0 = layer_usos_compatibles_0;
        bounds_group.addLayer(layer_usos_compatibles_0); map.addLayer(layer_usos_compatibles_0);

        var layer_usos_compatibles_planes = new L.geoJson(json_usos_compatibles_1, {
            attribution: '',
            interactive: true,
            dataVar: 'json_usos_compatibles_1',
            layerName: 'layer_usos_compatibles_planes',
            pane: 'pane_usos_compatibles_0',
            filter: function(feature) {
                return String(feature.properties['USOS_COMPA']) === 'Planes Especiales';
            },
            onEachFeature: pop_usos_compatibles_0,
            style: style_usos_compatibles_0_0,
        });
        window.layer_usos_compatibles_planes = layer_usos_compatibles_planes;
        bounds_group.addLayer(layer_usos_compatibles_planes); map.addLayer(layer_usos_compatibles_planes);

        function style_retiros_con_codigos_0() {
            return {
                pane: 'pane_retiros_con_codigos',
                opacity: 1,
                color: 'rgba(247,247,247,1.0)',
                weight: 1.0,
                fill: true,
                fillOpacity: 0.78,
                fillColor: 'rgba(150,150,150,1.0)',
                interactive: true
            };
        }

        function seleccionarRetiroConCodigo(feature, layer) {
            var props = feature.properties || {};
            var codigo = String(props['CÓDIGO_RE'] || props['CÃ“DIGO_RE'] || props['CODIGO_RE'] || '').trim();
            var area = props['AREA'];
            var areaTexto = isFinite(Number(area)) ? Number(area).toLocaleString('es-PE', { maximumFractionDigits: 2 }) + ' m²' : 'No especificada';
            var contenidoPopup = '<strong>Retiro</strong>' +
                (codigo ? '<br><span>Código: ' + codigo + '</span>' : '') +
                '<br><span>Área: ' + areaTexto + '</span>';

            layer.bindPopup(contenidoPopup, {
                className: 'popup-limpio',
                closeButton: false,
                autoPanPaddingBottomRight: [10, window.innerWidth <= 896 ? (window.innerHeight * 0.55) : 50],
                autoPanPaddingTopLeft: [10, 50]
            });

            layer.on('click', function(e) {
                resaltarLote(feature);
                if (window.actualizarDetalleRetiro) window.actualizarDetalleRetiro(feature.properties || {});
                layer.openPopup(e.latlng);
                if (L.DomEvent) L.DomEvent.stop(e);
            });
        }

        if (typeof json_Polgono_retiros_concdigos_2 !== 'undefined') {
            map.createPane('pane_retiros_con_codigos');
            map.getPane('pane_retiros_con_codigos').style.zIndex = 430;

            var rendererRetirosSvg = L.svg({ pane: 'pane_retiros_con_codigos', padding: 0.35 });
            var layer_retiros_con_codigos = new L.geoJson(json_Polgono_retiros_concdigos_2, {
                pane: 'pane_retiros_con_codigos',
                renderer: rendererRetirosSvg,
                interactive: true,
                onEachFeature: seleccionarRetiroConCodigo,
                style: style_retiros_con_codigos_0
            });
            window.layer_retiros_con_codigos = layer_retiros_con_codigos;
            window.actualizarVisibilidadRetiros = function(visible) {
                if (visible) {
                    if (!map.hasLayer(layer_retiros_con_codigos)) map.addLayer(layer_retiros_con_codigos);
                } else {
                    if (map.hasLayer(layer_retiros_con_codigos)) map.removeLayer(layer_retiros_con_codigos);
                    if (window.capaLoteResaltado) {
                        map.removeLayer(window.capaLoteResaltado);
                        window.capaLoteResaltado = null;
                    }
                    map.closePopup();
                }
            };
            bounds_group.addLayer(layer_retiros_con_codigos);
            map.addLayer(layer_retiros_con_codigos);
        }

        map.createPane('pane_Bordes_1'); map.getPane('pane_Bordes_1').style.zIndex = 460; map.getPane('pane_Bordes_1').style.pointerEvents = 'none';
        var rendererBordesCanvas = L.canvas({ pane: 'pane_Bordes_1', padding: 0.35 });
        var layer_Bordes_1 = new L.geoJson(json_Bordes_2, {
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
