// Consulta local por identificación urbana de 2024 y geometrías del visor 1.
(function () {
    var resultados = [];
    var indice = null;
    var totalResultados = 0;
    var gruposManzanas = [];
    var clavesManzanas = new Set();
    var comparador = new Intl.Collator('es', { numeric: true });
    function normalizar(valor) {
        return String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .toLowerCase().replace(/[^a-z0-9]/g, '');
    }
    function interpretar(texto) {
        if (document.body.classList.contains('modo-retiros')) return null;
        var tokens = String(texto || '').trim().split(/\s+/);
        function campo(token) {
            var palabra = normalizar(token);
            if (/^(m|ma|mz|mza|mzn|man|manz|manza|manzan|manzana|manaz|manaza|manazan|manazana)$/.test(palabra)) return 'manzana';
            if (/^(l|lt|lte|lo|lot|lote)$/.test(palabra)) return 'lote';
            return '';
        }
        var actual = campo(tokens.shift());
        if (!actual) return null;
        var consulta = { manzana: '', lote: '', pideLote: actual === 'lote' };
        tokens.forEach(function (token) {
            // Una letra sola tras «Mz» puede ser la manzana L o M.
            var siguiente = token.length > 1 || consulta[actual] ? campo(token) : '';
            if (siguiente) { actual = siguiente; if (actual === 'lote') consulta.pideLote = true; }
            else consulta[actual] += normalizar(token);
        });
        consulta.lote = consulta.lote.replace(/^0+(?=\d)/, '');
        return consulta;
    }
    function construirIndice() {
        if (indice) return indice;
        indice = [];
        var datos = window.LOTES_URBANOS_2024 || {};
        window.layer_usos_compatibles_0.eachLayer(function (layer) {
            var props = layer.feature.properties || {};
            var codigo = String(props.COD_LOTE || '').trim();
            var urbano = datos[codigo];
            if (!urbano || !urbano.manzana) return;
            indice.push({ layer: layer, codigo: codigo, urbano: urbano,
                manzana: normalizar(urbano.manzana), lote: normalizar(urbano.lote).replace(/^0+(?=\d)/, ''),
                componentes: String(urbano.lote || '').split(/[,;\/\-]+/).map(function (valor) { return normalizar(valor).replace(/^0+(?=\d)/, ''); }) });
        });
        // El orden natural se calcula una sola vez, nunca por cada pulsación.
        indice.sort(function (a, b) {
            return comparador.compare(a.urbano.manzana, b.urbano.manzana) || comparador.compare(a.lote, b.lote);
        });
        var grupos = new Map();
        indice.forEach(function (item) {
            clavesManzanas.add(item.manzana);
            if (!grupos.has(item.manzana)) grupos.set(item.manzana, { grupo: true, nombre: item.urbano.manzana, clave: item.manzana });
        });
        gruposManzanas = Array.from(grupos.values()).sort(function (a, b) {
            return comparador.compare(a.nombre, b.nombre);
        });
        return indice;
    }
    function seleccionar(item) {
        if (item.grupo) {
            inputBuscadorVias.value = 'Mz ' + item.nombre + ' lote ';
            indiceSugerenciaViaActiva = -1;
            actualizarBotonLimpiarVias();
            buscar(inputBuscadorVias.value);
            inputBuscadorVias.focus();
            return;
        }
        var layer = item.layer, feature = layer.feature, props = feature.properties || {};
        inputBuscadorVias.value = 'Mz ' + item.urbano.manzana + ' lote ' + item.urbano.lote;
        actualizarBotonLimpiarVias();
        cerrarSugerenciasVias();
        map.closePopup();
        if (capaResaltadoVia) { map.removeLayer(capaResaltadoVia); capaResaltadoVia = null; }
        resaltarLote(feature, layer);
        var uso = window.normalizarCategoriaUso ? window.normalizarCategoriaUso(props.USOS_COMPA) : props.USOS_COMPA;
        window.actualizarLista(uso, props.ZON_VIG || '', props.ZRE_USOCOM || '', props, layer.getBounds().getCenter());
        enfocarSeleccion(layer);
    }
    function buscar(texto) {
        var consulta = interpretar(texto);
        if (!consulta) { resultados = []; return false; }
        var registros = construirIndice();
        var manzanaExacta = consulta.pideLote && clavesManzanas.has(consulta.manzana);
        var exactas = [], parciales = [];
        if (!consulta.pideLote) {
            gruposManzanas.forEach(function (item) {
                if (item.clave.indexOf(consulta.manzana) !== 0) return;
                (item.clave === consulta.manzana ? exactas : parciales).push(item);
            });
        } else {
            registros.forEach(function (item) {
                if (consulta.manzana && (manzanaExacta ? item.manzana !== consulta.manzana : item.manzana.indexOf(consulta.manzana) !== 0)) return;
                if (consulta.lote && item.lote.indexOf(consulta.lote) !== 0 && !item.componentes.some(function (valor) { return valor.indexOf(consulta.lote) === 0; })) return;
                var exacta = item.lote === consulta.lote || item.componentes.indexOf(consulta.lote) !== -1;
                (exacta ? exactas : parciales).push(item);
            });
        }
        totalResultados = exactas.length + parciales.length;
        resultados = exactas.slice(0, 30).concat(parciales.slice(0, Math.max(0, 30 - exactas.length)));
        var lista = document.getElementById('sugerencias-vias');
        lista.innerHTML = '';
        var mensaje = document.createElement('div');
        mensaje.className = 'sugerencia-nota-lotes';
        mensaje.setAttribute('role', 'status');
        mensaje.textContent = !resultados.length ? 'No hay coincidencias. Prueba otra manzana o número de lote.' :
            !consulta.pideLote ? 'Selecciona una manzana o sigue escribiendo para afinar la búsqueda.' :
            totalResultados > 1 ? totalResultados + ' coincidencias. Sigue escribiendo o selecciona un lote.' : '1 lote encontrado. Pulsa Enter o selecciona el resultado.';
        if (totalResultados > 30) mensaje.textContent += ' Mostrando las primeras 30.';
        lista.appendChild(mensaje);
        resultados.forEach(function (item, i) {
            var props = item.grupo ? {} : item.layer.feature.properties || {};
            var fila = document.createElement('div');
            fila.className = 'sugerencia-item';
            fila.id = 'sugerencia-lote-urbano-' + i;
            fila.setAttribute('role', 'option');
            fila.setAttribute('aria-selected', 'false');
            var titulo = document.createElement('strong');
            titulo.textContent = item.grupo ? 'Manzana ' + item.nombre : 'Mz ' + item.urbano.manzana + ' · Lote ' + (item.urbano.lote || 'sin número');
            var detalle = document.createElement('small');
            detalle.style.display = 'block';
            detalle.textContent = item.grupo ? 'Ver lotes de esta manzana' : [props.SECTOR ? 'Sector ' + props.SECTOR : '', props['VIA COLIND'], 'Código ' + item.codigo, props['CÓDIGO'], props.USOS_COMPA].filter(Boolean).join(' · ');
            fila.appendChild(titulo); fila.appendChild(detalle);
            fila.addEventListener('mouseenter', function () { actualizarSugerenciaViaActiva(i); });
            fila.addEventListener('click', function () { seleccionar(item); });
            lista.appendChild(fila);
        });
        lista.style.display = 'block';
        inputBuscadorVias.setAttribute('aria-expanded', 'true');
        return true;
    }
    // Prepara los datos antes de escribir, cuando el navegador tiene tiempo libre.
    if (window.requestIdleCallback) window.requestIdleCallback(construirIndice);
    var campoBusqueda = document.getElementById('buscador-vias');
    if (campoBusqueda) campoBusqueda.addEventListener('focus', construirIndice, { once: true });

    window.BUSQUEDA_LOTES_URBANOS = { interpretar: interpretar, buscar: buscar, ejecutar: function () {
        if (!interpretar(inputBuscadorVias.value)) return false;
        if (indiceSugerenciaViaActiva >= 0 && resultados[indiceSugerenciaViaActiva]) seleccionar(resultados[indiceSugerenciaViaActiva]);
        else if (resultados.length === 1) seleccionar(resultados[0]);
        else buscar(inputBuscadorVias.value);
        return true;
    } };
})();
