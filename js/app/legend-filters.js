(function() {
    window.categoriasUsoActivas = window.categoriasUsoActivas || {};

    window.normalizarCategoriaUso = function(valor) {
        var categoria = String(valor || '');
        if (categoria === 'Usos Específicos' || categoria === 'Otros Usos') return 'Usos Específicos - Otros Usos';
        if (categoria.indexOf('Usos Específicos') === 0) return 'Usos Específicos - Otros Usos';
        return categoria;
    };

    window.categoriaUsoVisible = function(valor) {
        var categoria = window.normalizarCategoriaUso(valor);
        return window.categoriasUsoActivas[categoria] !== false;
    };

    window.aplicarVisibilidadCategoria = function(estilo, feature) {
        if (window.categoriaUsoVisible(feature.properties['USOS_COMPA'])) return estilo;

        var oculto = Object.assign({}, estilo);
        oculto.opacity = 0;
        oculto.fillOpacity = 0;
        oculto.weight = 0;
        return oculto;
    };

    function actualizarCapa(capa) {
        if (!capa || !capa.eachLayer) return;

        capa.eachLayer(function(layer) {
            if (!layer.feature || !layer.setStyle) return;
            layer.setStyle(window.aplicarVisibilidadCategoria(style_usos_compatibles_0_0(layer.feature), layer.feature));
        });
    }

    window.actualizarVisibilidadUsos = function() {
        if (window.layer_usos_compatibles_0) {
            actualizarCapa(window.layer_usos_compatibles_0);
        }

        if (window.layer_usos_compatibles_planes) {
            actualizarCapa(window.layer_usos_compatibles_planes);
        }

        if (window.capaLoteResaltado) {
            map.removeLayer(window.capaLoteResaltado);
            window.capaLoteResaltado = null;
        }
    };
})();
