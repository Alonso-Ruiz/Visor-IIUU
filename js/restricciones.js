// Restricciones vigentes del Índice distrital y del Índice ZRE.
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

    function condicion(etiqueta, valor) {
        return { etiqueta: etiqueta, valor: valor };
    }

    function regla(condiciones, sinRestriccion) {
        return { condiciones: condiciones || [], sinRestriccion: Boolean(sinRestriccion) };
    }

    function restriccionesOrdinarias(zona) {
        var clave = zona === 'Usos Específicos - Hospital' || zona === 'Usos Específicos - Educación'
            ? 'Usos Específicos' : zona;
        var notas = window.datosNotasRestricciones && window.datosNotasRestricciones.distrital;
        var datos = notas && notas[clave];
        if (!datos) {
            return regla([condicion(
                'Restricción del giro',
                'El Índice distrital marca esta actividad con R, pero la hoja Notas - Restricciones no detalla una condición para esta categoría.'
            )]);
        }
        var condiciones = [];
        if (datos.existente) condiciones.push(condicion('Edificación existente', datos.existente));
        if (datos.obraNueva) condiciones.push(condicion('Obra nueva, remodelación o ampliación', datos.obraNueva));
        return regla(condiciones);
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
        var notas = window.datosNotasRestricciones && window.datosNotasRestricciones.zre;
        if (valor === 'X') return 'X';
        return notas && Object.prototype.hasOwnProperty.call(notas, valor) ? 'R' : null;
    }

    function restriccionGiroZRE(giro, zreId, ubicacion) {
        var autorizacion = autorizacionZRE(giro, zreId, ubicacion);
        if (!autorizacion) return regla([]);
        if (autorizacion === 'X') return regla([], true);

        var codigo = giro.ZRE[zreId][ubicacion];
        var datos = window.datosNotasRestricciones.zre[codigo];
        var condiciones = [];
        if (datos.existente) condiciones.push(condicion(codigo + ' · Edificación existente (m² de área útil)', datos.existente));
        if (datos.obraNueva) condiciones.push(condicion(codigo + ' · Obra nueva, remodelación o ampliación', datos.obraNueva));
        return regla(condiciones);
    }

    window.RESTRICCIONES_IIUU = {
        ubicacionesZRE: UBICACIONES_ZRE,
        resolverUbicacionZRE: resolverUbicacionZRE,
        autorizacionZRE: autorizacionZRE,
        obtener: restriccionesOrdinarias,
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
