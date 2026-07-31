// --- SISTEMA DE RESALTADO ---
        function resaltarLote(feature) {
            if (capaLoteResaltado) map.removeLayer(capaLoteResaltado);
            capaLoteResaltado = L.geoJson(feature, {
                style: { color: '#00E5FF', weight: 4, fillOpacity: 0.3, fillColor: '#00E5FF', className: 'lote-resaltado-animacion' },
                interactive: false
            }).addTo(map);
        }

        // --- LÃ“GICA DEL LOTE Y EL POPUP ---
        function pop_usos_compatibles_0(feature, layer) {
            var miZona = feature.properties['USOS_COMPA'] || '';
            if (miZona === 'Usos EspecÃ­ficos' || miZona === 'Otros Usos') miZona = 'Usos EspecÃ­ficos - Otros Usos';
            
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
                resaltarLote(feature);
                if(window.actualizarLista) window.actualizarLista(miZona, zonVig, zreUsocom);
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
                case 'Usos EspecÃ­ficos': return { pane: 'pane_usos_compatibles_0', opacity: 1, color: 'rgba(35,35,35,0.81)', weight: 1.0, fill: true, fillOpacity: 1, fillColor: 'rgba(129,129,129,1.0)', interactive: true, }
                case 'Uso de RecreaciÃ³n PÃºblica': return { pane: 'pane_usos_compatibles_0', opacity: 1, color: 'rgba(35,35,35,0.81)', weight: 1.0, fill: true, fillOpacity: 1, fillColor: 'rgba(164,205,163,1.0)', interactive: true, }
                default: return { pane: 'pane_usos_compatibles_0', opacity: 1, color: 'rgba(35,35,35,0.81)', weight: 1.0, fill: true, fillOpacity: 1, fillColor: 'rgba(129,129,129,1.0)', interactive: true, }
            }
        }
        
        map.createPane('pane_usos_compatibles_0'); map.getPane('pane_usos_compatibles_0').style.zIndex = 400; map.getPane('pane_usos_compatibles_0').style['mix-blend-mode'] = 'normal';
        var layer_usos_compatibles_0 = new L.geoJson(json_usos_compatibles_1, { attribution: '', interactive: true, dataVar: 'json_usos_compatibles_1', layerName: 'layer_usos_compatibles_0', pane: 'pane_usos_compatibles_0', onEachFeature: pop_usos_compatibles_0, style: style_usos_compatibles_0_0, });
        bounds_group.addLayer(layer_usos_compatibles_0); map.addLayer(layer_usos_compatibles_0);
        
        map.createPane('pane_Bordes_1'); map.getPane('pane_Bordes_1').style.zIndex = 401;
        var layer_Bordes_1 = new L.geoJson(json_Bordes_2, { pane: 'pane_Bordes_1', style: { color: 'rgba(0,0,0,1.0)', weight: 2.0, fillOpacity: 0, interactive: false } });
        map.addLayer(layer_Bordes_1);

