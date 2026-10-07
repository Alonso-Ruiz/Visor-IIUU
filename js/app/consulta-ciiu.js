(function () {
    'use strict';

    var catalogo = window.datosEquivalencias2851;
    var data = catalogo && Array.isArray(catalogo.activities) ? catalogo.activities : [];
    var clases = catalogo && Array.isArray(catalogo.classes) ? catalogo.classes : [];
    var porClase = {};
    var codigos = Array.from(new Set(data.reduce(function (lista, giro) {
        return lista.concat(String(giro.ciiu).split(/[;,]/).map(function (codigo) { return codigo.trim(); }).filter(Boolean));
    }, []))).sort();
    var seccionSelect = document.getElementById('consulta-ciiu-seccion');
    var divisionSelect = document.getElementById('consulta-ciiu-division');
    var claseSelect = document.getElementById('consulta-ciiu-clase');
    var textoInput = document.getElementById('consulta-ciiu-texto');
    var resultados = document.getElementById('consulta-ciiu-resultados');
    var conteo = document.getElementById('consulta-ciiu-conteo');
    var limpiar = document.getElementById('consulta-ciiu-limpiar');
    var formulario = document.getElementById('consulta-ciiu-formulario');
    var codigoInput = document.getElementById('consulta-ciiu-codigo');
    var revisionSelect = document.getElementById('consulta-ciiu-revision');
    var botonesModo = document.querySelectorAll('[data-ciiu-modo]');
    var panelesModo = document.querySelectorAll('[data-ciiu-panel]');
    var modo = 'descripcion';

    if (!seccionSelect || !divisionSelect || !claseSelect || !resultados || !textoInput) return;

    var secciones = [
        { id: 'A', nombre: 'Agricultura, ganadería, silvicultura y pesca', min: 1, max: 3 },
        { id: 'B', nombre: 'Explotación de minas y canteras', min: 5, max: 9 },
        { id: 'C', nombre: 'Industrias manufactureras', min: 10, max: 33 },
        { id: 'D', nombre: 'Suministro de electricidad, gas, vapor y aire acondicionado', min: 35, max: 35 },
        { id: 'E', nombre: 'Suministro de agua y gestión de residuos', min: 36, max: 39 },
        { id: 'F', nombre: 'Construcción', min: 41, max: 43 },
        { id: 'G', nombre: 'Comercio y reparación de vehículos', min: 45, max: 47 },
        { id: 'H', nombre: 'Transporte y almacenamiento', min: 49, max: 53 },
        { id: 'I', nombre: 'Alojamiento y servicio de comidas', min: 55, max: 56 },
        { id: 'J', nombre: 'Información y comunicaciones', min: 58, max: 63 },
        { id: 'K', nombre: 'Actividades financieras y de seguros', min: 64, max: 66 },
        { id: 'L', nombre: 'Actividades inmobiliarias', min: 68, max: 68 },
        { id: 'M', nombre: 'Actividades profesionales, científicas y técnicas', min: 69, max: 75 },
        { id: 'N', nombre: 'Actividades administrativas y servicios de apoyo', min: 77, max: 82 },
        { id: 'O', nombre: 'Administración pública y defensa', min: 84, max: 84 },
        { id: 'P', nombre: 'Enseñanza', min: 85, max: 85 },
        { id: 'Q', nombre: 'Salud humana y asistencia social', min: 86, max: 88 },
        { id: 'R', nombre: 'Artes, entretenimiento y recreación', min: 90, max: 93 },
        { id: 'S', nombre: 'Otras actividades de servicios', min: 94, max: 96 },
        { id: 'T', nombre: 'Actividades de los hogares', min: 97, max: 98 },
        { id: 'U', nombre: 'Organismos extraterritoriales', min: 99, max: 99 }
    ];

    function seccionDe(codigo) {
        var numero = parseInt(String(codigo).slice(0, 2), 10);
        return secciones.find(function (seccion) { return numero >= seccion.min && numero <= seccion.max; });
    }

    function normalizar(valor) {
        return String(valor === null || valor === undefined ? '' : valor)
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    }

    function codigosGiro(giro) {
        return String(giro.ciiu || '').split(/[;,]/).map(function (codigo) { return codigo.trim(); }).filter(Boolean);
    }

    function descripcionCiiu(giro) {
        return codigosGiro(giro).map(function (codigo) {
            var clase = porClase[codigo];
            return codigo + (clase ? ' ' + clase.description : '');
        }).join(' · ');
    }

    function escapar(valor) {
        return String(valor === null || valor === undefined ? '' : valor)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function opciones(select, lista, placeholder, valor, etiqueta) {
        select.replaceChildren(new Option(placeholder, ''));
        lista.forEach(function (item) {
            select.add(new Option(etiqueta(item), valor(item)));
        });
    }

    clases.forEach(function (clase) {
        var codigo = String(clase.ciiu);
        porClase[codigo] = clase;
    });
    function codigosVisibles() {
        var seccion = seccionSelect.value;
        var division = divisionSelect.value;
        return codigos.filter(function (codigo) {
            var info = seccionDe(codigo);
            return (!seccion || (info && info.id === seccion)) && (!division || codigo.slice(0, 2) === division);
        });
    }

    function actualizarFiltros() {
        var divisionActual = divisionSelect.value;
        var claseActual = claseSelect.value;
        var actuales = codigosVisibles();
        var divisiones = Array.from(new Set(actuales.map(function (codigo) { return codigo.slice(0, 2); }))).sort();
        opciones(divisionSelect, divisiones, 'Todas las divisiones', function (x) { return x; }, function (x) { return x + ' — División CIIU'; });
        if (divisiones.indexOf(divisionActual) !== -1) divisionSelect.value = divisionActual;
        divisionSelect.disabled = !seccionSelect.value;
        claseSelect.disabled = !divisionSelect.value;
        var clasesActuales = divisionSelect.value ? actuales : [];
        opciones(claseSelect, clasesActuales, 'Todas las clases', function (x) { return x; }, function (x) {
            var clase = porClase[x];
            return x + ' — ' + (clase ? clase.description : 'Clase CIIU');
        });
        if (clasesActuales.indexOf(claseActual) !== -1) claseSelect.value = claseActual;
    }

    function claseSeleccionada() {
        return claseSelect.value || '';
    }

    function filtrar() {
        var query = modo === 'descripcion' ? normalizar(textoInput.value) : '';
        var seleccion = modo === 'actividad' ? claseSeleccionada() : '';
        var seccion = modo === 'actividad' ? seccionSelect.value : '';
        var division = modo === 'actividad' ? divisionSelect.value : '';
        return data.filter(function (giro) {
            var codigos = codigosGiro(giro);
            if (modo === 'codigo') {
                var codigosBusqueda = revisionSelect.value === '3'
                    ? String(giro.ciiuRev3 || '').split(/[;,]/).map(function (codigo) { return codigo.trim(); }) : codigos;
                return codigosBusqueda.indexOf(codigoInput.value.trim()) !== -1;
            }
            if (seleccion && codigos.indexOf(seleccion) === -1) return false;
            if (division && !codigos.some(function (codigo) { return codigo.slice(0, 2) === division; })) return false;
            if (seccion && !codigos.some(function (codigo) { var info = seccionDe(codigo); return info && info.id === seccion; })) return false;
            if (!query) return true;
            return normalizar([giro.name, giro.ciiu, giro.ciiuRev3, giro.code1429, giro.literal1429,
                giro.classDescription, giro.conditions, (giro.scopes || []).join(' '), descripcionCiiu(giro)].join(' ')).indexOf(query) !== -1;
        });
    }

    function renderizarDetalle(giro) {
        var ambitos = (giro.scopes || []).map(function (ambito) { return '<span class="consulta-ciiu-etiqueta">' + escapar(ambito) + '</span>'; }).join('');
        var restricciones = codigosGiro(giro).map(function (codigo) {
            var clase = porClase[codigo];
            var categoriasR = [];
            if (clase && clase.compatibility) Object.keys(clase.compatibility).forEach(function (categoria) {
                if (String(clase.compatibility[categoria]).trim().toUpperCase() === 'R') categoriasR.push(categoria);
            });
            return '<p><strong>' + escapar(codigo) + ':</strong> ' + (categoriasR.length
                ? 'R en ' + escapar(categoriasR.join(', ')) + ' <span class="consulta-ciiu-ayuda">(permitido con restricciones según la matriz)</span>'
                : 'la matriz de clases no registra una marca R.') + '</p>';
        }).join('');
        var referenciaClases = codigosGiro(giro).map(function (codigo) {
            var clase = porClase[codigo];
            return clase ? 'Clase ' + escapar(codigo) + ': ' + escapar(clase.description) + ' (página ' + escapar(clase.page2851) + ')' : 'Sin fila de clase ' + escapar(codigo) + ' en la matriz 2851';
        }).join('<br>');
        return '<div class="consulta-ciiu-detalle">' +
            '<div class="consulta-ciiu-detalle-bloque"><h4>Equivalencia del antecedente</h4><p><strong>Ordenanza 1429:</strong> ' + escapar(giro.code1429) + ' — ' + escapar(giro.literal1429) + '</p><p><strong>CIIU Rev. 3:</strong> ' + escapar(giro.ciiuRev3) + '</p><p><strong>Ámbitos con X histórica:</strong></p><div class="consulta-ciiu-etiquetas">' + (ambitos || 'Sin ámbitos consignados') + '</div><p class="consulta-ciiu-pagina">Referencia del antecedente: página ' + escapar(giro.page1429) + '.</p></div>' +
            '<div class="consulta-ciiu-detalle-bloque"><h4>Condiciones y matriz 2851</h4><p>' + escapar(giro.conditions || 'El archivo no especifica una condición adicional para este giro.') + '</p>' + restricciones + '<p class="consulta-ciiu-pagina">' + referenciaClases + '</p></div>' +
            '<p class="consulta-ciiu-detalle-nota">La clasificación R corresponde a la clase CIIU en la matriz y no reemplaza la evaluación del giro, sus condiciones ni la verificación territorial.</p>' +
            '</div>';
    }

    function renderizar() {
        var filtrados = filtrar();
        conteo.textContent = filtrados.length + (filtrados.length === 1 ? ' giro encontrado' : ' giros encontrados');
        if (!filtrados.length) {
            resultados.innerHTML = '<div class="consulta-ciiu-vacio"><i class="fas fa-search" aria-hidden="true"></i><p>No encontramos giros con esos filtros. Prueba con otro nombre o código.</p></div>';
            return;
        }
        resultados.innerHTML = filtrados.map(function (giro) {
            return '<article class="consulta-ciiu-resultado"><div class="consulta-ciiu-resultado-cabecera"><div><span class="consulta-ciiu-codigo">CIIU Rev. 4 · ' + escapar(codigosGiro(giro).join(' / ')) + '</span><h3>' + escapar(giro.name) + '</h3><p>' + escapar(descripcionCiiu(giro)) + '</p></div><span class="consulta-ciiu-antecedente">X histórica · 1429</span></div><details><summary>Ver equivalencia, ámbitos y restricciones</summary>' + renderizarDetalle(giro) + '</details></article>';
        }).join('');
    }

    function limpiarFiltros() {
        textoInput.value = '';
        codigoInput.value = '';
        codigoInput.setCustomValidity('');
        seccionSelect.value = '';
        divisionSelect.value = '';
        claseSelect.value = '';
        actualizarFiltros();
        mostrarInicio();
        campoActivo().focus();
    }

    function campoActivo() {
        return modo === 'descripcion' ? textoInput : modo === 'codigo' ? codigoInput : seccionSelect;
    }

    function mostrarInicio() {
        conteo.textContent = 'Resultados';
        var mensaje = modo === 'descripcion' ? 'Escribe una palabra o descripción y pulsa Buscar.'
            : modo === 'codigo' ? 'Ingresa un código CIIU y pulsa Buscar.'
            : 'Selecciona una sección. Puedes precisar la división y la clase antes de buscar.';
        resultados.innerHTML = '<div class="consulta-ciiu-vacio"><i class="fas fa-search" aria-hidden="true"></i><p>' + mensaje + '</p></div>';
    }

    function buscar(event) {
        event.preventDefault();
        var campo = campoActivo();
        campo.setCustomValidity('');
        if (modo === 'descripcion' && !textoInput.value.trim()) campo.setCustomValidity('Escribe una palabra o descripción.');
        if (modo === 'actividad' && !seccionSelect.value) campo.setCustomValidity('Selecciona una sección para buscar.');
        if (modo === 'codigo' && !/^\d{4}$/.test(codigoInput.value.trim())) campo.setCustomValidity('Ingresa un código CIIU de 4 dígitos.');
        if (!campo.reportValidity()) return;
        renderizar();
    }

    var seccionesDisponibles = secciones.filter(function (seccion) {
        return codigos.some(function (codigo) { var info = seccionDe(codigo); return info && info.id === seccion.id; });
    });
    opciones(seccionSelect, seccionesDisponibles, 'Todas las secciones', function (x) { return x.id; }, function (x) { return x.id + ' — ' + x.nombre; });
    opciones(divisionSelect, [], 'Todas las divisiones', function (x) { return x; }, function (x) { return x; });
    opciones(claseSelect, [], 'Todas las clases', function (x) { return x; }, function (x) { return x; });
    seccionSelect.addEventListener('change', function () { seccionSelect.setCustomValidity(''); divisionSelect.value = ''; claseSelect.value = ''; actualizarFiltros(); mostrarInicio(); });
    divisionSelect.addEventListener('change', function () { claseSelect.value = ''; actualizarFiltros(); mostrarInicio(); });
    claseSelect.addEventListener('change', mostrarInicio);
    textoInput.addEventListener('input', function () { textoInput.setCustomValidity(''); mostrarInicio(); });
    codigoInput.addEventListener('input', function () { codigoInput.setCustomValidity(''); mostrarInicio(); });
    revisionSelect.addEventListener('change', function () { codigoInput.placeholder = revisionSelect.value === '3' ? 'Ej.: 1541' : 'Ej.: 1071'; mostrarInicio(); });
    botonesModo.forEach(function (boton) {
        boton.addEventListener('click', function () {
            modo = boton.dataset.ciiuModo;
            [textoInput, codigoInput, seccionSelect].forEach(function (campo) { campo.setCustomValidity(''); });
            botonesModo.forEach(function (item) { item.setAttribute('aria-pressed', String(item === boton)); });
            panelesModo.forEach(function (panel) { panel.hidden = panel.dataset.ciiuPanel !== modo; });
            mostrarInicio();
            campoActivo().focus();
        });
    });
    formulario.addEventListener('submit', buscar);
    if (limpiar) limpiar.addEventListener('click', limpiarFiltros);
    mostrarInicio();
})();
