var map = L.map('map', { zoomControl:false, maxZoom:28, minZoom:1 }).fitBounds([[-12.094993710275856,-77.0100891034669],[-12.085400753536042,-76.99586998020054]]);
        var hash = new L.Hash(map);
        map.attributionControl.setPrefix('<a href="https://github.com/tomchadwin/qgis2web" target="_blank">qgis2web</a> &middot; <a href="https://leafletjs.com">Leaflet</a>');
        
        L.control.zoom({ position: 'topleft' }).addTo(map);
        var bounds_group = new L.featureGroup([]);

        // --- DICCIONARIO DE CONCEPTOS COMPLETOS ---
        const definicionesZonas = {
            "Uso Mixto Especializado": "ConcentraciÃ³n estratÃ©gica de servicios e infraestructuras de salud, educaciÃ³n y usos institucionales a gran escala, compatibles con vivienda de alta densidad.",
            "Uso Mixto Intensivo": "ConcentraciÃ³n estratÃ©gica de actividades y servicios comerciales de nivel metropolitano, financiero y empresarial, que conviven con vivienda de muy alta densidad.",
            "Uso Mixto Metropolitano": "Establecimientos de gran escala que concentran una oferta comercial diversa, supermercados, tiendas por departamento y centros de entretenimiento.",
            "Uso Mixto Zonal": "Establecimientos de mediana escala orientados al abastecimiento y servicios de los sectores residenciales adyacentes, con un impacto vial moderado.",
            "Uso Mixto Vecinal": "Establecimientos de pequeÃ±a escala destinados a cubrir las necesidades diarias de los vecinos, integrados armoniosamente a la trama residencial.",
            "Uso Residencial Preferente": "Zonas predominantemente residenciales que permiten la inclusiÃ³n limitada de servicios y comercios vecinales en primeros pisos sin alterar la tranquilidad.",
            "Uso Residencial Especial": "Zonas con una ubicaciÃ³n especÃ­fica dentro de los Conjuntos Habitacionales o Ã¡reas con caracterÃ­sticas normativas particulares para vivienda.",
            "Uso Residencial Exclusivo": "Ãreas destinadas Ãºnicamente a la vivienda, donde se restringe estrictamente cualquier actividad comercial o de servicios para garantizar la paz vecinal.",
            "Planes Especiales": "Ãreas sujetas a parÃ¡metros y usos definidos por un Plan Urbano EspecÃ­fico debido a su importancia estratÃ©gica, monumental o paisajÃ­stica.",
            "Usos EspecÃ­ficos - Otros Usos": "Ãreas destinadas a equipamientos mayores como bases militares, grandes complejos de salud, universidades o infraestructuras de transporte.",
            "Uso de RecreaciÃ³n PÃºblica": "Espacios zonificados como Zona de RecreaciÃ³n PÃºblica (ZRP), incluyendo parques, plazas y Ã¡reas verdes para el esparcimiento ciudadano."
        };

// --- ESTADO GLOBAL DE LA APLICACION ---
let capaLoteResaltado = null;
let datosVias = []; // datosUsos, datosActividades, datosActividadesZRE cargados via script tags
let zonaActual = "", zonVigActual = "", zreUsocomActual = "";
let panel = document.getElementById('panel-usos');
let capaResaltadoVia = null;

function estandarizarTexto(t) { return (t||"").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase(); }

// Colores por tipo de autorizacion
function colorAuth(auth) {
    if (auth === 'X') return { bg: '#4CAF50', txt: '#fff', label: 'Permitido' };
    if (auth === 'R') return { bg: '#ffca28', txt: '#000', label: 'Con restricción' };
    return { bg: '#555', txt: '#ccc', label: 'No compatible' };
}

