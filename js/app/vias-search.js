        // Datos cargados via <script> tags (sin fetch, compatible con file://)
        console.log('Datos cargados — Usos:', datosUsos.length, '| Actividades:', datosActividades.length, '| ZRE:', datosActividadesZRE.length);
        let capaViasEtiquetas = null;
        let temporizadorViasEtiquetas = null;
        let rendererViasEtiquetas = null;
        cargarVias();

        function cargarVias() {
            (function() { var jsonVias = json_vias;
                datosVias = jsonVias.features;
                map.createPane('pane_vias_lineas'); map.getPane('pane_vias_lineas').style.zIndex = 350;
                rendererViasEtiquetas = L.svg({ pane: 'pane_vias_lineas', padding: 0.1 });
                programarActualizacionEtiquetasVias(60);
            })();
        }

        function clasePorNivelVia(nivel) {
            nivel = String(nivel || '').toUpperCase();
            if (nivel.includes('EXPRESA')) return 'etiqueta-expresa';
            if (nivel.includes('ARTERIAL')) return 'etiqueta-arterial';
            if (nivel.includes('COLECTORA')) return 'etiqueta-colectora';
            return 'etiqueta-local';
        }

        function viaVisiblePorZoom(nivel, zoom) {
            nivel = String(nivel || '').toUpperCase();
            if (nivel.includes('EXPRESA')) return zoom >= 14;
            if (nivel.includes('ARTERIAL')) return zoom >= 15;
            if (nivel.includes('COLECTORA')) return zoom >= 16;
            return zoom >= 17;
        }

        function coordenadaDentroDeVista(coords, bounds) {
            if (!coords) return false;
            if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
                return bounds.contains([coords[1], coords[0]]);
            }
            return coords.some(function(parte) {
                return coordenadaDentroDeVista(parte, bounds);
            });
        }

        function construirEtiquetasVias() {
            if (capaViasEtiquetas) {
                map.removeLayer(capaViasEtiquetas);
                capaViasEtiquetas = null;
            }

            var zoom = map.getZoom();
            if (zoom < 14) return;

            var boundsVisibles = map.getBounds().pad(0.25);
            var featuresVisibles = datosVias.filter(function(feature) {
                var props = feature.properties || {};
                return props.NOMBRECOMP &&
                    viaVisiblePorZoom(props.NIVEL, zoom) &&
                    feature.geometry &&
                    coordenadaDentroDeVista(feature.geometry.coordinates, boundsVisibles);
            });

            if (featuresVisibles.length === 0) return;

            capaViasEtiquetas = L.geoJson({ type: 'FeatureCollection', features: featuresVisibles }, {
                pane: 'pane_vias_lineas',
                renderer: rendererViasEtiquetas,
                style: { color: '#ffffff', weight: 1.5, opacity: 0.25, interactive: false },
                interactive: false,
                onEachFeature: function(feature, layer) {
                    if (feature.properties && feature.properties['NOMBRECOMP']) {
                        var nombre = String(feature.properties['NOMBRECOMP']).trim();
                        var claseNivel = clasePorNivelVia(feature.properties['NIVEL']);

                        try {
                            var latlngs = layer.getLatLngs();
                            function enderezar(seg) {
                                if (!seg || seg.length === 0) return seg;
                                if (Array.isArray(seg[0])) return seg.map(enderezar);
                                var p1 = seg[0], p2 = seg[seg.length - 1];
                                if (p1.lng > p2.lng || (Math.abs(p1.lng - p2.lng) < 0.00001 && p1.lat > p2.lat)) return seg.slice().reverse();
                                return seg;
                            }
                            layer.setLatLngs(enderezar(latlngs));

                            if (layer.setText) layer.setText(nombre, { center: true, offset: 6, attributes: { 'class': 'etiqueta-via-curva ' + claseNivel } });
                            else if (layer.eachLayer) layer.eachLayer(sub => { if (sub.setText) sub.setText(nombre, { center: true, offset: 6, attributes: { 'class': 'etiqueta-via-curva ' + claseNivel } }); });
                        } catch(e) {}
                    }
                }
            }).addTo(map);
        }

        function programarActualizacionEtiquetasVias(espera) {
            clearTimeout(temporizadorViasEtiquetas);
            temporizadorViasEtiquetas = setTimeout(construirEtiquetasVias, espera || 120);
        }

        map.on('movestart zoomstart', function() {
            document.body.classList.add('mapa-en-movimiento');
            clearTimeout(temporizadorViasEtiquetas);
            if (capaViasEtiquetas) {
                map.removeLayer(capaViasEtiquetas);
                capaViasEtiquetas = null;
            }
        });

        map.on('moveend zoomend', function() {
            document.body.classList.remove('mapa-en-movimiento');
            programarActualizacionEtiquetasVias(100);
        });

        const contenedorBuscadorVias = document.getElementById('buscador-vias-container');
        const botonBuscadorVias = document.getElementById('boton-buscar-vias');
        const inputBuscadorVias = document.getElementById('buscador-vias'), sugerenciasVias = document.getElementById('sugerencias-vias');
        let ultimoResultadoVias = {};

        function abrirBuscadorVias() {
            contenedorBuscadorVias.classList.add('buscador-abierto');
            contenedorBuscadorVias.classList.remove('buscador-cerrado');
            if (botonBuscadorVias) botonBuscadorVias.setAttribute('aria-expanded', 'true');
        }

        function cerrarBuscadorViasSiVacio() {
            if (inputBuscadorVias.value.trim()) return;
            contenedorBuscadorVias.classList.add('buscador-cerrado');
            contenedorBuscadorVias.classList.remove('buscador-abierto');
            sugerenciasVias.style.display = 'none';
            if (botonBuscadorVias) botonBuscadorVias.setAttribute('aria-expanded', 'false');
        }

        if (botonBuscadorVias) {
            botonBuscadorVias.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                abrirBuscadorVias();
                inputBuscadorVias.focus();
            });
        }

        inputBuscadorVias.addEventListener('focus', abrirBuscadorVias);

        function agruparViasPorTexto(texto) {
            const agrup = {};
            datosVias.forEach(f => {
                if (f.properties && f.properties['NOMBRECOMP']) {
                    const n = String(f.properties['NOMBRECOMP']);
                    if (estandarizarTexto(n).includes(texto)) {
                        if(!agrup[n]) agrup[n] = [];
                        agrup[n].push(f);
                    }
                }
            });
            return agrup;
        }

        function seleccionarVia(nombre, segmentos) {
            enfocarVia(segmentos);
            inputBuscadorVias.value = nombre;
            sugerenciasVias.style.display = 'none';

            panel.classList.add('minimizado');
            document.body.classList.remove('panel-abierto');
        }

        function ejecutarBusquedaActual() {
            const textoOriginal = inputBuscadorVias.value.trim();
            const texto = estandarizarTexto(textoOriginal);
            if (texto.length < 2) return;

            const resultados = Object.keys(ultimoResultadoVias).length > 0 ? ultimoResultadoVias : agruparViasPorTexto(texto);
            const nombres = Object.keys(resultados);
            if (nombres.length === 0) return;

            const nombreExacto = nombres.find(n => estandarizarTexto(n) === texto);
            const nombreElegido = nombreExacto || nombres[0];
            seleccionarVia(nombreElegido, resultados[nombreElegido]);
        }

        inputBuscadorVias.addEventListener('input', function() {
            const txt = estandarizarTexto(this.value); sugerenciasVias.innerHTML = '';
            ultimoResultadoVias = {};
            if (txt.length < 2) { sugerenciasVias.style.display = 'none'; return; }
            const agrup = agruparViasPorTexto(txt);
            ultimoResultadoVias = agrup;
            const res = Object.keys(agrup).slice(0, 5);
            if (res.length > 0) {
                sugerenciasVias.style.display = 'block';
                res.forEach(n => {
                    let div = document.createElement('div'); div.className = 'sugerencia-item'; div.innerHTML = `<i class="fas fa-map-marker-alt" style="color:#00bcd4; margin-right:8px;"></i> ${n}`;
                    div.onclick = () => {
                        seleccionarVia(n, agrup[n]);
                    };
                    sugerenciasVias.appendChild(div);
                });
            } else { sugerenciasVias.style.display = 'none'; }
        });

        inputBuscadorVias.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                ejecutarBusquedaActual();
            } else if (e.key === 'Escape') {
                inputBuscadorVias.value = '';
                ultimoResultadoVias = {};
                cerrarBuscadorViasSiVacio();
            }
        });

        document.addEventListener('click', e => {
            if (!contenedorBuscadorVias.contains(e.target)) {
                sugerenciasVias.style.display = 'none';
                cerrarBuscadorViasSiVacio();
            }
        });

        function enfocarVia(segmentos) {
            if (capaResaltadoVia) map.removeLayer(capaResaltadoVia);
            capaResaltadoVia = L.geoJson({ type: "FeatureCollection", features: segmentos }, { style: { className: 'via-resaltada-animacion' } }).addTo(map);
            map.flyToBounds(capaResaltadoVia.getBounds(), {
                padding: [50, 50],
                maxZoom: 18,
                duration: 1.6,
                easeLinearity: 0.2
            });
        }
