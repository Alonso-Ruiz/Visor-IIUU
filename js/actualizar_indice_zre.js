// Ajustes de la columna "Observaciones" del índice ZRE vigente.
(function () {
    'use strict';

    var observaciones = {
        '1071-01': 'mín. 50, hasta 100',
        '1071-02': 'min 100 hasta todo el área del lote',
        '1071-03': 'mín. 50, hasta 100',
        '1410-01': 'min 100 hasta todo el área del lote',
        '1410-02': 'mín. 50, hasta 100',
        '1410-03': 'min 100 hasta todo el área del lote'
    };

    (window.datosActividadesZRE || []).forEach(function (giro) {
        var numero = String(giro['N°'] || '').padStart(2, '0');
        giro.OBSERVACIONES = observaciones[giro.CLASE + '-' + numero] || '';
    });
})();
