
        // --- LÓGICA DEL PANEL ---
        const botonArrastre = document.getElementById('boton-arrastre');

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

        function renderizarCondiciones(regla, titulo) {
            if (!regla || !regla.condiciones || !regla.condiciones.length) return '';
            var items = regla.condiciones.map(function(c) {
                var estado = '';
                if (c.estado === 'cumple') estado = '<span class="estado-condicion cumple">Cumple según área del lote</span>';
                if (c.estado === 'no-cumple') estado = '<span class="estado-condicion no-cumple">No cumple según área del lote</span>';
                if (c.estado === 'no-verificable') estado = '<span class="estado-condicion revisar">Revisar ubicación</span>';
                return '<li><strong>' + escaparHtml(c.etiqueta) + ':</strong> ' + escaparHtml(c.valor) +
                    (c.detalle ? '<small>' + escaparHtml(c.detalle) + '</small>' : '') + estado + '</li>';
            }).join('');
            return '<div class="bloque-condiciones ' + (regla.sinRestriccion ? 'sin-restriccion' : '') + '">' +
                '<div class="titulo-condiciones"><i class="fas fa-clipboard-check"></i> ' + escaparHtml(titulo || 'Condiciones aplicables') + '</div>' +
                (regla.grupo ? '<div class="grupo-restriccion">Clase agrupada: ' + escaparHtml(regla.grupo) + '</div>' : '') +
                '<ul>' + items + '</ul></div>';
        }

        function renderizarRegimenTransitorio() {
            var regimen = window.RESTRICCIONES_IIUU && window.RESTRICCIONES_IIUU.regimenResidencialExclusivo;
            if (!regimen) return '';
            return '<p class="regimen-resumen">' + escaparHtml(regimen.resumen) + '</p>' +
                '<ol class="regimen-lista">' + regimen.condiciones.map(function(c) { return '<li>' + escaparHtml(c) + '</li>'; }).join('') + '</ol>' +
                '<p class="regimen-nota"><strong>Declaratoria posterior:</strong> ' + escaparHtml(regimen.nota) + '</p>' +
                '<p class="regimen-nota"><strong>Vigencia:</strong> ' + escaparHtml(regimen.vigencia) + '</p>' +
                '<p class="regimen-nota">' + escaparHtml(regimen.cierre) + '</p>';
        }

        function esZonaReglamentacionEspecial(nombreZona, zonVig) {
            return String(nombreZona || '').indexOf('Planes Especiales') === 0 && /^ZRE-\d/.test(String(zonVig || '').trim());
        }

        function usoEspecialDesdeCategoria(nombreZona) {
            var partes = String(nombreZona || '').split(' - ');
            return partes.length > 1 ? partes.slice(1).join(' - ') : '';
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
                var coincideUso = estandarizarTexto(item['Uso Compatible']).includes(busqueda) ||
                    estandarizarTexto(item['Autorización']).includes(busqueda);
                var girosClase = datosActividades.filter(function(g) {
                    return String(g.CLASE) === clase;
                });
                var girosCoinciden = girosClase.filter(function(g) {
                    return estandarizarTexto(g.ACTIVIDAD).includes(busqueda) ||
                        estandarizarTexto(g.CLASE).includes(busqueda) ||
                        estandarizarTexto(g['DESCRIPCIÓN DE LA CLASE']).includes(busqueda);
                });
                var coincideClase = estandarizarTexto(clase).includes(busqueda) ||
                    estandarizarTexto(descripcion).includes(busqueda) ||
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
                        girosHtml += '<li><span>' + escaparHtml(g.ACTIVIDAD) + '</span></li>';
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
            panel.classList.toggle('minimizado');
            document.body.classList.toggle('panel-abierto', !panel.classList.contains('minimizado'));

            if(panel.classList.contains('minimizado')) {
                if(capaLoteResaltado) { map.removeLayer(capaLoteResaltado); capaLoteResaltado = null; }
                map.closePopup();
            }
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

        let startY = 0;
        botonArrastre.addEventListener('touchstart', e => startY = e.touches[0].clientY, {passive: true});
        botonArrastre.addEventListener('touchmove', e => {
            let diff = e.touches[0].clientY - startY;
            if (diff > 40) {
                panel.classList.add('minimizado');
                document.body.classList.remove('panel-abierto');
                if(capaLoteResaltado) { map.removeLayer(capaLoteResaltado); capaLoteResaltado = null; }
                map.closePopup();
            }
            else if (diff < -40) {
                panel.classList.remove('minimizado');
                document.body.classList.add('panel-abierto');
            }
        }, {passive: true});

        window.actualizarLista = function(nombreZona, zonVig, zreUsocom, propiedadesLote) {
            if(!nombreZona) return;
            zonaActual      = String(nombreZona).trim();
            zonVigActual    = String(zonVig  || '').trim();
            zreUsocomActual = String(zreUsocom || '').trim();
            loteActual      = propiedadesLote || {};

            panel.classList.remove('minimizado');
            document.body.classList.add('panel-abierto');
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
                        'Uso Mixto Zonal', 'Uso Mixto Vecinal', 'Uso Residencial Especial',
                        'Uso Residencial Preferente'
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
                var detalleZre = '';
                if (codigoZre || tramoZre || ubicacionZre) {
                    detalleZre = '<br><strong>Detalle del polígono:</strong> ' +
                        (codigoZre ? 'Código ' + escaparHtml(codigoZre) : '') +
                        (tramoZre ? (codigoZre ? ' | ' : '') + 'Tramo ' + escaparHtml(tramoZre) : '') +
                        (ubicacionZre ? ((codigoZre || tramoZre) ? ' | ' : '') + escaparHtml(ubicacionZre) : '');
                }
                document.getElementById('texto-observaciones').innerHTML =
                    'Zona de Reglamentación Especial. Los giros y su compatibilidad se rigen por el Plan Especial correspondiente a cada ubicación dentro del ' + zonVigActual + '.' +
                    detalleZre;
            }

            document.getElementById('contenido-scrollable').scrollTop = 0;
            renderizarResultados();
        }

        window.actualizarDetalleRetiro = function(propiedades) {
            var codigo = String(propiedades['CÓDIGO_RE'] || propiedades['CÃ“DIGO_RE'] || propiedades['CODIGO_RE'] || '').trim();
            var area = propiedades['AREA'];
            var areaTexto = isFinite(Number(area)) ? Number(area).toLocaleString('es-PE', { maximumFractionDigits: 2 }) + ' m²' : 'No especificada';

            zonaActual = '';
            zonVigActual = '';
            zreUsocomActual = '';
            loteActual = {};

            panel.classList.remove('minimizado');
            document.body.classList.add('panel-abierto');
            if (window.sincronizarBotonDetalleMovil) window.sincronizarBotonDetalleMovil();

            document.getElementById('nombre-uso-titulo').innerHTML = 'Retiro';
            document.getElementById('buscador-actividad').value = '';
            document.getElementById('ventanas-zona').style.display = 'none';
            document.getElementById('conteo-resumen').innerHTML =
                'Elemento seleccionado: <strong>Retiro con código</strong>';
            document.getElementById('lista-clases-container').innerHTML =
                '<div style="background:#fff;border:1px solid #e8e8e8;border-left:5px solid #9a9a9a;padding:12px;margin-bottom:12px;border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">' +
                    '<div style="display:flex;justify-content:space-between;margin-bottom:8px;gap:8px;align-items:center;">' +
                        '<span style="background:#5f5f5f;color:#fff;padding:2px 6px;border-radius:3px;font-size:11px;font-weight:bold;">Código: ' + (codigo || 'Sin código') + '</span>' +
                        '<span style="font-size:10px;font-weight:bold;color:#5f5f5f;">Retiro</span>' +
                    '</div>' +
                    '<strong style="font-size:13px;color:#222;display:block;margin-bottom:6px;">Área normativa asociada al retiro</strong>' +
                    '<p style="margin:0;font-size:12px;color:#555;">Área: <strong>' + areaTexto + '</strong></p>' +
                '</div>';
            document.getElementById('contenido-scrollable').scrollTop = 0;
        }

        // Colores por tipo de autorización

        function renderizarResultados() {
            var busqueda = estandarizarTexto(document.getElementById('buscador-actividad').value);
            if (!zonaActual) {
                renderizarBusquedaGlobal(busqueda);
                return;
            }
            var esZRE    = esZonaReglamentacionEspecial(zonaActual, zonVigActual);
            var zreId    = zonVigActual; // e.g. "ZRE-1"

            // ---- MODO ZRE ----
            if (esZRE) {
                // Agrupa giros por clase
                var clasesVistas = {};
                datosActividadesZRE.forEach(function(giro) {
                    var zreInfo = giro.ZRE && giro.ZRE[zreId];
                    if (!zreInfo) return; // esta clase no aplica a este ZRE
                    // ¿Al menos un location tiene X o R?
                    var tieneAlguna = Object.values(zreInfo).some(v => v === 'X' || v === 'R');
                    if (!tieneAlguna) return;

                    if (!clasesVistas[giro.CLASE]) {
                        clasesVistas[giro.CLASE] = {
                            clase: giro.CLASE, desc: giro['DESCRIPCIÓN DE LA CLASE'],
                            obs: giro.OBSERVACIONES, giros: []
                        };
                    }
                    clasesVistas[giro.CLASE].giros.push(giro);
                });

                var clases = Object.values(clasesVistas);
                if (busqueda) {
                    clases = clases.filter(function(c) {
                        return estandarizarTexto(c.desc).includes(busqueda) ||
                               estandarizarTexto(c.clase).includes(busqueda) ||
                               c.giros.some(g => estandarizarTexto(g.ACTIVIDAD).includes(busqueda));
                    });
                }

                // Conteos
                var nPerm = 0, nRest = 0;
                clases.forEach(function(c) {
                    var tieneX = c.giros.some(g => Object.values(g.ZRE[zreId]||{}).includes('X'));
                    var tieneR = c.giros.some(g => Object.values(g.ZRE[zreId]||{}).includes('R')) && !tieneX;
                    if (tieneX) nPerm++; else if (tieneR) nRest++;
                });
                document.getElementById('conteo-resumen').innerHTML =
                    'Mostrando: <strong>' + clases.length + '</strong> clases CIIU.<br>' +
                    '<span style="color:#66bb6a;">● ' + nPerm + ' Permitidas</span> | ' +
                    '<span style="color:#d89d00;">● ' + nRest + ' Sujetos a condiciones</span>';

                // Renderiza tarjetas ZRE
                var htmlContenido = '';
                clases.forEach(function(c) {
                    var zreInfo = c.giros[0] && c.giros[0].ZRE && c.giros[0].ZRE[zreId] || {};
                    var todasAuth = [];
                    c.giros.forEach(g => { if(g.ZRE[zreId]) Object.values(g.ZRE[zreId]).forEach(v => { if(v) todasAuth.push(v); }); });
                    var tieneX = todasAuth.includes('X');
                    var c_borde = tieneX ? '#4CAF50' : '#ffca28';

                    // Encabezado de ubicaciones (solo para ZRE-1 que tiene varias)
                    var ubicacionesHtml = '';
                    var locaciones = Object.keys(Object.values(c.giros[0].ZRE[zreId]||{}));
                    var locMap = c.giros[0].ZRE[zreId] || {};
                    var locKeys = Object.keys(locMap);
                    if (locKeys.length > 1) {
                        ubicacionesHtml = '<div style="margin:6px 0 8px 0; display:flex; flex-wrap:wrap; gap:4px;">';
                        locKeys.forEach(function(loc) {
                            var a = locMap[loc];
                            if (!a) return;
                            var col = colorAuth(a);
                            ubicacionesHtml += '<span style="background:' + col.bg + ';color:' + col.txt + ';padding:1px 6px;border-radius:3px;font-size:10px;" title="' + loc + '">' + col.label + ' · ' + loc.substring(0,30) + (loc.length>30?'…':'') + '</span>';
                        });
                        ubicacionesHtml += '</div>';
                    }

                    // Giros con sus autorizaciones por ubicación
                    var girosHtml = '<ul class="lista-actividades">';
                    c.giros.forEach(function(g) {
                        var locs = g.ZRE[zreId] || {};
                        var authBadges = '';
                        Object.entries(locs).forEach(function([loc, a]) {
                            if (!a) return;
                            var col = colorAuth(a);
                            authBadges += '<span style="background:' + col.bg + ';color:' + col.txt + ';padding:1px 5px;border-radius:3px;font-size:10px;margin-left:4px;" title="' + loc + '">' + col.label + '</span>';
                        });
                        girosHtml += '<li style="display:flex;justify-content:space-between;align-items:flex-start;gap:4px;">' +
                            '<span>' + g.ACTIVIDAD + '</span>' +
                            '<span style="flex-shrink:0;">' + authBadges + '</span>' +
                            '</li>';
                    });
                    girosHtml += '</ul>';

                    if (c.obs) {
                        girosHtml += '<p style="margin:6px 0 0;font-size:10px;color:#666;font-style:italic;">' + c.obs + '</p>';
                    }

                    var reglaZre = window.RESTRICCIONES_IIUU ? window.RESTRICCIONES_IIUU.obtenerZRE(zreId, { areaM2: obtenerAreaLote() }) : null;
                    var condicionesHtml = renderizarCondiciones(reglaZre, 'Restricciones del Plan Especial');

                    htmlContenido +=
                        '<div style="background:#fff;border:1px solid #e8e8e8;border-left:5px solid ' + c_borde + ';padding:12px;margin-bottom:12px;border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">' +
                        '<div style="display:flex;justify-content:space-between;margin-bottom:8px;">' +
                        '<span style="background:' + c_borde + ';color:' + (tieneX?'#fff':'#000') + ';padding:2px 6px;border-radius:3px;font-size:11px;font-weight:bold;">CIIU: ' + c.clase + '</span>' +
                        '<span style="font-size:10px;font-weight:bold;color:' + c_borde + ';">' + zreId + '</span>' +
                        '</div>' +
                        '<strong style="font-size:13px;color:#222;display:block;margin-bottom:5px;">' + c.desc + '</strong>' +
                        ubicacionesHtml +
                        girosHtml +
                        condicionesHtml +
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
                datosActividades.forEach(function(g) {
                    if (!g.ZONAS || g.ZONAS[zonaKeyAct] !== 'R') return;
                    if (busqueda && !estandarizarTexto(g.ACTIVIDAD).includes(busqueda) &&
                        !estandarizarTexto(g.CLASE).includes(busqueda) &&
                        !estandarizarTexto(g['DESCRIPCIÓN DE LA CLASE']).includes(busqueda)) return;
                    if (!clasesTransitorias[g.CLASE]) {
                        clasesTransitorias[g.CLASE] = {
                            Clase: g.CLASE,
                            'Descripción': g['DESCRIPCIÓN DE LA CLASE'],
                            'Uso Compatible': 'Uso Residencial Exclusivo',
                            'Autorización': 'Régimen transitorio',
                            girosFiltrados: []
                        };
                    }
                    clasesTransitorias[g.CLASE].girosFiltrados.push(g);
                });
                var resultadosTransitorios = Object.values(clasesTransitorias);
                document.getElementById('conteo-resumen').innerHTML =
                    'Régimen transitorio: <strong>' + resultadosTransitorios.length + '</strong> clases CIIU y <strong>' +
                    resultadosTransitorios.reduce(function(total, c) { return total + c.girosFiltrados.length; }, 0) +
                    '</strong> giros sujetos al cumplimiento conjunto de todas las condiciones.';

                var htmlTransitorio = '';
                resultadosTransitorios.forEach(function(item) {
                    var reglaUmv = window.RESTRICCIONES_IIUU ? window.RESTRICCIONES_IIUU.obtener('Uso Mixto Vecinal', item.Clase, {
                        zonVig: zonVigActual,
                        areaM2: obtenerAreaLote()
                    }) : null;
                    var giros = '<ul class="lista-actividades">' + item.girosFiltrados.map(function(g) {
                        return '<li class="actividad-compatible"><span>' + escaparHtml(g.ACTIVIDAD) + '</span>' +
                            '<span class="badge-condicion">Régimen transitorio</span></li>';
                    }).join('') + '</ul>';
                    htmlTransitorio += '<div class="tarjeta-clase tarjeta-transitoria">' +
                        '<div class="cabecera-clase"><span class="badge-ciiu">CIIU: ' + escaparHtml(item.Clase) + '</span>' +
                        '<span class="etiqueta-transitoria">Referencia: Uso Mixto Vecinal (R)</span></div>' +
                        '<strong class="descripcion-clase">' + escaparHtml(item['Descripción']) + '</strong>' + giros +
                        renderizarCondiciones(reglaUmv, 'Restricciones operativas aplicables') + '</div>';
                });
                document.getElementById('lista-clases-container').innerHTML = htmlTransitorio ||
                    "<p class='mensaje-vacio'>No se encontraron giros dentro del régimen transitorio.</p>";
                return;
            }

            var resultados = datosUsos.filter(function(f) {
                return estandarizarTexto(f['Uso Compatible']) === estandarizarTexto(zonaParaFiltro);
            });

            if (busqueda) {
                resultados = resultados.filter(function(f) {
                    var tieneGiro = datosActividades.some(function(g) {
                        var auth = g.ZONAS && g.ZONAS[zonaKeyAct];
                        return String(g.CLASE) === String(f.Clase) && (auth === 'X' || auth === 'R') &&
                               estandarizarTexto(g.ACTIVIDAD).includes(busqueda);
                    });
                    return estandarizarTexto(f['Descripción']).includes(busqueda) ||
                           estandarizarTexto(f['Clase']).includes(busqueda) || tieneGiro;
                });
            }

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
                var girosDeEstaClase = datosActividades.filter(function(g) {
                    if (String(g.CLASE) !== String(item.Clase)) return false;
                    var auth = g.ZONAS && g.ZONAS[zonaKeyAct];
                    if (auth !== 'X' && auth !== 'R') return false;
                    if (!busqueda) return true;
                    var coincideClase = estandarizarTexto(item['Descripción']).includes(busqueda) || estandarizarTexto(item['Clase']).includes(busqueda);
                    return coincideClase || estandarizarTexto(g.ACTIVIDAD).includes(busqueda);
                });

                var girosHtml = '';
                if (girosDeEstaClase.length > 0) {
                    girosHtml = '<ul class="lista-actividades">';
                    girosDeEstaClase.forEach(function(g) {
                        var authGiro = g.ZONAS && g.ZONAS[zonaKeyAct];
                        var col = colorAuth(authGiro);
                        var badge = '<span style="background:' + col.bg + ';color:' + col.txt +
                            ';padding:1px 5px;border-radius:3px;font-size:10px;flex-shrink:0;">' + col.label + '</span>';
                        girosHtml += '<li style="display:flex;justify-content:space-between;align-items:flex-start;gap:4px;">' +
                            '<span>' + g.ACTIVIDAD + '</span>' + badge + '</li>';
                    });
                    girosHtml += '</ul>';
                    if (girosDeEstaClase[0].OBSERVACIONES) {
                        girosHtml += '<p style="margin:6px 0 0;font-size:10px;color:#666;font-style:italic;">' + girosDeEstaClase[0].OBSERVACIONES + '</p>';
                    }
                } else {
                    girosHtml = "<p style='margin:8px 0 0;font-size:11px;color:#666;font-style:italic;'>* No hay giros específicos detallados.</p>";
                }

                var regla = window.RESTRICCIONES_IIUU ? window.RESTRICCIONES_IIUU.obtener(zonaActual, item.Clase, {
                    zonVig: zonVigActual,
                    areaM2: obtenerAreaLote()
                }) : null;
                var condicionesHtml = renderizarCondiciones(regla, esRestringido ? 'Restricciones específicas' : 'Condiciones aplicables');

                htmlContenido +=
                    '<div style="background:#fff;border:1px solid #e8e8e8;border-left:5px solid ' + cCaja + ';padding:12px;margin-bottom:12px;border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">' +
                    '<div style="display:flex;justify-content:space-between;margin-bottom:8px;">' +
                    '<span style="background:' + cCaja + ';color:' + cTexto + ';padding:2px 6px;border-radius:3px;font-size:11px;font-weight:bold;">CIIU: ' + item['Clase'] + '</span>' +
                    '<span style="font-size:10px;font-weight:bold;color:' + cCaja + ';">' + tAviso + '</span>' +
                    '</div>' +
                    '<strong style="font-size:13px;color:#222;display:block;margin-bottom:5px;">' + item['Descripción'] + '</strong>' +
                    girosHtml +
                    condicionesHtml +
                    '</div>';
            });

            document.getElementById('lista-clases-container').innerHTML = htmlContenido ||
                "<p style='color:#666;text-align:center;padding:20px;font-style:italic;'>No se encontraron actividades.</p>";
        }

        var buscadorActividad = document.getElementById('buscador-actividad');
        buscadorActividad.addEventListener('input', renderizarResultados);
        buscadorActividad.addEventListener('keyup', renderizarResultados);
        buscadorActividad.addEventListener('change', renderizarResultados);
