// Reglas de restricción del Índice de Usos de San Borja.
// Las restricciones ordinarias provienen de IIUU.docx y las restricciones
// de ZRE se leen por giro y ubicación desde datosActividadesZRE.
(function () {
    'use strict';

    var UBICACIONES_ZRE = {
        'ZRE-1': {
            sanJuanCalles: 'San Juan Masías - Calle El Comercio, Jr. De la Historia y Av. De la Arqueología',
            sanJuanAvenidas: 'San Juan Masías - Av. Aviación y Av. Canadá',
            elBosque: 'El Bosque y El Bosque de San Borja',
            pequenosAgricultores: 'Pequeños Agricultores Todos los Santos'
        },
        'ZRE-2': {
            calles: 'Papa Juan XXIII - Calle Géminis, Calle Gamma, Calle Joaquín Madrid y Calle Alfa',
            avenidas: 'Papa Juan XXIII - Av. Aviación y Av. Angamos Este'
        },
        'ZRE-3': { unica: 'Área rústica del Subsector 12-A' },
        'ZRE-4': { unica: 'Centro Cultural de la Nación' }
    };

    function normalizar(valor) {
        return String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .toLowerCase().replace(/\s+/g, ' ').trim();
    }

    function contiene(texto, opciones) {
        return opciones.some(function (opcion) { return texto.indexOf(opcion) !== -1; });
    }

    function propiedad(objeto, nombres) {
        objeto = objeto || {};
        for (var i = 0; i < nombres.length; i++) {
            var valor = objeto[nombres[i]];
            if (valor !== null && valor !== undefined && String(valor).trim() !== '') return valor;
        }
        return '';
    }

    function condicion(etiqueta, valor, estado) {
        return { etiqueta: etiqueta, valor: valor, estado: estado || '' };
    }

    function regla(condiciones, sinRestriccion) {
        return { condiciones: condiciones || [], sinRestriccion: Boolean(sinRestriccion) };
    }

    // Reglas de la hoja "Notas - Restricciones". Se muestran por giro cuando
    // la matriz de compatibilidad devuelve una combinación como R-01/R-05.
    var REGLAS_NOTAS = {
        'R-01': {
            dimension: 'Intensidad / área',
            referencia: 'Área máxima de proximidad',
            existente: 'El área techada del establecimiento no supera 60 m².',
            obraNueva: 'El área techada del establecimiento no supera 100 m².'
        },
        'R-02': {
            dimension: 'Intensidad / área',
            referencia: 'Área máxima de pequeña escala',
            existente: 'El área techada del establecimiento no supera 150 m².',
            obraNueva: 'El área techada del establecimiento no supera 250 m².'
        },
        'R-03': {
            dimension: 'Localización / nivel y acceso',
            referencia: 'Primer nivel con acceso independiente',
            existente: 'Solo en primer nivel, con acceso directo e independiente desde la vía pública. El público no accede por halls, escaleras ni áreas comunes de uso residencial.',
            obraNueva: 'Igual que en edificación existente. El proyecto puede habilitar el acceso independiente.'
        },
        'R-04': {
            dimension: 'Intensidad / capacidad',
            referencia: 'Capacidad máxima de usuarios',
            existente: 'El aforo del establecimiento no supera 50 personas.',
            obraNueva: 'El aforo del establecimiento no supera 100 personas.'
        },
        'R-05': {
            dimension: 'Intensidad / almacenamiento',
            referencia: 'Almacenamiento complementario',
            existente: 'El almacén no supera el 30 % del área del establecimiento. No se almacena mercadería para abastecer a otros establecimientos.',
            obraNueva: 'El almacén no supera el 40 % del área del establecimiento, con la misma condición.'
        },
        'R-06': {
            dimension: 'Intensidad / carga y descarga',
            referencia: 'Abastecimiento con vehículo liviano',
            existente: 'La carga y descarga se realiza solo con vehículos de categoría N1 (hasta 3,5 t de peso bruto). El horario se rige por el Reglamento de Niveles Operacionales y Estándares de Calidad.',
            obraNueva: 'Si el proyecto incorpora un patio de maniobras dentro del predio, se admiten vehículos de categoría N2.'
        },
        'R-07': {
            dimension: 'Intensidad / operación vehicular',
            referencia: 'Frente, acceso y operación vehicular por la vía de la categoría',
            existente: 'El lote tiene frente a la vía o tramo que le asigna la categoría y los accesos se dan por esa vía. La espera, el embarque y la maniobra se realizan dentro del predio o en una bahía autorizada.',
            obraNueva: 'Igual que en edificación existente. El proyecto resuelve los accesos y la maniobra dentro del predio.'
        },
        'R-08': {
            dimension: 'Localización / lote',
            referencia: 'Área mínima de lote',
            existente: 'El lote tiene como mínimo 500 m².',
            obraNueva: 'El lote tiene como mínimo 500 m². Se puede alcanzar por acumulación de lotes en el proyecto de edificación.'
        },
        'R-09': {
            dimension: 'Localización / edificación',
            referencia: 'Edificación sin unidades de vivienda',
            existente: 'El establecimiento se ubica en una edificación que no tiene unidades de vivienda.',
            obraNueva: 'Se admite en edificación mixta si el proyecto separa los accesos y las circulaciones verticales del establecimiento respecto de las del uso residencial.'
        },
        'R-10': {
            dimension: 'Localización / distancia',
            referencia: 'Distancia mínima a usos sensibles',
            existente: 'El lote está a no menos de 100 m de lotes con educación básica o establecimientos de salud con internamiento, medidos en línea recta entre los linderos más próximos.',
            obraNueva: 'Igual que en edificación existente.'
        },
        'R-11': {
            dimension: 'Localización / uso complementario',
            referencia: 'Complementario al equipamiento principal',
            existente: 'La actividad es complementaria al uso principal del lote, ocupa como máximo el 20 % del área techada y no sustituye ni altera la finalidad del equipamiento.',
            obraNueva: 'Igual que en edificación existente.'
        },
        'R-12': {
            dimension: 'Localización / espacio público',
            referencia: 'Vinculado a la gestión del espacio público',
            existente: 'Solo mediante los mecanismos de gestión y aprovechamiento del espacio público conforme a la Ley N.º 31199 y su reglamento.',
            obraNueva: 'No aplica: no se genera edificación nueva en ZRP.'
        }
    };

    function restriccionesPorCodigos(codigos) {
        var condiciones = [];
        var referencias = String(codigos || '').split('/').map(function (codigo) { return codigo.trim(); }).filter(Boolean);
        referencias.forEach(function (codigo) {
            var datos = REGLAS_NOTAS[codigo];
            if (!datos) return;
            condiciones.push(condicion(codigo + ' · ' + datos.referencia + ' · Edificación existente', datos.existente));
            condiciones.push(condicion(codigo + ' · ' + datos.referencia + ' · Obra nueva, remodelación o ampliación', datos.obraNueva));
        });
        if (referencias.length > 1) {
            condiciones.push(condicion('Aplicación conjunta', 'Las referencias se cumplen de forma acumulativa. Si una categoría fija un área menor, prevalece el límite menor.'));
        }
        return regla(condiciones);
    }

    function conExcepcionPorConformidad(condiciones) {
        condiciones.push(condicion(
            'Edificación existente con conformidad de obra',
            'La limitación de nivel no se aplica cuando la edificación cuenta con conformidad de obra para ese uso.'
        ));
        return condiciones;
    }

    function evaluarAreaLote(resultado, areaM2) {
        var area = Number(areaM2);
        if (!Number.isFinite(area)) return resultado;
        resultado.condiciones.forEach(function (item) {
            if (item.estado !== 'area-minima' && item.estado !== 'area-maxima') return;
            var limite = Number(String(item.valor).replace(/[^\d.]/g, ''));
            if (!Number.isFinite(limite)) return;
            item.estado = item.estado === 'area-minima'
                ? (area >= limite ? 'cumple' : 'no-cumple')
                : (area <= limite ? 'cumple' : 'no-cumple');
            item.detalle = 'Área del lote seleccionado: ' + area.toLocaleString('es-PE', { maximumFractionDigits: 2 }) + ' m²';
        });
        return resultado;
    }

    function zonificacionEsEquipamiento(zonVig) {
        var zona = normalizar(zonVig).replace(/\s/g, '');
        return zona === 'e' || zona === 'h' || zona === 'ou' ||
            zona === 'zspc(e)' || zona === 'zspc(h)' || zona === 'zspc(ou)';
    }

    function restriccionesOrdinarias(zona, contexto) {
        contexto = contexto || {};
        var condiciones;
        if (zona === 'Uso Mixto Especializado') {
            if (zonificacionEsEquipamiento(contexto.zonVig)) {
                return regla([
                    condicion('Zonificación vigente', 'En lotes zonificados como ZSPC (E), ZSPC (H) u OU no existe restricción de área ni de nivel por compatibilidad, tanto para edificaciones existentes como para obra nueva, remodelación o ampliación.')
                ], true);
            }
            condiciones = [
                condicion('Superficie mínima del lote', '500 m²', 'area-minima'),
                condicion('Edificación existente', 'Hasta el tercer nivel.'),
                condicion('Obra nueva, remodelación o ampliación', 'Sin límite de área ni de nivel por compatibilidad.')
            ];
            return evaluarAreaLote(regla(conExcepcionPorConformidad(condiciones)), contexto.areaM2);
        }

        if (zona === 'Uso Mixto Intensivo') {
            return regla([
                condicion('Edificación existente', 'Sin límite de área ni de nivel por compatibilidad.'),
                condicion('Obra nueva, remodelación o ampliación', 'Sin límite de área ni de nivel por compatibilidad.')
            ], true);
        }

        if (zona === 'Uso Mixto Metropolitano') {
            condiciones = [
                condicion('Edificación existente', 'Área útil máxima de 1 000 m² y hasta el tercer nivel.', 'area-maxima'),
                condicion('Obra nueva, remodelación o ampliación', 'Sin límite de área ni de nivel por compatibilidad.')
            ];
            return evaluarAreaLote(regla(conExcepcionPorConformidad(condiciones)), contexto.areaM2);
        }

        if (zona === 'Uso Mixto Zonal') {
            condiciones = [
                condicion('Edificación existente', 'Área útil máxima de 750 m² y hasta el tercer nivel.', 'area-maxima'),
                condicion('Obra nueva, remodelación o ampliación', 'Sin límite de área por compatibilidad y hasta el tercer nivel.')
            ];
            return evaluarAreaLote(regla(conExcepcionPorConformidad(condiciones)), contexto.areaM2);
        }

        if (zona === 'Uso Mixto Vecinal') {
            condiciones = [
                condicion('Edificación existente', 'Área útil máxima de 500 m² y hasta el primer nivel.', 'area-maxima'),
                condicion('Obra nueva, remodelación o ampliación', 'Sin límite de área por compatibilidad y hasta el segundo nivel.')
            ];
            return evaluarAreaLote(regla(conExcepcionPorConformidad(condiciones)), contexto.areaM2);
        }

        if (zona === 'Uso Residencial Preferente') {
            condiciones = [
                condicion('Edificación existente', 'Área máxima de 300 m² del establecimiento, hasta el primer nivel y únicamente en predios en esquina.', 'area-maxima'),
                condicion('Obra nueva, remodelación o ampliación', 'Sin límite de área por compatibilidad y hasta el primer nivel.')
            ];
            return evaluarAreaLote(regla(conExcepcionPorConformidad(condiciones)), contexto.areaM2);
        }

        if (zona === 'Uso de Recreación Pública') {
            return regla([
                condicion('R-13 · Edificación existente', 'Las actividades se permiten exclusivamente en áreas calificadas como ZRP y mediante mecanismos de gestión y aprovechamiento del espacio público conforme a la normativa vigente.'),
                condicion('R-13 · Obra nueva, remodelación o ampliación', 'No aplica: no se genera edificación nueva en ZRP.')
            ]);
        }

        if (String(zona || '').indexOf('Usos Específicos') === 0) {
            return regla([
                condicion('R-13 · Edificación existente', 'En lotes ZSPC (E), ZSPC (H) u OU, el uso principal debe corresponder al equipamiento educativo, de salud u otros usos. Las actividades complementarias no deben sustituir ni alterar la finalidad del equipamiento.'),
                condicion('R-13 · Obra nueva, remodelación o ampliación', 'No aplica como ampliación autónoma: la actividad debe mantener su carácter complementario al equipamiento principal.')
            ]);
        }

        return regla([]);
    }

    function resolverUbicacionZRE(zreId, propiedadesLote) {
        var via = normalizar(propiedad(propiedadesLote, ['VIA COLIND', 'VIA_COLIND', 'VÍA COLINDANTE', 'VIA COLINDANTE']));
        var uso = normalizar(propiedad(propiedadesLote, ['ZRE_USOCOM']));

        if (zreId === 'ZRE-1') {
            if (contiene(via, ['aviacion', 'canada'])) return UBICACIONES_ZRE['ZRE-1'].sanJuanAvenidas;
            if (contiene(via, ['comercio', 'historia', 'arqueologia'])) return UBICACIONES_ZRE['ZRE-1'].sanJuanCalles;
            if (contiene(via, ['san luis', 'paseo del bosque'])) return UBICACIONES_ZRE['ZRE-1'].elBosque;
            if (contiene(via, ['roma', 'joaquin madrid', 'melissa'])) return UBICACIONES_ZRE['ZRE-1'].pequenosAgricultores;
            if (uso.indexOf('mixto controlado') !== -1) return UBICACIONES_ZRE['ZRE-1'].sanJuanAvenidas;
            if (uso.indexOf('mixto restringido') !== -1) return UBICACIONES_ZRE['ZRE-1'].sanJuanCalles;
            return '';
        }

        if (zreId === 'ZRE-2') {
            if (contiene(via, ['aviacion', 'angamos'])) return UBICACIONES_ZRE['ZRE-2'].avenidas;
            if (contiene(via, ['geminis', 'gamma', 'joaquin madrid', 'alfa', 'lambda'])) return UBICACIONES_ZRE['ZRE-2'].calles;
            if (uso.indexOf('mixto controlado') !== -1) return UBICACIONES_ZRE['ZRE-2'].avenidas;
            if (uso.indexOf('mixto restringido') !== -1) return UBICACIONES_ZRE['ZRE-2'].calles;
            return '';
        }

        if (zreId === 'ZRE-3') return UBICACIONES_ZRE['ZRE-3'].unica;
        if (zreId === 'ZRE-4') return UBICACIONES_ZRE['ZRE-4'].unica;
        return '';
    }

    function autorizacionZRE(giro, zreId, ubicacion) {
        if (!giro || !ubicacion || !giro.ZRE || !giro.ZRE[zreId]) return null;
        var valor = giro.ZRE[zreId][ubicacion];
        return valor === 'X' || valor === 'R' ? valor : null;
    }

    function restriccionGiroZRE(giro, zreId, ubicacion) {
        var autorizacion = autorizacionZRE(giro, zreId, ubicacion);
        if (!autorizacion) return regla([]);
        if (autorizacion === 'X') {
            return regla([condicion('Compatibilidad', 'Permitido sin restricción adicional por compatibilidad de uso.')], true);
        }

        var datos = giro.RESTRICCIONES && giro.RESTRICCIONES[zreId] && giro.RESTRICCIONES[zreId][ubicacion];
        if (!datos) {
            return regla([condicion(
                'Validación requerida',
                'La matriz principal marca este giro con R, pero la hoja auxiliar no consigna un parámetro específico. Requiere validación técnica antes de autorizar.'
            )]);
        }
        var condiciones = [];
        if (datos.existente) condiciones.push(condicion('Edificación existente (m² de área útil)', datos.existente));
        if (datos.obraNueva) condiciones.push(condicion('Obra nueva, remodelación o ampliación', datos.obraNueva));
        return regla(condiciones);
    }

    window.RESTRICCIONES_IIUU = {
        ubicacionesZRE: UBICACIONES_ZRE,
        resolverUbicacionZRE: resolverUbicacionZRE,
        autorizacionZRE: autorizacionZRE,
        obtenerPorCodigos: restriccionesPorCodigos,
        obtener: function (zona, clase, contexto) {
            return restriccionesOrdinarias(zona, contexto || {});
        },
        obtenerZRE: restriccionGiroZRE,
        regimenResidencialExclusivo: {
            titulo: 'Condición de compatibilidad',
            resumen: 'El Uso Residencial Exclusivo mantiene su carácter residencial.',
            condiciones: [
                'Se consideran compatibles las unidades inmobiliarias que cuenten con declaratoria de fábrica inscrita, con uso de tienda, local comercial o uso equivalente, conforme a la normativa vigente.'
            ]
        }
    };
})();
