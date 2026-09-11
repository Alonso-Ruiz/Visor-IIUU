        var map = L.map('map', {
            zoomControl: false,
            attributionControl: false,
            maxZoom: 28,
            minZoom: 1,
            wheelDebounceTime: 70,
            wheelPxPerZoomLevel: 90
        }).fitBounds([[-12.094993710275856,-77.0100891034669],[-12.085400753536042,-76.99586998020054]]);
        window.map = map;
        var hash = new L.Hash(map);
        var mapaSatelital = L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
            maxNativeZoom: 22,
            maxZoom: 28,
            opacity: 0.5,
            updateWhenIdle: true,
            updateWhenZooming: false,
            keepBuffer: 3,
            attribution: '&copy; Google'
        }).addTo(map);
        window.mapaSatelital = mapaSatelital;

        L.control.zoom({ position: 'bottomright' }).addTo(map);
        var bounds_group = new L.featureGroup([]);

        // --- DICCIONARIO DE CONCEPTOS COMPLETOS ---
        const definicionesZonas = {
            "Uso Mixto Especializado": "Concentración estratégica de servicios e infraestructuras de salud, educación y usos institucionales a gran escala, compatibles con vivienda de alta densidad.",
            "Uso Mixto Intensivo": "Concentración estratégica de actividades y servicios comerciales de nivel metropolitano, financiero y empresarial, que conviven con vivienda de muy alta densidad.",
            "Uso Mixto Metropolitano": "Establecimientos de gran escala que concentran una oferta comercial diversa, supermercados, tiendas por departamento y centros de entretenimiento.",
            "Uso Mixto Zonal": "Establecimientos de mediana escala orientados al abastecimiento y servicios de los sectores residenciales adyacentes, con un impacto vial moderado.",
            "Uso Mixto Vecinal": "Establecimientos de pequeña escala destinados a cubrir las necesidades diarias de los vecinos, integrados armoniosamente a la trama residencial.",
            "Uso Residencial Preferente": "Zonas predominantemente residenciales que permiten la inclusión limitada de servicios y comercios vecinales en primeros pisos sin alterar la tranquilidad.",
            "Uso Residencial Especial": "Zonas con una ubicación específica dentro de los Conjuntos Habitacionales o áreas con características normativas particulares para vivienda.",
            "Uso Residencial Exclusivo": "Áreas destinadas únicamente a la vivienda, donde se restringe estrictamente cualquier actividad comercial o de servicios para garantizar la paz vecinal.",
            "Planes Especiales": "Áreas sujetas a parámetros y usos definidos por un Plan Urbano Específico debido a su importancia estratégica, monumental o paisajística.",
            "Planes Especiales - Uso Mixto Zonal": "Polígonos de Planes Especiales con compatibilidad orientada a uso mixto zonal, sujetos a las condiciones del ZRE correspondiente.",
            "Planes Especiales - Uso Mixto Vecinal": "Polígonos de Planes Especiales con compatibilidad orientada a uso mixto vecinal, sujetos a las condiciones del ZRE correspondiente.",
            "Usos Específicos - Otros Usos": "Áreas destinadas a equipamientos mayores como bases militares, grandes complejos de salud, universidades o infraestructuras de transporte.",
            "Usos Específicos - Educación": "Áreas destinadas a equipamiento educativo, consultadas como uso específico dentro del índice de compatibilidad.",
            "Usos Específicos - Hospital": "Áreas destinadas a equipamiento de salud, consultadas como uso específico dentro del índice de compatibilidad.",
            "Uso de Recreación Pública": "Espacios zonificados como Zona de Recreación Pública (ZRP), incluyendo parques, plazas y áreas verdes para el esparcimiento ciudadano."
        };

// --- ESTADO GLOBAL DE LA APLICACION ---
let capaLoteResaltado = null;
let datosVias = []; // datosUsos, datosActividades, datosActividadesZRE cargados via script tags
let zonaActual = "", zonVigActual = "", zreUsocomActual = "";
let loteActual = {};
let panel = document.getElementById('panel-usos');
let capaResaltadoVia = null;

function estandarizarTexto(t) { return (t||"").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase(); }

// Colores por tipo de autorizacion
function colorAuth(auth) {
    if (auth === 'X') return { bg: '#4CAF50', txt: '#fff', label: 'Permitido' };
    if (auth === 'R') return { bg: '#ffca28', txt: '#000', label: 'Con restricción' };
    return { bg: '#555', txt: '#ccc', label: 'No compatible' };
}
