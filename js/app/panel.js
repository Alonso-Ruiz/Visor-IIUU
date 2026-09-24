
        // --- LÓGICA DEL PANEL ---
        const botonArrastre = document.getElementById('boton-arrastre');
        const botonAlturaPanel = document.getElementById('boton-altura-panel');

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

        function renderizarRestriccionesGiro(regla, titulo, detalleZre) {
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
                '<ul>' + items + '</ul>' + (detalleZre || '') + '</div>';
        }

        function renderizarZreDelGiro(giro) {
            if (!Array.isArray(window.datosActividadesZRE)) return '';
            var filaZre = window.datosActividadesZRE.find(function(fila) {
                return String(fila.CLASE) === String(giro.CLASE) && String(fila['N°']) === String(giro['N°']);
            });
            if (!filaZre || !filaZre.ZRE) return '';

            var notas = window.datosNotasRestricciones && window.datosNotasRestricciones.zre || {};
            var codigos = {};
            Object.keys(filaZre.ZRE).forEach(function(zre) {
                Object.keys(filaZre.ZRE[zre]).forEach(function(nombre) {
                    var codigo = filaZre.ZRE[zre][nombre];
                    if (notas[codigo]) codigos[codigo] = true;
                });
            });
            var listaCodigos = Object.keys(codigos).sort();
            if (!listaCodigos.length) return '';
            var restricciones = listaCodigos.map(function(codigo) {
                var nota = notas[codigo];
                return '<li><strong class="codigo-restriccion-zre">' + escaparHtml(codigo) + '</strong>' +
                    '<div>Edificación existente: ' + escaparHtml(nota.existente) + '</div>' +
                    '<div>Obra nueva, remodelación o ampliación: ' + escaparHtml(nota.obraNueva) + '</div></li>';
            }).join('');
            return '<div class="detalle-zre-giro"><ul>' + restricciones + '</ul></div>';
        }

        function renderizarRestriccionGiroZre(regla) {
            if (!regla || regla.sinRestriccion || !regla.condiciones || !regla.condiciones.length) return '';
            return '<div class="restriccion-giro-zre">' + regla.condiciones.map(function(c) {
                return '<div><strong>' + escaparHtml(c.etiqueta) + ':</strong> ' + escaparHtml(c.valor) + '</div>';
            }).join('') + '</div>';
        }

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

        window.actualizarLista = function(nombreZona, zonVig, zreUsocom, propiedadesLote) {
            if(!nombreZona) return;
            zonaActual      = String(nombreZona).trim();
            zonVigActual    = String(zonVig  || '').trim();
            zreUsocomActual = String(zreUsocom || '').trim();
            loteActual      = propiedadesLote || {};

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

            document.getElementById('contenido-scrollable').scrollTop = 0;
            renderizarResultados();
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
                    var giros = '<ul class="lista-actividades">' + item.girosFiltrados.map(function(g) {
                        return '<li class="actividad-compatible"><span>' + escaparHtml(g.ACTIVIDAD) + '</span>' +
                            '<span class="badge-condicion">Régimen transitorio</span></li>';
                    }).join('') + '</ul>';
                    htmlTransitorio += '<div class="tarjeta-clase tarjeta-transitoria">' +
                        '<div class="cabecera-clase"><span class="badge-ciiu">CIIU: ' + escaparHtml(item.Clase) + '</span>' +
                        '<span class="etiqueta-transitoria">Referencia: Uso Mixto Vecinal (R)</span></div>' +
                        '<strong class="descripcion-clase">' + escaparHtml(item['Descripción']) + '</strong>' + giros + '</div>';
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
                    var tieneGiro = obtenerActividadesIndice().some(function(g) {
                        var auth = g.ZONAS && g.ZONAS[zonaKeyAct];
                        return String(g.CLASE) === String(f.Clase) && tipoAutorizacion(auth) &&
                               coincideActividadIndice(busqueda, g);
                    });
                    return coincideBusquedaTexto(busqueda, f['Descripción']) ||
                           coincideBusquedaTexto(busqueda, f['Clase']) || tieneGiro;
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
                        var col = colorAuth(authGiro);
                        var badge = '<span style="background:' + col.bg + ';color:' + col.txt +
                            ';padding:1px 5px;border-radius:3px;font-size:10px;flex-shrink:0;">' + col.label + '</span>';
                        var codigoGiro = g.COD_GIRO ? '<small style="color:#666;margin-right:auto;">' + escaparHtml(g.COD_GIRO) + '</small>' : '';
                        girosHtml += '<li style="display:flex;justify-content:space-between;align-items:flex-start;gap:4px;">' +
                            '<span>' + escaparHtml(g.ACTIVIDAD) + '</span>' + codigoGiro + badge + '</li>';
                        if (tipoAutorizacion(authGiro) === 'R' && window.RESTRICCIONES_IIUU && window.RESTRICCIONES_IIUU.obtener) {
                            var reglaGiro = window.RESTRICCIONES_IIUU.obtener(zonaActual, g.CLASE, {
                                zonVig: zonVigActual,
                                areaM2: obtenerAreaLote()
                            });
                            restriccionesGirosHtml += renderizarRestriccionesGiro(
                                reglaGiro,
                                'Restricciones del giro ' + (g.COD_GIRO || ('CIIU ' + g.CLASE)),
                                renderizarZreDelGiro(g)
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
