        // Datos cargados via <script> tags (sin fetch, compatible con file://)
        console.log('Datos cargados â€” Usos:', datosUsos.length, '| Actividades:', datosActividades.length, '| ZRE:', datosActividadesZRE.length);
        cargarVias();

        function cargarVias() {
            (function() { var jsonVias = json_vias;
                datosVias = jsonVias.features; 
                map.createPane('pane_vias_lineas'); map.getPane('pane_vias_lineas').style.zIndex = 350; 

                L.geoJson(jsonVias, {
                    pane: 'pane_vias_lineas', style: { color: '#ffffff', weight: 1.5, opacity: 0.25, interactive: false },
                    onEachFeature: function(feature, layer) {
                        if (feature.properties && feature.properties['NOMBRECOMP']) {
                            var nombre = String(feature.properties['NOMBRECOMP']).trim();
                            var nivel = String(feature.properties['NIVEL'] || '').toUpperCase();
                            var claseNivel = nivel.includes('EXPRESA') ? 'etiqueta-expresa' : nivel.includes('ARTERIAL') ? 'etiqueta-arterial' : nivel.includes('COLECTORA') ? 'etiqueta-colectora' : 'etiqueta-local';

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
            })();
        }

        const inputBuscadorVias = document.getElementById('buscador-vias'), sugerenciasVias = document.getElementById('sugerencias-vias');

        inputBuscadorVias.addEventListener('input', function() {
            const txt = estandarizarTexto(this.value); sugerenciasVias.innerHTML = '';
            if (txt.length < 2) { sugerenciasVias.style.display = 'none'; return; }
            const agrup = {};
            datosVias.forEach(f => {
                if (f.properties && f.properties['NOMBRECOMP']) {
                    const n = String(f.properties['NOMBRECOMP']);
                    if (estandarizarTexto(n).includes(txt)) { if(!agrup[n]) agrup[n] = []; agrup[n].push(f); }
                }
            });
            const res = Object.keys(agrup).slice(0, 5); 
            if (res.length > 0) {
                sugerenciasVias.style.display = 'block';
                res.forEach(n => {
                    let div = document.createElement('div'); div.className = 'sugerencia-item'; div.innerHTML = `<i class="fas fa-map-marker-alt" style="color:#00bcd4; margin-right:8px;"></i> ${n}`;
                    div.onclick = () => { 
                        enfocarVia(agrup[n]); 
                        inputBuscadorVias.value = n; 
                        sugerenciasVias.style.display = 'none'; 
                        
                        panel.classList.add('minimizado'); 
                        document.body.classList.remove('panel-abierto');
                    };
                    sugerenciasVias.appendChild(div);
                });
            } else { sugerenciasVias.style.display = 'none'; }
        });

        document.addEventListener('click', e => { if (!document.getElementById('buscador-vias-container').contains(e.target)) sugerenciasVias.style.display = 'none'; });

        function enfocarVia(segmentos) {
            if (capaResaltadoVia) map.removeLayer(capaResaltadoVia);
            capaResaltadoVia = L.geoJson({ type: "FeatureCollection", features: segmentos }, { style: { className: 'via-resaltada-animacion' } }).addTo(map);
            map.fitBounds(capaResaltadoVia.getBounds(), { padding: [50, 50], maxZoom: 18 });
            setTimeout(() => { if (capaResaltadoVia) { map.removeLayer(capaResaltadoVia); capaResaltadoVia = null; } }, 5000);
        }

