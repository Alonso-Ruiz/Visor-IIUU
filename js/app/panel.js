
        // --- LÓGICA DEL PANEL ---
        const botonArrastre = document.getElementById('boton-arrastre');
        const botonAlturaPanel = document.getElementById('boton-altura-panel');
        var resumenRestriccionesViaActual = null;
        var zonificacionReglasActual = '';

        function contextoRestricciones(propiedades, vigente, autorizacion) {
            return {
                zonificacionVigente: vigente,
                autorizacion: tipoAutorizacion(autorizacion),
                via: obtenerPropiedad(propiedades, ['VIA COLIND', 'VIA_COLIND', 'VÍA COLINDANTE', 'VIA COLINDANTE']),
                areaM2: obtenerPropiedad(propiedades, ['ÁREA_M2', 'AREA_M2', 'Area_m2', 'AREA']),
                restriccionPoligono: obtenerPropiedad(propiedades, ['RESTRICCIÓN', 'RESTRICCIÓ', 'RESTRICCI�', 'RESTRICCION'])
            };
        }

        function obtenerAreaLote() {
            return loteActual && (loteActual.AREA_M2 || loteActual['ÁREA_M2'] || loteActual['�REA_M2'] || loteActual.Area_ha || loteActual.AREA);
        }

        function escaparHtml(valor) {
            return String(valor === null || valor === undefined ? '' : valor)
                .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
        }

        function obtenerPropiedad(obj, nombres) {
            obj = obj || {};
            for (var i = 0; i < nombres.length; i++) {
                var valor = obj[nombres[i]];
                if (valor !== null && valor !== undefined && String(valor).trim() !== '') return valor;
            }
            return '';
        }

        function obtenerRestriccionPoligono() {
            return obtenerPropiedad(loteActual,
                ['RESTRICCIÓN', 'RESTRICCIÓ', 'RESTRICCI�', 'RESTRICCION']);
        }

        function renderizarRestriccionesGiro(regla, titulo) {
            if (!regla || !regla.condiciones || !regla.condiciones.length) return '';
            var items = regla.condiciones.map(function(c) {
                var estado = '';
                if (c.estado === 'cumple') estado = '<span class="estado-condicion cumple">Cumple según área del lote</span>';
                if (c.estado === 'no-cumple') estado = '<span class="estado-condicion no-cumple">No cumple según área del lote</span>';
                if (c.estado === 'no-verificable') estado = '<span class="estado-condicion revisar">Revisar ubicación</span>';
                return '<li><strong>' + escaparHtml(c.etiqueta) + ':</strong> ' + escaparHtml(c.valor) +
                    (c.detalle ? '<small>' + escaparHtml(c.detalle) + '</small>' : '') + estado + '</li>';
            }).join('');
            return '<div class="bloque-restricciones-giro">' +
                '<div class="titulo-restricciones-giro"><i class="fas fa-clipboard-check"></i> ' + escaparHtml(titulo || 'Restricciones del giro') + '</div>' +
                (regla.grupo ? '<div class="grupo-restriccion">Clase agrupada: ' + escaparHtml(regla.grupo) + '</div>' : '') +
                '<ul>' + items + '</ul></div>';
        }

        function renderizarRestriccionGiroZre(regla) {
            if (!regla || regla.sinRestriccion || !regla.condiciones || !regla.condiciones.length) return '';
            return '<div class="restriccion-giro-zre">' + regla.condiciones.map(function(c) {
                return '<div><strong>' + escaparHtml(c.etiqueta) + ':</strong> ' + escaparHtml(c.valor) + '</div>';
            }).join('') + '</div>';
        }

        function tokensNombreVia(nombre) {
            return String(nombre || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .replace(/\uFFFD/g, '').toLowerCase()
                .replace(/\b(tnte|tnt)\b/g, 'teniente')
                .replace(/\b(av|avenida|jr|jiron|calle|cl|pje|pasaje)\b/g, ' ')
                .replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/)
                .filter(function(t) { return t && !['de', 'del', 'la', 'las', 'el', 'los'].includes(t); });
        }

        function distanciaEdicionUnitaria(a, b) {
            if (a === b) return 0;
            if (Math.abs(a.length - b.length) > 1) return 2;
            var i = 0, j = 0, cambios = 0;
            while (i < a.length && j < b.length) {
                if (a[i] === b[j]) { i++; j++; continue; }
                if (++cambios > 1) return cambios;
                if (a.length > b.length) i++;
                else if (b.length > a.length) j++;
                else { i++; j++; }
            }
            if (i < a.length || j < b.length) cambios++;
            return cambios;
        }

        function coincideNombreVia(nombreBuscado, nombreColindante) {
            var buscado = tokensNombreVia(nombreBuscado);
            var colindante = tokensNombreVia(nombreColindante);
            if (!buscado.length || !colindante.length) return false;

            var direcciones = ['norte', 'sur', 'este', 'oeste'];
            var direccionBuscada = buscado.find(function(t) { return direcciones.includes(t); });
            var direccionColindante = colindante.find(function(t) { return direcciones.includes(t); });
            if (direccionBuscada && direccionColindante && direccionBuscada !== direccionColindante) return false;
            if (direccionBuscada && !direccionColindante) buscado = buscado.filter(function(t) { return t !== direccionBuscada; });
            if (direccionColindante && !direccionBuscada) colindante = colindante.filter(function(t) { return t !== direccionColindante; });

            var coincidencias = buscado.filter(function(token) {
                return colindante.some(function(otro) {
                    return token === otro || (Math.min(token.length, otro.length) >= 5 && distanciaEdicionUnitaria(token, otro) <= 1);
                });
            }).length;
            return coincidencias >= Math.ceil(Math.max(buscado.length, colindante.length) * 0.67);
        }

        function claveZonaActividad(nombreZona) {
            var mapa = {
                'Uso Residencial Exclusivo': 'Uso Mixto Vecinal',
                'Uso Residencial Preferente': 'Uso Residencial Preferente',
                'Uso Residencial Especial': 'Uso Residencial Especial',
                'Uso Mixto Vecinal': 'Uso Mixto Vecinal',
                'Uso Mixto Zonal': 'Uso Mixto Zonal',
                'Uso Mixto Metropolitano': 'Uso Mixto Metropolitano',
                'Uso Mixto Intensivo': 'Uso Mixto Intensivo',
                'Uso Mixto Especializado': 'Uso Mixto Especializado',
                'Uso de Recreación Pública': 'Uso de Recreación Pública',
                'Usos Específicos - Otros Usos': 'Otros Usos',
                'Usos Específicos - Educación': 'Educación',
                'Usos Específicos - Hospital': 'Hospitales'
            };
            return mapa[nombreZona] || nombreZona;
        }

        function cajasCercanasDeVia(segmentos) {
            var margen = 0.00018;
            var cajas = [];
            function agregarLineas(coordenadas) {
                if (!coordenadas || !coordenadas.length) return;
                if (Array.isArray(coordenadas[0]) && typeof coordenadas[0][0] === 'number') {
                    for (var i = 1; i < coordenadas.length; i++) {
                        var a = coordenadas[i - 1], b = coordenadas[i];
                        cajas.push({
                            minX: Math.min(a[0], b[0]) - margen,
                            maxX: Math.max(a[0], b[0]) + margen,
                            minY: Math.min(a[1], b[1]) - margen,
                            maxY: Math.max(a[1], b[1]) + margen
                        });
                    }
                    return;
                }
                coordenadas.forEach(agregarLineas);
            }
            (segmentos || []).forEach(function(feature) {
                if (feature.geometry) agregarLineas(feature.geometry.coordinates);
            });
            return cajas;
        }

        function cajaGeometria(geometria) {
            if (!geometria || !geometria.coordinates) return null;
            var caja = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
            function revisar(coordenadas) {
                if (typeof coordenadas[0] === 'number') {
                    caja.minX = Math.min(caja.minX, coordenadas[0]);
                    caja.maxX = Math.max(caja.maxX, coordenadas[0]);
                    caja.minY = Math.min(caja.minY, coordenadas[1]);
                    caja.maxY = Math.max(caja.maxY, coordenadas[1]);
                    return;
                }
                coordenadas.forEach(revisar);
            }
            revisar(geometria.coordinates);
            return Number.isFinite(caja.minX) ? caja : null;
        }

        function cajasSeCruzan(a, b) {
            return a && b && a.minX <= b.maxX && a.maxX >= b.minX && a.minY <= b.maxY && a.maxY >= b.minY;
        }

        function construirResumenRestriccionesVia(nombreVia, segmentos) {
            var coleccion = window.json_usos_compatibles_0;
            var motor = window.RESTRICCIONES_IIUU;
            var features = coleccion && coleccion.features || [];
            var lotes = new Map();
            var restricciones = new Map();
            var cajasVia = cajasCercanasDeVia(segmentos);

            features.forEach(function(feature, indiceFeature) {
                var propiedades = feature.properties || {};
                var viaColindante = obtenerPropiedad(propiedades, ['VIA COLIND', 'VIA_COLIND', 'VÍA COLINDANTE', 'VIA COLINDANTE']);
                var coincideAtributo = coincideNombreVia(nombreVia, viaColindante);
                if (!coincideAtributo && cajasVia.length) {
                    var cajaLote = cajaGeometria(feature.geometry);
                    coincideAtributo = cajasVia.some(function(cajaVia) { return cajasSeCruzan(cajaLote, cajaVia); });
                }
                if (!coincideAtributo) return;

                var zona = String(propiedades.USOS_COMPA || '').trim();
                if (window.normalizarCategoriaUso) zona = window.normalizarCategoriaUso(zona);
                if (zona === 'Usos Específicos') zona = 'Usos Específicos - Otros Usos';
                if (!zona) return;
                var zonVig = String(propiedades.ZON_VIG || '').trim();
                var idBase = obtenerPropiedad(propiedades, ['CUC', 'COD_LOTE', 'CÓDIGO', 'C�DIGO', 'CODIGO']) || ('poligono-' + indiceFeature);
                var etiquetaLote = obtenerPropiedad(propiedades, ['CÓDIGO', 'C�DIGO', 'CODIGO', 'COD_LOTE', 'CUC']) || ('Polígono ' + (indiceFeature + 1));
                var tramo = obtenerPropiedad(propiedades, ['TRAMO']);
                var idLote = String(idBase) + '|' + zona + '|' + zonVig;
                if (lotes.has(idLote)) return;
                lotes.set(idLote, { etiqueta: String(etiquetaLote), tramo: String(tramo || ''), zona: zona });

                function agregarRestriccion(giro, clase, autorizacion, regla) {
                    if (autorizacion !== 'R') return;
                    if (!regla || !regla.condiciones || !regla.condiciones.length) {
                        regla = { condiciones: [{ etiqueta: 'Régimen de restricción', valor: 'Esta actividad está marcada con R en el índice.' }] };
                    }
                    var codigoGiro = giro.COD_GIRO || ('CIIU ' + clase);
                    var actividad = giro.ACTIVIDAD || giro['DESCRIPCIÓN DE LA CLASE'] || '';
                    var clave = [zona, zonVig, clase, codigoGiro, actividad, JSON.stringify(regla.condiciones)].join('|');
                    if (!restricciones.has(clave)) {
                        restricciones.set(clave, {
                            zona: zona,
                            zonVig: zonVig,
                            clase: String(clase || ''),
                            codigo: String(codigoGiro),
                            actividad: String(actividad),
                            regla: regla,
                            lotes: new Set()
                        });
                    }
                    restricciones.get(clave).lotes.add(idLote);
                }

                if (esZonaReglamentacionEspecial(zona, zonVig)) {
                    var ubicacion = motor && motor.resolverUbicacionZRE ? motor.resolverUbicacionZRE(zonVig, propiedades) : '';
                    if (!ubicacion || !motor) return;
                    (window.datosActividadesZRE || []).forEach(function(giro) {
                        var auth = motor.autorizacionZRE ? motor.autorizacionZRE(giro, zonVig, ubicacion) : null;
                        if (auth !== 'R') return;
                        agregarRestriccion(giro, giro.CLASE, auth, motor.obtenerZRE ? motor.obtenerZRE(giro, zonVig, ubicacion) : null);
                    });
                    return;
                }

                var zonaKey = claveZonaActividad(zona);
                (obtenerActividadesIndice() || []).forEach(function(giro) {
                    var auth = giro.ZONAS && giro.ZONAS[zonaKey];
                    if (!tipoAutorizacion(auth)) return;
                    var vigente = window.ZONIFICACION_IIUU ? window.ZONIFICACION_IIUU.obtener(propiedades) : '';
                    var regla = motor && motor.obtener ? motor.obtener(zona, giro.CLASE,
                        contextoRestricciones(propiedades, vigente, auth)) : null;
                    if (tipoAutorizacion(auth) !== 'R' && (!regla || !regla.condiciones.length)) return;
                    agregarRestriccion(giro, giro.CLASE, 'R', regla);
                });
            });

            return {
                nombre: nombreVia,
                lotes: Array.from(lotes.values()),
                lotesPorId: lotes,
                restricciones: Array.from(restricciones.values())
            };
        }

        function renderizarRestriccionesDeVia(busqueda) {
            var resumen = resumenRestriccionesViaActual;
            var restricciones = resumen ? resumen.restricciones : [];
            if (busqueda) {
                restricciones = restricciones.filter(function(item) {
                    return coincideBusquedaTexto(busqueda, [item.zona, item.codigo, item.actividad, item.clase].join(' '));
                });
            }
            document.getElementById('ventanas-zona').style.display = 'none';
            document.getElementById('ayuda-panel').style.display = 'none';
            document.getElementById('nombre-uso-titulo').textContent = 'Restricciones del giro · ' + (resumen ? resumen.nombre : 'vía');
            document.getElementById('conteo-resumen').innerHTML =
                '<strong>' + (resumen ? resumen.lotes.length : 0) + '</strong> polígonos del frente · ' +
                '<strong>' + restricciones.length + '</strong> entradas de giros restringidos' +
                (busqueda ? ' (filtradas por la búsqueda).' : '.');

            var contenido = restricciones.map(function(item) {
                var titulo = item.zona + ' · ' + item.codigo;
                return '<article class="bloque-restricciones-giro" style="margin-bottom:12px;">' +
                    '<div class="titulo-restricciones-giro">' + escaparHtml(titulo) + '</div>' +
                    '<div style="font-size:12px;margin:5px 0;">' + escaparHtml(item.actividad) + '</div>' +
                    renderizarRestriccionesGiro(item.regla, 'Restricciones del giro') + '</article>';
            }).join('');
            document.getElementById('lista-clases-container').innerHTML = contenido ||
                "<p class='mensaje-vacio'>No se encontraron giros restringidos registrados para esta vía.</p>";
        }

        window.mostrarRestriccionesPorVia = function(nombreVia, segmentos) {
            resumenRestriccionesViaActual = construirResumenRestriccionesVia(nombreVia, segmentos);
            zonaActual = '';
            zonVigActual = '';
            zreUsocomActual = '';
            loteActual = {};
            panel.classList.remove('panel-expandido', 'minimizado');
            document.body.classList.add('panel-abierto');
            sincronizarAlturaPanel();
            if (window.sincronizarBotonDetalleMovil) window.sincronizarBotonDetalleMovil();
            document.getElementById('buscador-actividad').value = '';
            document.getElementById('contenido-scrollable').scrollTop = 0;
            renderizarRestriccionesDeVia('');
        };

        function renderizarRegimenTransitorio() {
            var regimen = window.RESTRICCIONES_IIUU && window.RESTRICCIONES_IIUU.regimenResidencialExclusivo;
            if (!regimen) return '';
            var html = regimen.resumen ? '<p class="regimen-resumen">' + escaparHtml(regimen.resumen) + '</p>' : '';
            if (regimen.condiciones && regimen.condiciones.length) {
                html += '<ol class="regimen-lista">' + regimen.condiciones.map(function(c) {
                    return '<li>' + escaparHtml(c) + '</li>';
                }).join('') + '</ol>';
            }
            if (regimen.nota) html += '<p class="regimen-nota"><strong>Declaratoria posterior:</strong> ' + escaparHtml(regimen.nota) + '</p>';
            if (regimen.vigencia) html += '<p class="regimen-nota"><strong>Vigencia:</strong> ' + escaparHtml(regimen.vigencia) + '</p>';
            if (regimen.cierre) html += '<p class="regimen-nota">' + escaparHtml(regimen.cierre) + '</p>';
            return html;
        }

        function esZonaReglamentacionEspecial(nombreZona, zonVig) {
            return String(nombreZona || '').indexOf('Planes Especiales') === 0 && /^ZRE-\d/.test(String(zonVig || '').trim());
        }

        function usoEspecialDesdeCategoria(nombreZona) {
            var partes = String(nombreZona || '').split(' - ');
            return partes.length > 1 ? partes.slice(1).join(' - ') : '';
        }

        function coincideCatalogoGiros(busqueda, clase) {
            var catalogo = window.datosBuscadorGiros && window.datosBuscadorGiros.giros;
            if (!busqueda || !Array.isArray(catalogo)) return false;
            return catalogo.some(function(giro) {
                if (String(giro.clase || '').trim() !== String(clase || '').trim()) return false;
                var terminos = [giro.giro].concat(giro.buscar || [], giro.nombres_comunes || []);
                return terminos.some(function(termino) {
                    return coincideBusquedaTexto(busqueda, termino);
                });
            });
        }

        function obtenerActividadesIndice() {
            return Array.isArray(window.datosActividadesIndice) && datosActividadesIndice.length
                ? datosActividadesIndice
                : datosActividades;
        }

        function coincideActividadIndice(busqueda, giro) {
            if (!busqueda || !giro) return false;
            var terminos = [giro.ACTIVIDAD, giro.COD_GIRO].concat(giro.BUSQUEDA || [], giro.NOMBRES_PARA_EL_VISOR || []);
            return terminos.some(function(termino) {
                return coincideBusquedaTexto(busqueda, termino);
            });
        }

        function renderizarBusquedaGlobal(busqueda) {
            var contVentanas = document.getElementById('ventanas-zona');
            contVentanas.style.display = 'none';

            if (!busqueda) {
                document.getElementById('nombre-uso-titulo').innerHTML = 'Seleccione un polígono';
                document.getElementById('ayuda-panel').style.display = '';
                document.getElementById('conteo-resumen').innerHTML = 'Haz clic en un polígono del mapa para consultar...';
                document.getElementById('lista-clases-container').innerHTML = '';
                return;
            }

            document.getElementById('nombre-uso-titulo').innerHTML = 'Consulta general';
            document.getElementById('ayuda-panel').style.display = 'none';

            var clasesGlobales = {};
            datosUsos.forEach(function(item) {
                var clase = String(item.Clase || '').trim();
                var descripcion = String(item['Descripción'] || '').trim();
                var coincideUso = coincideBusquedaTexto(busqueda, item['Uso Compatible']) ||
                    coincideBusquedaTexto(busqueda, item['Autorización']);
                var girosClase = obtenerActividadesIndice().filter(function(g) {
                    return String(g.CLASE) === clase;
                });
                var girosCoinciden = girosClase.filter(function(g) {
                    return coincideActividadIndice(busqueda, g) ||
                        coincideBusquedaTexto(busqueda, g.CLASE) ||
                        coincideBusquedaTexto(busqueda, g['DESCRIPCIÓN DE LA CLASE']);
                });
                var coincideClase = coincideBusquedaTexto(busqueda, clase) ||
                    coincideBusquedaTexto(busqueda, descripcion) ||
                    coincideUso;
                if (!coincideClase && !girosCoinciden.length) return;

                if (!clasesGlobales[clase]) {
                    clasesGlobales[clase] = {
                        clase: clase,
                        descripcion: descripcion,
                        usos: [],
                        giros: coincideClase ? girosClase : girosCoinciden
                    };
                }
                clasesGlobales[clase].usos.push(item);
                if (!coincideClase) {
                    clasesGlobales[clase].giros = clasesGlobales[clase].giros.concat(girosCoinciden);
                }
            });

            var clases = Object.values(clasesGlobales).map(function(item) {
                var girosUnicos = {};
                item.giros.forEach(function(g) {
                    girosUnicos[String(g.ACTIVIDAD)] = g;
                });
                item.giros = Object.values(girosUnicos);
                return item;
            });

            document.getElementById('conteo-resumen').innerHTML =
                'Consulta general: <strong>' + clases.length + '</strong> clases CIIU encontradas.';

            var htmlContenido = '';
            clases.forEach(function(item) {
                var usosHtml = '<div class="usos-globales">';
                item.usos.forEach(function(uso) {
                    var esRestringido = String(uso['Autorización']).includes('restricción');
                    var badgeColor = esRestringido ? '#ffca28' : '#4CAF50';
                    var badgeTexto = esRestringido ? '#1d1d1d' : '#fff';
                    usosHtml += '<span class="uso-global-badge" style="background:' + badgeColor + ';color:' + badgeTexto + ';">' +
                        escaparHtml(uso['Uso Compatible']) + '</span>';
                });
                usosHtml += '</div>';

                var girosHtml = '';
                if (item.giros.length > 0) {
                    girosHtml = '<ul class="lista-actividades">';
                    item.giros.forEach(function(g) {
                        var codigoGiro = g.COD_GIRO ? '<small style="color:#666;margin-left:8px;">' + escaparHtml(g.COD_GIRO) + '</small>' : '';
                        girosHtml += '<li><span>' + escaparHtml(g.ACTIVIDAD) + '</span>' + codigoGiro + '</li>';
                    });
                    girosHtml += '</ul>';
                } else {
                    girosHtml = "<p class='mensaje-vacio mensaje-vacio-compacto'>No hay giros específicos detallados para esta clase.</p>";
                }

                htmlContenido += '<div class="tarjeta-clase tarjeta-global">' +
                    '<div class="cabecera-clase"><span class="badge-ciiu">CIIU: ' + escaparHtml(item.clase) + '</span>' +
                    '<span class="etiqueta-transitoria">Consulta general</span></div>' +
                    '<strong class="descripcion-clase">' + escaparHtml(item.descripcion) + '</strong>' +
                    usosHtml + girosHtml + '</div>';
            });

            document.getElementById('lista-clases-container').innerHTML = htmlContenido ||
                "<p class='mensaje-vacio'>No se encontraron clases CIIU o actividades para la búsqueda ingresada.</p>";
        }

        function alternarPanel() {
            var abrir = panel.classList.contains('minimizado');
            panel.classList.toggle('minimizado', !abrir);
            panel.classList.remove('panel-expandido');
            document.body.classList.toggle('panel-abierto', abrir);

            if(!abrir) {
                if(capaLoteResaltado) { map.removeLayer(capaLoteResaltado); capaLoteResaltado = null; }
                if (window.limpiarBordeBloqueSeleccionado) window.limpiarBordeBloqueSeleccionado();
                map.closePopup();
            }

            sincronizarAlturaPanel();
        }

        function sincronizarAlturaPanel() {
            if (!botonAlturaPanel) return;
            var expandido = panel.classList.contains('panel-expandido');
            botonAlturaPanel.setAttribute('aria-label', expandido ? 'Reducir detalle del lote' : 'Expandir detalle del lote');
            botonAlturaPanel.setAttribute('aria-expanded', expandido ? 'true' : 'false');
        }

        function establecerPanelExpandido(expandido) {
            if (panel.classList.contains('minimizado')) return;
            panel.classList.toggle('panel-expandido', expandido);
            sincronizarAlturaPanel();
        }

        botonArrastre.addEventListener('click', alternarPanel);

        (function iniciarBotonDetalleMovil() {
            var botonDetalle = document.getElementById('boton-detalle-movil');
            if (!botonDetalle) return;

            function sincronizarBotonDetalle() {
                var abierto = !panel.classList.contains('minimizado');
                botonDetalle.classList.toggle('detalle-abierto', abierto);
                botonDetalle.setAttribute('aria-expanded', abierto ? 'true' : 'false');
                botonDetalle.setAttribute('aria-label', abierto ? 'Cerrar detalle del lote' : 'Abrir detalle del lote');
            }

            window.sincronizarBotonDetalleMovil = sincronizarBotonDetalle;

            botonDetalle.addEventListener('click', function() {
                if (window.cerrarPanelesMapa) window.cerrarPanelesMapa();
                alternarPanel();
                sincronizarBotonDetalle();
            });

            botonArrastre.addEventListener('click', sincronizarBotonDetalle);
            botonArrastre.addEventListener('touchend', function() {
                setTimeout(sincronizarBotonDetalle, 80);
            }, {passive: true});
            sincronizarBotonDetalle();
        })();

        if (botonAlturaPanel) {
            botonAlturaPanel.addEventListener('click', function(e) {
                e.stopPropagation();
                establecerPanelExpandido(!panel.classList.contains('panel-expandido'));
            });
        }

        (function iniciarNivelesPanelMovil() {
            var cabecera = panel.querySelector('.cabecera-negra');
            if (!cabecera) return;
            var inicioY = 0;

            cabecera.addEventListener('touchstart', function(e) {
                if (e.target.closest('#boton-arrastre, #boton-altura-panel')) return;
                inicioY = e.touches[0].clientY;
            }, {passive: true});

            cabecera.addEventListener('touchend', function(e) {
                if (!inicioY || e.target.closest('#boton-arrastre, #boton-altura-panel')) return;
                var diferencia = e.changedTouches[0].clientY - inicioY;
                inicioY = 0;

                if (diferencia < -42) {
                    establecerPanelExpandido(true);
                } else if (diferencia > 42) {
                    if (panel.classList.contains('panel-expandido')) {
                        establecerPanelExpandido(false);
                    } else {
                        alternarPanel();
                        if (window.sincronizarBotonDetalleMovil) window.sincronizarBotonDetalleMovil();
                    }
                }
            }, {passive: true});
        })();

        window.actualizarLista = function(nombreZona, zonVig, zreUsocom, propiedadesLote, puntoConsulta) {
            if(!nombreZona) return;
            resumenRestriccionesViaActual = null;
            zonaActual      = String(nombreZona).trim();
            zonVigActual    = String(zonVig  || '').trim();
            zreUsocomActual = String(zreUsocom || '').trim();
            loteActual      = propiedadesLote || {};
            zonificacionReglasActual = window.ZONIFICACION_IIUU ? window.ZONIFICACION_IIUU.obtener(loteActual, puntoConsulta) : '';

            panel.classList.remove('panel-expandido');
            panel.classList.remove('minimizado');
            document.body.classList.add('panel-abierto');
            sincronizarAlturaPanel();
            if (window.sincronizarBotonDetalleMovil) window.sincronizarBotonDetalleMovil();

            var esZRE = esZonaReglamentacionEspecial(zonaActual, zonVigActual);
            var tituloPanel = zonaActual;
            if (esZRE) {
                tituloPanel = zonVigActual;
                var usoZre = zreUsocomActual || usoEspecialDesdeCategoria(zonaActual) || 'Planes Especiales';
                if (usoZre) tituloPanel += ' - ' + usoZre;
            }
            document.getElementById('nombre-uso-titulo').innerHTML = tituloPanel;
            document.getElementById('buscador-actividad').value = '';

            // Obs / Restricciones del Uso Compatible (solo para zonas normales)
            var contVentanas = document.getElementById('ventanas-zona');
            var divObs  = document.getElementById('ventana-observaciones');
            var divRest = document.getElementById('ventana-restricciones');
            divRest.style.display = 'none';
            divObs.style.display = 'none';
            document.getElementById('texto-restricciones').innerHTML = '';
            document.getElementById('texto-observaciones').innerHTML = '';

            if (zonaActual === 'Uso Residencial Exclusivo') {
                contVentanas.style.display = 'flex';
                divObs.style.display = 'block';
                divRest.style.display = 'block';
                document.getElementById('texto-observaciones').innerHTML =
                    'La categoría y delimitación del Uso Residencial Exclusivo se mantienen. La consulta siguiente no constituye una modificación de zonificación.';
                document.getElementById('texto-restricciones').innerHTML = renderizarRegimenTransitorio();
            } else if (!esZRE) {
                var zonaParaFiltro = zonaActual === 'Usos Específicos - Otros Usos' ? 'Usos Específicos - Otros Usos' : zonaActual;
                var resultadosZona = datosUsos.filter(f => estandarizarTexto(f['Uso Compatible']) === estandarizarTexto(zonaParaFiltro));
                if (resultadosZona.length > 0) {
                    var obs  = (resultadosZona[0]['Observaciones'] || '').trim();
                    var rest = (resultadosZona[0]['Restricciones'] || '').trim();
                    var zonasConCuadroDetallado = [
                        'Uso Mixto Especializado', 'Uso Mixto Intensivo', 'Uso Mixto Metropolitano',
                        'Uso Mixto Zonal', 'Uso Mixto Vecinal', 'Uso Residencial Preferente'
                    ];
                    if (zonasConCuadroDetallado.includes(zonaActual)) rest = '';
                    contVentanas.style.display = (obs || rest) ? 'flex' : 'none';
                    divObs.style.display  = obs  ? 'block' : 'none';
                    divRest.style.display = rest ? 'block' : 'none';
                    if (obs)  document.getElementById('texto-observaciones').innerHTML = obs;
                    if (rest) document.getElementById('texto-restricciones').innerHTML = rest;
                } else { contVentanas.style.display = 'none'; }
            } else {
                // Para ZRE mostrar nota sobre planes especiales
                contVentanas.style.display = 'flex';
                divObs.style.display  = 'block';
                divRest.style.display = 'none';
                var codigoZre = obtenerPropiedad(loteActual, ['CÓDIGO', 'C�DIGO', 'CODIGO']);
                var ubicacionZre = obtenerPropiedad(loteActual, ['UBICACIÓN', 'UBICACI�N', 'UBICACION']);
                var tramoZre = obtenerPropiedad(loteActual, ['TRAMO']);
                var matrizZre = window.RESTRICCIONES_IIUU && window.RESTRICCIONES_IIUU.resolverUbicacionZRE
                    ? window.RESTRICCIONES_IIUU.resolverUbicacionZRE(zonVigActual, loteActual)
                    : '';
                var detalleZre = '';
                if (codigoZre || tramoZre || ubicacionZre) {
                    detalleZre = '<br><strong>Detalle del polígono:</strong> ' +
                        (codigoZre ? 'Código ' + escaparHtml(codigoZre) : '') +
                        (tramoZre ? (codigoZre ? ' | ' : '') + 'Tramo ' + escaparHtml(tramoZre) : '') +
                        (ubicacionZre ? ((codigoZre || tramoZre) ? ' | ' : '') + escaparHtml(ubicacionZre) : '');
                }
                document.getElementById('texto-observaciones').innerHTML =
                    'Zona de Reglamentación Especial. Los giros y su compatibilidad se rigen por el Plan Especial correspondiente a cada ubicación dentro del ' + zonVigActual + '.' +
                    (matrizZre ? '<br><strong>Matriz aplicable:</strong> ' + escaparHtml(matrizZre) :
                        '<br><strong>Matriz aplicable:</strong> Esta ubicación no corresponde a los frentes comerciales definidos en el cuadro ZRE.') +
                    detalleZre;
            }

            if (!esZRE && window.RESTRICCIONES_IIUU) {
                var generales = window.RESTRICCIONES_IIUU.disposicionesGenerales || [];
                var textoGeneral = '<details class="disposiciones-generales"><summary>Disposiciones generales y licencias existentes</summary>' +
                    generales.map(function (texto) { return '<p>' + escaparHtml(texto) + '</p>'; }).join('') + '</details>';
                var textoRest = document.getElementById('texto-restricciones');
                textoRest.innerHTML = (divRest.style.display === 'none' ? '' : textoRest.innerHTML) + textoGeneral;
                divRest.style.display = 'block';
                contVentanas.style.display = 'flex';
            }
            document.getElementById('contenido-scrollable').scrollTop = 0;
            renderizarResultados();
        }

        // Colores por tipo de autorización

        function renderizarResultados() {
            var busqueda = estandarizarTexto(document.getElementById('buscador-actividad').value);
            if (resumenRestriccionesViaActual) {
                renderizarRestriccionesDeVia(busqueda);
                return;
            }
            if (!zonaActual) {
                renderizarBusquedaGlobal(busqueda);
                return;
            }
            var esZRE    = esZonaReglamentacionEspecial(zonaActual, zonVigActual);
            var zreId    = zonVigActual; // e.g. "ZRE-1"

            // ---- MODO ZRE ----
            if (esZRE) {
                var motorRestricciones = window.RESTRICCIONES_IIUU;
                var matrizZre = motorRestricciones && motorRestricciones.resolverUbicacionZRE
                    ? motorRestricciones.resolverUbicacionZRE(zreId, loteActual)
                    : '';

                if (!matrizZre) {
                    document.getElementById('conteo-resumen').innerHTML =
                        'Mostrando: <strong>0</strong> clases CIIU para la ubicación seleccionada.';
                    document.getElementById('lista-clases-container').innerHTML =
                        "<p class='mensaje-vacio'>El lote no se ubica en uno de los frentes comerciales definidos en la matriz del " + escaparHtml(zreId) + '.</p>';
                    return;
                }

                // Agrupa únicamente los giros compatibles con el frente del lote seleccionado.
                var clasesVistas = {};
                datosActividadesZRE.forEach(function(giro) {
                    var autorizacion = motorRestricciones && motorRestricciones.autorizacionZRE
                        ? motorRestricciones.autorizacionZRE(giro, zreId, matrizZre)
                        : giro.ZRE && giro.ZRE[zreId] && giro.ZRE[zreId][matrizZre];
                    if (autorizacion !== 'X' && autorizacion !== 'R') return;

                    if (!clasesVistas[giro.CLASE]) {
                        clasesVistas[giro.CLASE] = {
                            clase: giro.CLASE, desc: giro['DESCRIPCIÓN DE LA CLASE'],
                            obs: giro.OBSERVACIONES, giros: []
                        };
                    }
                    giro._autorizacionSeleccionada = autorizacion;
                    clasesVistas[giro.CLASE].giros.push(giro);
                });

                var clases = Object.values(clasesVistas);
                if (busqueda) {
                    clases = clases.map(function(c) {
                        var coincideClase = coincideBusquedaTexto(busqueda, c.desc) ||
                            coincideBusquedaTexto(busqueda, c.clase);
                        if (!coincideClase) {
                            c.giros = c.giros.filter(function(giro) {
                                return coincideBusquedaTexto(busqueda, giro.ACTIVIDAD) ||
                                    coincideCatalogoGiros(busqueda, giro.CLASE);
                            });
                        }
                        return c;
                    }).filter(function(c) { return c.giros.length > 0; });
                }

                // Conteos
                var nPerm = 0, nRest = 0;
                clases.forEach(function(c) {
                    if (c.giros.some(function(g) { return g._autorizacionSeleccionada === 'X'; })) nPerm++;
                    if (c.giros.some(function(g) { return g._autorizacionSeleccionada === 'R'; })) nRest++;
                });
                document.getElementById('conteo-resumen').innerHTML =
                    '<strong>Ubicación:</strong> ' + escaparHtml(matrizZre) + '<br>' +
                    'Mostrando: <strong>' + clases.length + '</strong> clases CIIU.<br>' +
                    '<span style="color:#66bb6a;">● ' + nPerm + ' Permitidas</span> | ' +
                    '<span style="color:#d89d00;">● ' + nRest + ' Sujetos a condiciones</span>';

                // Renderiza tarjetas ZRE
                var htmlContenido = '';
                clases.forEach(function(c) {
                    var tieneRestriccion = c.giros.some(function(g) { return g._autorizacionSeleccionada === 'R'; });
                    var c_borde = tieneRestriccion ? '#ffca28' : '#4CAF50';

                    // Cada giro conserva la autorización y, si corresponde, su restricción específica.
                    var girosHtml = '<ul class="lista-actividades">';
                    c.giros.forEach(function(g) {
                        var autorizacion = g._autorizacionSeleccionada;
                        var col = colorAuth(autorizacion);
                        var reglaGiro = motorRestricciones && motorRestricciones.obtenerZRE
                            ? motorRestricciones.obtenerZRE(g, zreId, matrizZre)
                            : null;
                        girosHtml += '<li style="display:flex;justify-content:space-between;align-items:flex-start;gap:4px;flex-wrap:wrap;">' +
                            '<span>' + escaparHtml(g.ACTIVIDAD) + '</span>' +
                            '<span style="background:' + col.bg + ';color:' + col.txt + ';padding:1px 5px;border-radius:3px;font-size:10px;flex-shrink:0;">' + col.label + '</span>' +
                            (g.OBSERVACIONES ? '<small class="nota-actividad-zre">' + escaparHtml(g.OBSERVACIONES) + '</small>' : '') +
                            (autorizacion === 'R' ? renderizarRestriccionGiroZre(reglaGiro) : '') +
                            '</li>';
                    });
                    girosHtml += '</ul>';

                    htmlContenido +=
                        '<div style="background:#fff;border:1px solid #e8e8e8;border-left:5px solid ' + c_borde + ';padding:12px;margin-bottom:12px;border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">' +
                        '<div style="display:flex;justify-content:space-between;margin-bottom:8px;">' +
                        '<span style="background:' + c_borde + ';color:' + (tieneRestriccion?'#000':'#fff') + ';padding:2px 6px;border-radius:3px;font-size:11px;font-weight:bold;">CIIU: ' + escaparHtml(c.clase) + '</span>' +
                        '<span style="font-size:10px;font-weight:bold;color:' + c_borde + ';">' + zreId + '</span>' +
                        '</div>' +
                        '<strong style="font-size:13px;color:#222;display:block;margin-bottom:5px;">' + escaparHtml(c.desc) + '</strong>' +
                        girosHtml +
                        '</div>';
                });

                document.getElementById('lista-clases-container').innerHTML = htmlContenido ||
                    "<p style='color:#666;text-align:center;padding:20px;font-style:italic;'>No hay actividades compatibles para este ZRE.</p>";
                return;
            }

            // ---- MODO ZONAS NORMALES ----
            var zonaParaFiltro = (zonaActual === 'Usos Específicos - Otros Usos') ? 'Usos Específicos - Otros Usos' : zonaActual;
            // Mapeo de nombre de zona del Usos.json al campo ZONAS del Actividades.json
            var zonaKeyMap = {
                'Uso Residencial Exclusivo':  'Uso Residencial Exclusivo',
                'Uso Residencial Preferente': 'Uso Residencial Preferente',
                'Uso Residencial Especial':   'Uso Residencial Especial',
                'Uso Mixto Vecinal':          'Uso Mixto Vecinal',
                'Uso Mixto Zonal':            'Uso Mixto Zonal',
                'Uso Mixto Metropolitano':    'Uso Mixto Metropolitano',
                'Uso Mixto Intensivo':        'Uso Mixto Intensivo',
                'Uso Mixto Especializado':    'Uso Mixto Especializado',
                'Uso de Recreación Pública':  'Uso de Recreación Pública',
                'Usos Específicos - Otros Usos': 'Otros Usos',
                'Usos Específicos - Educación':  'Educación',
                'Usos Específicos - Hospital':   'Hospitales',
            };
            var zonaKeyAct = zonaKeyMap[zonaActual] || zonaActual;

            // En Uso Residencial Exclusivo se aplica exclusivamente la columna
            // Uso Mixto Vecinal y solo a los giros marcados con "R".
            if (zonaActual === 'Uso Residencial Exclusivo') {
                zonaKeyAct = 'Uso Mixto Vecinal';
                var clasesTransitorias = {};
                obtenerActividadesIndice().forEach(function(g) {
                    if (!g.ZONAS || tipoAutorizacion(g.ZONAS[zonaKeyAct]) !== 'R') return;
                    if (busqueda && !coincideActividadIndice(busqueda, g) &&
                        !coincideBusquedaTexto(busqueda, g.CLASE) &&
                        !coincideBusquedaTexto(busqueda, g['DESCRIPCIÓN DE LA CLASE'])) return;
                    if (!clasesTransitorias[g.CLASE]) {
                        clasesTransitorias[g.CLASE] = {
                            Clase: g.CLASE,
                            'Descripción': g['DESCRIPCIÓN DE LA CLASE'],
                            'Uso Compatible': 'Uso Residencial Exclusivo',
                            'Autorización': 'Régimen exclusivo',
                            girosFiltrados: []
                        };
                    }
                    clasesTransitorias[g.CLASE].girosFiltrados.push(g);
                });
                var resultadosTransitorios = Object.values(clasesTransitorias);
                document.getElementById('conteo-resumen').innerHTML =
                    'Régimen exclusivo: <strong>' + resultadosTransitorios.length + '</strong> clases CIIU y <strong>' +
                    resultadosTransitorios.reduce(function(total, c) { return total + c.girosFiltrados.length; }, 0) +
                    '</strong> giros sujetos al cumplimiento conjunto de todas las condiciones.';

                var htmlTransitorio = '';
                resultadosTransitorios.forEach(function(item) {
                    var giros = '<ul class="lista-actividades">' + item.girosFiltrados.map(function(g) {
                        return '<li class="actividad-compatible"><span>' + escaparHtml(g.ACTIVIDAD) + '</span>' +
                            '<span class="badge-condicion">Régimen exclusivo</span></li>';
                    }).join('') + '</ul>';
                    htmlTransitorio += '<div class="tarjeta-clase tarjeta-transitoria">' +
                        '<div class="cabecera-clase"><span class="badge-ciiu">CIIU: ' + escaparHtml(item.Clase) + '</span>' +
                        '<span class="etiqueta-transitoria">Referencia: Uso Mixto Vecinal (R)</span></div>' +
                        '<strong class="descripcion-clase">' + escaparHtml(item['Descripción']) + '</strong>' + giros + '</div>';
                });
                document.getElementById('lista-clases-container').innerHTML = htmlTransitorio ||
                    "<p class='mensaje-vacio'>No se encontraron giros dentro del régimen exclusivo.</p>";
                return;
            }

            var resultados = datosUsos.filter(function(f) {
                return estandarizarTexto(f['Uso Compatible']) === estandarizarTexto(zonaParaFiltro);
            });

            if (busqueda) {
                resultados = resultados.filter(function(f) {
                    var tieneGiro = obtenerActividadesIndice().some(function(g) {
                        var auth = g.ZONAS && g.ZONAS[zonaKeyAct];
                        return String(g.CLASE) === String(f.Clase) && tipoAutorizacion(auth) &&
                               coincideActividadIndice(busqueda, g);
                    });
                    return coincideBusquedaTexto(busqueda, f['Descripción']) ||
                           coincideBusquedaTexto(busqueda, f['Clase']) || tieneGiro;
                });
            }

            var reglasActuales = new Map();
            obtenerActividadesIndice().forEach(function (g) {
                var auth = g.ZONAS && g.ZONAS[zonaKeyAct];
                if (!tipoAutorizacion(auth) || !window.RESTRICCIONES_IIUU) return;
                reglasActuales.set(g, window.RESTRICCIONES_IIUU.obtener(zonaActual, g.CLASE,
                    contextoRestricciones(loteActual, zonificacionReglasActual, auth)));
            });
            resultados = resultados.map(function (item) {
                var tieneCondicion = obtenerActividadesIndice().some(function (g) {
                    var regla = reglasActuales.get(g);
                    return String(g.CLASE) === String(item.Clase) && regla && regla.condiciones.length;
                });
                return tieneCondicion ? Object.assign({}, item, { 'Autorización': 'Permitidas con restricción' }) : item;
            });
            var permitidos    = resultados.filter(r => String(r['Autorización']).includes('Permitidas') && !String(r['Autorización']).includes('restricción')).length;
            var restringidos  = resultados.filter(r => String(r['Autorización']).includes('restricción')).length;
            document.getElementById('conteo-resumen').innerHTML =
                'Mostrando: <strong>' + resultados.length + '</strong> clases CIIU.<br>' +
                '<span style="color:#66bb6a;">● ' + permitidos + ' Permitidas</span> | ' +
                '<span style="color:#d89d00;">● ' + restringidos + ' Con condiciones específicas</span>';

            var htmlContenido = '';
            resultados.forEach(function(item) {
                var esRestringido = String(item['Autorización']).includes('restricción');
                var cCaja  = esRestringido ? '#ffca28' : '#4CAF50';
                var cTexto = esRestringido ? '#000' : '#fff';
                var tAviso = esRestringido ? 'Condiciones detalladas' : 'Permitidas';

                // Giros para esta clase CON su autorización individual en la zona
                var girosDeEstaClase = obtenerActividadesIndice().filter(function(g) {
                    if (String(g.CLASE) !== String(item.Clase)) return false;
                    var auth = g.ZONAS && g.ZONAS[zonaKeyAct];
                    if (!tipoAutorizacion(auth)) return false;
                    if (!busqueda) return true;
                    var coincideClase = coincideBusquedaTexto(busqueda, item['Descripción']) || coincideBusquedaTexto(busqueda, item['Clase']);
                    return coincideClase || coincideActividadIndice(busqueda, g);
                });

                var girosHtml = '';
                if (girosDeEstaClase.length > 0) {
                    girosHtml = '<ul class="lista-actividades">';
                    var restriccionesGirosHtml = '';
                    girosDeEstaClase.forEach(function(g) {
                        var authGiro = g.ZONAS && g.ZONAS[zonaKeyAct];
                        var reglaGiro = reglasActuales.get(g);
                        if (reglaGiro && reglaGiro.condiciones.length) authGiro = 'R';
                        var col = colorAuth(authGiro);
                        var badge = '<span style="background:' + col.bg + ';color:' + col.txt +
                            ';padding:1px 5px;border-radius:3px;font-size:10px;flex-shrink:0;">' + col.label + '</span>';
                        var codigoGiro = g.COD_GIRO ? '<small style="color:#666;margin-right:auto;">' + escaparHtml(g.COD_GIRO) + '</small>' : '';
                        girosHtml += '<li style="display:flex;justify-content:space-between;align-items:flex-start;gap:4px;">' +
                            '<span>' + escaparHtml(g.ACTIVIDAD) + '</span>' + codigoGiro + badge + '</li>';
                        if (reglaGiro && reglaGiro.condiciones.length) {
                            restriccionesGirosHtml += renderizarRestriccionesGiro(
                                reglaGiro,
                                'Restricciones del giro ' + (g.COD_GIRO || ('CIIU ' + g.CLASE))
                            );
                        }
                    });
                    girosHtml += '</ul>';
                    girosHtml += restriccionesGirosHtml;
                    if (girosDeEstaClase[0].OBSERVACIONES) {
                        girosHtml += '<p style="margin:6px 0 0;font-size:10px;color:#666;font-style:italic;">' + girosDeEstaClase[0].OBSERVACIONES + '</p>';
                    }
                } else {
                    girosHtml = "<p style='margin:8px 0 0;font-size:11px;color:#666;font-style:italic;'>* No hay giros específicos detallados.</p>";
                }

                htmlContenido +=
                    '<div style="background:#fff;border:1px solid #e8e8e8;border-left:5px solid ' + cCaja + ';padding:12px;margin-bottom:12px;border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">' +
                    '<div style="display:flex;justify-content:space-between;margin-bottom:8px;">' +
                    '<span style="background:' + cCaja + ';color:' + cTexto + ';padding:2px 6px;border-radius:3px;font-size:11px;font-weight:bold;">CIIU: ' + item['Clase'] + '</span>' +
                    '<span style="font-size:10px;font-weight:bold;color:' + cCaja + ';">' + tAviso + '</span>' +
                    '</div>' +
                    '<strong style="font-size:13px;color:#222;display:block;margin-bottom:5px;">' + item['Descripción'] + '</strong>' +
                    girosHtml +
                    '</div>';
            });

            document.getElementById('lista-clases-container').innerHTML = htmlContenido ||
                "<p style='color:#666;text-align:center;padding:20px;font-style:italic;'>No se encontraron actividades.</p>";
        }

        var buscadorActividad = document.getElementById('buscador-actividad');
        buscadorActividad.addEventListener('input', renderizarResultados);
        buscadorActividad.addEventListener('keyup', renderizarResultados);
        buscadorActividad.addEventListener('change', renderizarResultados);
