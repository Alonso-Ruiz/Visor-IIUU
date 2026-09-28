/* Búsqueda temporal de direcciones con Geoapify para la demostración. */
(function() {
    var input = document.getElementById('buscador-vias');
    var lista = document.getElementById('sugerencias-vias');
    if (!input || !lista) return;

    var resultadosDireccion = [];
    var indiceActivo = -1;
    var consultaActiva = '';
    var solicitud = 0;
    var ultimaConsulta = '';
    var ultimoResultados = [];
    var lotesCercanos = [];

    function pareceDireccionConNumero(texto) {
        var limpio = String(texto || '').trim();
        return /\d/.test(limpio) && !/\b[A-Z]{2,}-\d+\b/i.test(limpio);
    }

    function obtenerClave() {
        return String(window.GEOAPIFY_API_KEY || '').trim();
    }

    function mostrarMensaje(texto) {
        lista.innerHTML = '';
        var fila = document.createElement('div');
        fila.className = 'sugerencia-item';
        fila.setAttribute('role', 'status');
        fila.textContent = texto;
        lista.appendChild(fila);
        lista.style.display = 'block';
        input.setAttribute('aria-expanded', 'true');
    }

    function extraerDireccion(texto) {
        var coincidencia = String(texto).trim().match(/^(.*?)\s+(\d+[A-Za-z]?(?:-\d+[A-Za-z]?)?)$/);
        if (!coincidencia) return { text: texto + ', San Borja, Lima, Peru' };
        return {
            street: coincidencia[1].trim(),
            housenumber: coincidencia[2],
            city: 'San Borja',
            state: 'Lima',
            country: 'Peru'
        };
    }

    function consultarGeoapify(texto) {
        var clave = obtenerClave();
        if (!clave) {
            mostrarMensaje('La búsqueda de direcciones todavía no está configurada.');
            console.error('Configura GEOAPIFY_API_KEY en js/app/geoapify-config.js.');
            return;
        }
        consultaActiva = texto;
        indiceActivo = -1;
        resultadosDireccion = [];
        mostrarMensaje('Buscando dirección…');
        var idSolicitud = ++solicitud;
        var parametros = new URLSearchParams(extraerDireccion(texto));
        parametros.set('countrycode', 'pe');
        parametros.set('filter', 'rect:-77.025,-12.115,-76.975,-12.065');
        parametros.set('bias', 'proximity:-77.000,-12.090');
        parametros.set('limit', '5');
        parametros.set('format', 'json');
        parametros.set('apiKey', clave);

        fetch('https://api.geoapify.com/v1/geocode/search?' + parametros.toString())
            .then(function(respuesta) {
                if (!respuesta.ok) throw new Error('Geoapify respondió con estado ' + respuesta.status);
                return respuesta.json();
            })
            .then(function(datos) {
                if (idSolicitud !== solicitud || input.value.trim() !== texto) return;
                var encontrados = Array.isArray(datos.results) ? datos.results : [];
                if (!encontrados.length) {
                    mostrarMensaje('Geoapify no encontró esa dirección en San Borja. Prueba con el nombre completo de la vía y el número.');
                    return;
                }
                resultadosDireccion = encontrados.filter(function(item) {
                    return Number.isFinite(Number(item.lat)) && Number.isFinite(Number(item.lon));
                });
                ultimoResultados = resultadosDireccion;
                ultimaConsulta = texto;
                pintarResultadosDireccion();
            })
            .catch(function(error) {
                if (idSolicitud !== solicitud) return;
                console.error('Error en la búsqueda Geoapify:', error);
                mostrarMensaje('No se pudo consultar Geoapify. Revisa la API key y la conexión.');
            });
    }

    function pintarResultadosDireccion() {
        lista.innerHTML = '';
        resultadosDireccion.forEach(function(resultado, indice) {
            var fila = document.createElement('div');
            fila.className = 'sugerencia-item';
            fila.id = 'sugerencia-direccion-' + indice;
            fila.setAttribute('role', 'option');
            fila.setAttribute('aria-selected', 'false');
            var icono = document.createElement('i');
            icono.className = 'fas fa-map-marker-alt';
            icono.style.cssText = 'color:#00bcd4; margin-right:8px;';
            icono.setAttribute('aria-hidden', 'true');
            fila.appendChild(icono);
            fila.appendChild(document.createTextNode(' ' + (resultado.formatted || consultaActiva)));
            fila.addEventListener('mouseenter', function() { activarResultado(indice); });
            fila.addEventListener('click', function() { seleccionarDireccion(resultado); });
            lista.appendChild(fila);
        });
        var nota = document.createElement('div');
        nota.className = 'sugerencia-item';
        nota.setAttribute('role', 'note');
        nota.style.cssText = 'font-size:11px;color:#666;cursor:default';
        nota.textContent = 'La selección del lote requiere que el punto caiga dentro de uno de sus polígonos. ';
        var atribucion = document.createElement('a');
        atribucion.href = 'https://www.geoapify.com/';
        atribucion.target = '_blank';
        atribucion.rel = 'noopener noreferrer';
        atribucion.textContent = 'Powered by Geoapify';
        nota.appendChild(atribucion);
        nota.appendChild(document.createTextNode(' · © OpenStreetMap contributors'));
        lista.appendChild(nota);
        lista.style.display = 'block';
        input.setAttribute('aria-expanded', 'true');
    }

    function activarResultado(indice) {
        var filas = lista.querySelectorAll('[role="option"]');
        if (!filas.length) return;
        indiceActivo = (indice + filas.length) % filas.length;
        filas.forEach(function(fila, i) {
            fila.classList.toggle('sugerencia-activa', i === indiceActivo);
            fila.setAttribute('aria-selected', i === indiceActivo ? 'true' : 'false');
        });
        input.setAttribute('aria-activedescendant', filas[indiceActivo].id);
        filas[indiceActivo].scrollIntoView({ block: 'nearest' });
    }

    function enAnillo(punto, anillo) {
        var dentro = false;
        for (var i = 0, j = anillo.length - 1; i < anillo.length; j = i++) {
            var xi = anillo[i][0], yi = anillo[i][1];
            var xj = anillo[j][0], yj = anillo[j][1];
            var cruza = ((yi > punto[1]) !== (yj > punto[1])) &&
                (punto[0] < (xj - xi) * (punto[1] - yi) / ((yj - yi) || 1e-15) + xi);
            if (cruza) dentro = !dentro;
        }
        return dentro;
    }

    function puntoEnGeometria(punto, geometria) {
        if (!geometria) return false;
        var poligonos = geometria.type === 'Polygon' ? [geometria.coordinates] :
            (geometria.type === 'MultiPolygon' ? geometria.coordinates : []);
        return poligonos.some(function(anillos) {
            if (!anillos.length || !enAnillo(punto, anillos[0])) return false;
            return !anillos.slice(1).some(function(hueco) { return enAnillo(punto, hueco); });
        });
    }

    function distanciaPuntoSegmentoMetros(punto, a, b) {
        var escalaX = 111320 * Math.cos(punto[1] * Math.PI / 180);
        var escalaY = 111320;
        var ax = (a[0] - punto[0]) * escalaX, ay = (a[1] - punto[1]) * escalaY;
        var bx = (b[0] - punto[0]) * escalaX, by = (b[1] - punto[1]) * escalaY;
        var dx = bx - ax, dy = by - ay;
        var largo2 = dx * dx + dy * dy;
        var t = largo2 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / largo2)) : 0;
        return Math.sqrt(Math.pow(ax + t * dx, 2) + Math.pow(ay + t * dy, 2));
    }

    function distanciaPuntoGeometriaMetros(punto, geometria) {
        if (puntoEnGeometria(punto, geometria)) return 0;
        var poligonos = geometria && geometria.type === 'Polygon' ? [geometria.coordinates] :
            (geometria && geometria.type === 'MultiPolygon' ? geometria.coordinates : []);
        var minima = Infinity;
        poligonos.forEach(function(anillos) {
            anillos.forEach(function(anillo) {
                for (var i = 0; i < anillo.length - 1; i++) {
                    minima = Math.min(minima, distanciaPuntoSegmentoMetros(punto, anillo[i], anillo[i + 1]));
                }
            });
        });
        return minima;
    }

    function buscarLotesCercanos(punto, features, viaBuscada) {
        var candidatos = [];
        features.forEach(function(feature) {
            var geometria = feature.geometry;
            if (!geometria || !geometria.coordinates) return;
            var distancia = distanciaPuntoGeometriaMetros(punto, geometria);
            if (distancia > 50) return;
            var via = String((feature.properties || {})['VIA COLIND'] || '');
            var coincideVia = coincideBusquedaLocal(viaBuscada, via);
            candidatos.push({ feature: feature, distancia: distancia, coincideVia: coincideVia, puntaje: distancia + (coincideVia ? 0 : 20) });
        });
        var conVia = candidatos.filter(function(item) { return item.coincideVia; });
        if (conVia.length) candidatos = conVia;
        return candidatos.sort(function(a, b) { return a.puntaje - b.puntaje; }).slice(0, 5);
    }

    function coincideBusquedaLocal(texto, valor) {
        var terminos = String(texto || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().split(/[^a-z0-9]+/).filter(function(t) { return t.length > 1; });
        var normalizado = String(valor || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        return terminos.length > 0 && terminos.every(function(termino) { return normalizado.indexOf(termino) !== -1; });
    }

    function seleccionarDireccion(resultado) {
        var lngLat = [Number(resultado.lon), Number(resultado.lat)];
        var coleccion = window.json_usos_compatibles_0;
        var features = coleccion && coleccion.features ? coleccion.features : [];
        var coincidentes = features.filter(function(feature) {
            return puntoEnGeometria(lngLat, feature.geometry);
        });

        if (!coincidentes.length) {
            var direccion = extraerDireccion(consultaActiva);
            var viaBuscada = direccion.street || consultaActiva;
            var cercanos = buscarLotesCercanos(lngLat, features, viaBuscada);
            if (cercanos.length) {
                var segundo = cercanos[1];
                var esUnicoClaro = cercanos[0].distancia <= 8 && (!segundo || segundo.puntaje - cercanos[0].puntaje >= 8);
                if (esUnicoClaro) {
                    abrirLote(cercanos[0].feature);
                    return;
                }
                pintarLotesCercanos(cercanos, lngLat);
                map.flyTo([lngLat[1], lngLat[0]], 19, { duration: 1.2 });
                return;
            }
            map.flyTo([lngLat[1], lngLat[0]], 19, { duration: 1.2 });
            mostrarMensaje('Geoapify encontró la dirección, pero no hay un lote del visor cerca de ese punto.');
            return;
        }
        if (coincidentes.length > 1) {
            pintarLotesCoincidentes(coincidentes, resultado);
            return;
        }
        abrirLote(coincidentes[0]);
    }

    function pintarLotesCoincidentes(features, resultado) {
        lista.innerHTML = '';
        features.forEach(function(feature) {
            var props = feature.properties || {};
            var codigo = props['CÓDIGO'] || props['COD_LOTE'] || props['CUC'] || 'Lote del mapa';
            var fila = document.createElement('div');
            fila.className = 'sugerencia-item';
            fila.textContent = String(codigo);
            fila.addEventListener('click', function() { abrirLote(feature); });
            lista.appendChild(fila);
        });
        mostrarListaExistente();
    }

    function pintarLotesCercanos(candidatos) {
        lotesCercanos = candidatos;
        indiceActivo = -1;
        lista.innerHTML = '';
        var encabezado = document.createElement('div');
        encabezado.className = 'sugerencia-item';
        encabezado.setAttribute('role', 'note');
        encabezado.style.cssText = 'font-size:11px;color:#666;cursor:default';
        encabezado.textContent = 'La dirección quedó fuera de los lotes. Elige el polígono cercano:';
        lista.appendChild(encabezado);
        candidatos.forEach(function(candidato, indice) {
            var props = candidato.feature.properties || {};
            var identificador = props['CÓDIGO'] || props['COD_LOTE'] || props['CUC'] || 'Lote del mapa';
            var fila = document.createElement('div');
            fila.className = 'sugerencia-item';
            fila.id = 'sugerencia-lote-cercano-' + indice;
            fila.setAttribute('role', 'option');
            fila.setAttribute('aria-selected', 'false');
            fila.textContent = String(identificador) + ' · ' + Math.round(candidato.distancia) + ' m';
            fila.addEventListener('mouseenter', function() { activarResultado(indice); });
            fila.addEventListener('click', function() { abrirLote(candidato.feature); });
            lista.appendChild(fila);
        });
        mostrarListaExistente();
    }

    function mostrarListaExistente() {
        lista.style.display = 'block';
        input.setAttribute('aria-expanded', 'true');
    }

    function abrirLote(feature) {
        var props = feature.properties || {};
        var uso = props['USOS_COMPA'] || '';
        if (uso === 'Usos Específicos' || uso === 'Otros Usos') uso = 'Usos Específicos - Otros Usos';
        if (window.normalizarCategoriaUso) uso = window.normalizarCategoriaUso(uso);

        if (window.limpiarRetiroResaltado) window.limpiarRetiroResaltado();
        if (window.capaLoteResaltado && map.hasLayer(window.capaLoteResaltado)) map.removeLayer(window.capaLoteResaltado);
        window.capaLoteResaltado = L.geoJson(feature, {
            interactive: false,
            style: { color: '#00D9FF', weight: 5, opacity: 1, dashArray: '9 6', fillColor: '#00D9FF', fillOpacity: 0.22 }
        }).addTo(map);
        if (window.actualizarLista) window.actualizarLista(uso, props['ZON_VIG'] || '', props['ZRE_USOCOM'] || '', props);

        var limites = L.geoJson(feature).getBounds();
        var panel = document.getElementById('panel-usos');
        var movil = window.innerWidth <= 896;
        var anchoPanel = panel && !panel.classList.contains('minimizado') && !movil
            ? Math.round(panel.getBoundingClientRect().width) : 0;
        map.flyToBounds(limites, {
            paddingTopLeft: [24, 64],
            paddingBottomRight: movil ? [20, Math.round(window.innerHeight * 0.58)] : [anchoPanel + 24, 24],
            maxZoom: 20,
            duration: 1.1
        });
        lista.style.display = 'none';
        input.setAttribute('aria-expanded', 'false');
        input.setAttribute('aria-activedescendant', '');
    }

    document.addEventListener('keydown', function(event) {
        if (event.target !== input) return;
        if (event.key === 'ArrowDown' && (lotesCercanos.length || resultadosDireccion.length)) {
            event.preventDefault();
            event.stopImmediatePropagation();
            activarResultado(indiceActivo + 1);
            return;
        }
        if (event.key === 'ArrowUp' && (lotesCercanos.length || resultadosDireccion.length)) {
            event.preventDefault();
            event.stopImmediatePropagation();
            activarResultado(indiceActivo < 0 ? resultadosDireccion.length - 1 : indiceActivo - 1);
            return;
        }
        if (event.key !== 'Enter' || !pareceDireccionConNumero(input.value)) return;

        event.preventDefault();
        event.stopImmediatePropagation();
        if (lotesCercanos.length) {
            var loteElegido = lotesCercanos[indiceActivo >= 0 ? indiceActivo : 0];
            abrirLote(loteElegido.feature);
            return;
        }
        var texto = input.value.trim();
        if (texto === ultimaConsulta && ultimoResultados.length) {
            var elegido = indiceActivo >= 0 ? ultimoResultados[indiceActivo] : ultimoResultados[0];
            seleccionarDireccion(elegido);
        } else if (texto !== consultaActiva) {
            consultarGeoapify(texto);
        }
    }, true);

    input.addEventListener('input', function() {
        solicitud++;
        consultaActiva = '';
        ultimaConsulta = '';
        ultimoResultados = [];
        resultadosDireccion = [];
        lotesCercanos = [];
        indiceActivo = -1;
    });
})();
