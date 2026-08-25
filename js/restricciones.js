// Reglas operativas del "Cuadro de Restricciones - Índice de Usos".
// La clasificación agrupa las clases CIIU según las categorías del cuadro fuente.
(function () {
    'use strict';

    var gruposPorClase = {
        'comercio-gastronomico': ['1071', '5610', '5621', '5629'],
        'alojamiento': ['5510'],
        'financiero': ['6419', '6499', '6511', '6530', '6611', '6612'],
        'educacion': ['8510', '8521', '8522', '8530', '8541', '8542', '8549'],
        'salud': ['8610', '8620', '8690'],
        'asistencia-social': ['8710', '8720', '8730', '8790', '8810', '8890'],
        'recreativas': ['5911', '5914', '5920', '6010', '9000', '9101', '9102', '9200', '9311', '9312', '9319', '9321', '9329'],
        'comercio-productos': ['4510', '4530', '4540', '4711', '4719', '4721', '4722', '4741', '4742', '4751', '4752', '4753', '4759', '4761', '4763', '4764', '4771', '4772', '4773', '4774', '4791'],
        'oficinas-consultoria': ['6190', '6209', '6810', '6820', '6910', '6920', '7010', '7310', '7420', '7490', '7810', '7911', '7912', '8010', '8230', '8411', '8413', '9412', '9491', '9900'],
        'servicios-personales': ['1410', '1811', '4520', '5221', '5310', '5320', '7500', '9523', '9529', '9601', '9602', '9609']
    };

    var nombresGrupo = {
        'comercio-gastronomico': 'Comercio gastronómico',
        'alojamiento': 'Alojamiento',
        'financiero': 'Financiero',
        'educacion': 'Educación',
        'salud': 'Salud',
        'asistencia-social': 'Asistencia social',
        'recreativas': 'Recreativas',
        'comercio-productos': 'Comercio de venta de productos',
        'oficinas-consultoria': 'Oficinas y consultoría',
        'servicios-personales': 'Otras actividades de servicios personales'
    };

    function grupoDeClase(clase) {
        clase = String(clase || '');
        return Object.keys(gruposPorClase).find(function (grupo) {
            return gruposPorClase[grupo].includes(clase);
        }) || '';
    }

    function condicion(etiqueta, valor, estado) {
        return { etiqueta: etiqueta, valor: valor, estado: estado || '' };
    }

    function reglaBase(grupo, minLote, areaUtil, existente, obraNueva, cesionario) {
        var condiciones = [];
        if (minLote !== null && minLote !== undefined) condiciones.push(condicion('Área mínima del lote', typeof minLote === 'number' ? minLote + ' m²' : minLote, typeof minLote === 'number' ? 'area-minima' : ''));
        if (areaUtil !== null && areaUtil !== undefined) condiciones.push(condicion('Área útil máxima', typeof areaUtil === 'number' ? areaUtil + ' m²' : areaUtil));
        if (existente) condiciones.push(condicion('Edificación existente', existente));
        if (obraNueva) condiciones.push(condicion('Obra nueva, remodelación o ampliación', obraNueva));
        if (cesionario) condiciones.push(condicion('Establecimiento por cesionario', cesionario));
        return { grupo: nombresGrupo[grupo] || grupo, condiciones: condiciones };
    }

    function restriccionesNormales(zona, clase, contexto) {
        var grupo = grupoDeClase(clase);
        var zonVig = String((contexto && contexto.zonVig) || '').toUpperCase();
        var regla;

        if (zona === 'Uso Mixto Especializado') {
            if (grupo === 'salud') {
                if (zonVig === 'H') return { grupo: nombresGrupo[grupo], sinRestriccion: true, condiciones: [condicion('Zonificación vigente', 'H: permitido sin restricción adicional por este cuadro')] };
                regla = reglaBase(grupo, 500, 2500);
                regla.condiciones.unshift(condicion('Zonificación vigente', 'Aplicable en cualquier zonificación distinta de H'));
                return regla;
            }
            if (['comercio-gastronomico', 'oficinas-consultoria', 'comercio-productos'].includes(grupo)) {
                return reglaBase(grupo, 500, 2500, 'Hasta el 3.er nivel, o en todos los niveles si cuenta con conformidad de obra para tal uso');
            }
            if (grupo === 'asistencia-social') return { grupo: nombresGrupo[grupo], sinRestriccion: true, condiciones: [condicion('Condición', 'Permitido sin restricción adicional por este cuadro')] };
        }

        if (zona === 'Uso Mixto Intensivo') {
            if (['comercio-gastronomico', 'servicios-personales', 'comercio-productos', 'educacion', 'salud'].includes(grupo)) {
                return reglaBase(grupo, null, null, 'Hasta el 2.º nivel, o en todos los niveles si cuenta con conformidad de obra para tal uso');
            }
            if (['alojamiento', 'oficinas-consultoria', 'financiero'].includes(grupo)) {
                return reglaBase(grupo, null, null, 'Hasta el 3.er nivel, o en todos los niveles si cuenta con conformidad de obra para tal uso');
            }
            if (grupo === 'asistencia-social') return { grupo: nombresGrupo[grupo], sinRestriccion: true, condiciones: [condicion('Condición', 'Permitido sin restricción adicional por este cuadro')] };
        }

        if (zona === 'Uso Mixto Metropolitano') {
            if (['comercio-gastronomico', 'servicios-personales', 'comercio-productos', 'educacion', 'salud'].includes(grupo)) {
                return reglaBase(grupo, 300, 1300, 'Hasta el 2.º nivel, o en todos los niveles si cuenta con conformidad de obra para tal uso');
            }
            if (['alojamiento', 'oficinas-consultoria', 'financiero'].includes(grupo)) {
                return reglaBase(grupo, 300, 2200, 'Hasta el 3.er nivel, o en todos los niveles si cuenta con conformidad de obra para tal uso');
            }
            if (grupo === 'asistencia-social') {
                regla = reglaBase(grupo, 300, 2200);
                regla.condiciones.unshift(condicion('Zonificación vigente', 'Únicamente en RDA', zonVig === 'RDA' ? 'cumple' : 'no-verificable'));
                return regla;
            }
        }

        if (zona === 'Uso Mixto Zonal') {
            if (['comercio-gastronomico', 'servicios-personales', 'comercio-productos'].includes(grupo)) {
                return reglaBase(grupo, 400, 1200, 'Hasta el 1.er nivel, o en todos los niveles si cuenta con conformidad de obra para tal uso', 'Hasta el 3.er nivel', 'Hasta el 3.er nivel');
            }
            if (['alojamiento', 'oficinas-consultoria', 'financiero', 'educacion', 'salud'].includes(grupo)) {
                return reglaBase(grupo, 400, 2000, 'Hasta el 2.º nivel, o en todos los niveles si cuenta con conformidad de obra para tal uso', 'Hasta el 3.er nivel', 'Hasta el 3.er nivel');
            }
            if (grupo === 'asistencia-social') {
                regla = reglaBase(grupo, 400, 2000);
                regla.condiciones.unshift(condicion('Zonificación vigente', 'Únicamente en RDM, RDA o CV', ['RDM', 'RDA', 'CV'].includes(zonVig) ? 'cumple' : 'no-verificable'));
                return regla;
            }
        }

        if (zona === 'Uso Mixto Vecinal') {
            if (['servicios-personales', 'comercio-productos'].includes(grupo)) {
                return reglaBase(grupo, 300, 600, 'Hasta el 1.er nivel, o en todos los niveles si cuenta con conformidad de obra para tal uso', 'Hasta el 1.er nivel', 'Hasta el 1.er nivel');
            }
            if (grupo === 'oficinas-consultoria') {
                return reglaBase(grupo, 300, 1200, 'Hasta el 2.º nivel, o en todos los niveles si cuenta con conformidad de obra para tal uso', 'Hasta el 2.º nivel', 'Hasta el 2.º nivel');
            }
            if (grupo === 'salud') {
                regla = reglaBase(grupo, 300, 1200, 'Hasta el 2.º nivel, o en todos los niveles si cuenta con conformidad de obra para tal uso', 'Hasta el 2.º nivel', 'Hasta el 2.º nivel');
                regla.condiciones.unshift(condicion('Ubicación vial', 'Únicamente en la vía Bailetti'));
                return regla;
            }
            if (grupo === 'asistencia-social') return reglaBase(grupo, 300, 1900);
        }

        if (zona === 'Uso Residencial Especial') {
            if (['servicios-personales', 'comercio-productos', 'oficinas-consultoria', 'financiero', 'salud'].includes(grupo)) {
                return reglaBase(grupo, 'Según la edificación preexistente', 'Según el 1.er nivel de la edificación', 'Hasta el 1.er nivel, o en todos los niveles si cuenta con conformidad de obra para tal uso');
            }
        }

        if (zona === 'Uso Residencial Preferente') {
            if (['comercio-productos', 'educacion'].includes(grupo)) {
                return reglaBase(grupo, 400, 700, 'Hasta el 1.er nivel, o en todos los niveles si cuenta con conformidad de obra para tal uso', 'Hasta el 1.er nivel', 'No aplica');
            }
            if (['salud', 'asistencia-social'].includes(grupo)) {
                return reglaBase(grupo, 400, 1300, 'Hasta el 2.º nivel, o en todos los niveles si cuenta con conformidad de obra para tal uso', 'Hasta el 2.º nivel', 'No aplica');
            }
        }

        return { grupo: nombresGrupo[grupo] || 'Clase no agrupada', condiciones: [] };
    }

    function restriccionesZRE(zreId) {
        if (zreId === 'ZRE-1') return reglaBase('Todas las actividades', 100, 200, 'Hasta el 1.er nivel, o en todos los niveles si cuenta con conformidad de obra para tal uso', 'Hasta el 2.º nivel', 'Hasta el 2.º nivel');
        if (zreId === 'ZRE-2') return reglaBase('Todas las actividades', 'Según la edificación preexistente', 200, 'Hasta el 1.er nivel, o en todos los niveles si cuenta con conformidad de obra para tal uso', 'Hasta el 2.º nivel', 'Hasta el 2.º nivel');
        if (zreId === 'ZRE-3') return reglaBase('Todas las actividades', 100, 200, 'Hasta el 1.er nivel, o en todos los niveles si cuenta con conformidad de obra para tal uso', 'Hasta el 2.º nivel', 'Hasta el 2.º nivel');
        return { grupo: 'Todas las actividades', condiciones: [] };
    }

    function evaluarArea(regla, areaM2) {
        var area = Number(areaM2);
        if (!Number.isFinite(area)) return regla;
        regla.condiciones.forEach(function (c) {
            if (c.estado !== 'area-minima') return;
            var minimo = Number(String(c.valor).replace(/[^\d.]/g, ''));
            if (!Number.isFinite(minimo)) return;
            c.estado = area >= minimo ? 'cumple' : 'no-cumple';
            c.detalle = 'Área del lote seleccionado: ' + area.toLocaleString('es-PE', { maximumFractionDigits: 2 }) + ' m²';
        });
        return regla;
    }

    window.RESTRICCIONES_IIUU = {
        grupoDeClase: grupoDeClase,
        obtener: function (zona, clase, contexto) {
            return evaluarArea(restriccionesNormales(zona, clase, contexto || {}), contexto && contexto.areaM2);
        },
        obtenerZRE: function (zreId, contexto) {
            return evaluarArea(restriccionesZRE(zreId), contexto && contexto.areaM2);
        },
        regimenResidencialExclusivo: {
            titulo: 'Régimen transitorio aplicable',
            resumen: 'Excepcionalmente se toma como referencia exclusiva la columna Uso Mixto Vecinal. Solo se muestran los giros marcados con “R”.',
            condiciones: [
                'La clase CIIU debe estar calificada con “R” en la columna Uso Mixto Vecinal.',
                'El giro específico debe pertenecer a esa clase CIIU y estar aprobado mediante regulación distrital.',
                'El establecimiento debe contar con declaratoria de edificación o de fábrica inscrita en SUNARP que identifique el ambiente como tienda, local comercial, comercio o denominación equivalente.',
                'El uso comercial o la actividad debe estar respaldado por una licencia de funcionamiento municipal emitida antes de la publicación de la Ordenanza.',
                'La ubicación, delimitación, área techada y niveles deben coincidir exactamente con el antecedente municipal y con la declaratoria inscrita; no se admite diferencia de área.'
            ],
            nota: 'La declaratoria puede inscribirse después de la publicación solo si corresponde a un uso comercial autorizado previamente. La inscripción posterior, por sí sola, no permite acogerse al régimen.',
            vigencia: 'El régimen no modifica el Uso Residencial Exclusivo y queda sin efecto cuando entre en vigencia la nueva zonificación de San Borja, sin perjuicio de las licencias otorgadas durante su vigencia.',
            cierre: 'El acogimiento no exime del cumplimiento de niveles operacionales, estándares de calidad, seguridad, autorizaciones sectoriales y demás disposiciones aplicables.'
        }
    };
})();
