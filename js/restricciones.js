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
