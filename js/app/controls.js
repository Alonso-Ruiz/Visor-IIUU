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

        // --- LEYENDA (INTERACTIVA) ---
        window.toggleConcepto = function(id) {
            var el = document.getElementById(id);
            document.querySelectorAll('.leyenda-concepto').forEach(c => { if(c.id !== id) c.style.display = 'none'; });
            el.style.display = (el.style.display === 'none' || el.style.display === '') ? 'block' : 'none';
        };

        var legend = L.control({position: 'bottomleft'});
        legend.onAdd = function (map) {
            var div = L.DomUtil.create('div', 'info legend');
            L.DomEvent.disableClickPropagation(div);
            div.innerHTML += '<div id="leyenda-header" style="cursor:pointer; display:flex; justify-content:space-between; align-items:center;">' +
                             '<h4 style="margin:0; font-size: 11px; font-weight: bold; text-transform: uppercase;">Compatibilidad de Uso</h4>' +
                             '<span id="leyenda-arrow" style="font-size:12px; margin-left:15px; color:#555;">' + (window.innerWidth <= 896 ? 'â–²' : 'â–¼') + '</span></div>';
            
            var displayVal = window.innerWidth <= 896 ? 'none' : 'block';
            var listaHtml = '<div id="leyenda-lista" style="margin-top:8px; max-height: 35vh; overflow-y: auto; display: ' + displayVal + '; border-top: 1px solid #ddd; padding-top: 5px;">';
            
            var cats = [
                { id: 'Uso Mixto Especializado', n: 'Mixto Especializado', c: '#7a0403' }, { id: 'Uso Mixto Intensivo', n: 'Mixto Intensivo', c: '#b72020' }, 
                { id: 'Uso Mixto Metropolitano', n: 'Mixto Metropolitano', c: '#9b5847' }, { id: 'Uso Mixto Zonal', n: 'Mixto Zonal', c: '#f47a7a' }, 
                { id: 'Uso Mixto Vecinal', n: 'Mixto Vecinal', c: '#f27144' }, { id: 'Uso Residencial Preferente', n: 'Residencial Preferente', c: '#f4c644' },
                { id: 'Uso Residencial Especial', n: 'Residencial Especial', c: '#feac00' }, { id: 'Uso Residencial Exclusivo', n: 'Residencial Exclusivo', c: '#f4f4f4' }, 
                { id: 'Usos EspecÃ­ficos - Otros Usos', n: 'Usos EspecÃ­ficos', c: '#818181' }, { id: 'Uso de RecreaciÃ³n PÃºblica', n: 'RecreaciÃ³n PÃºblica', c: '#a4cda3' }, 
                { id: 'Planes Especiales', n: 'Planes Especiales', c: 'repeating-linear-gradient(45deg, #000 0, #000 2px, #fff 2px, #fff 4px)' }
            ];
            
            cats.forEach((i, idx) => { 
                var txt = definicionesZonas[i.id];
                listaHtml += `
                <div>
                    <div class="leyenda-item-titulo" onclick="toggleConcepto('concepto-${idx}')">
                        <i style="background: ${i.c}; flex-shrink: 0;"></i> <span style="font-weight:bold;">${i.n}</span>
                    </div>
                    <div id="concepto-${idx}" class="leyenda-concepto">${txt}</div>
                </div>`; 
            });
            div.innerHTML += listaHtml + '</div>';

            setTimeout(function() {
                document.getElementById('leyenda-header').addEventListener('click', function() {
                    var l = document.getElementById('leyenda-lista'); var a = document.getElementById('leyenda-arrow');
                    var h = l.style.display === 'none'; l.style.display = h ? 'block' : 'none'; a.innerHTML = h ? 'â–¼' : 'â–²';
                });
            }, 100);
            return div;
        };
        legend.addTo(map);

        // --- LÃ“GICA DE VÃAS ---
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

