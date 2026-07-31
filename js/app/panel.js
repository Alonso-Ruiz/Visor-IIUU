
        // --- LÓGICA DEL PANEL ---
        const botonArrastre = document.getElementById('boton-arrastre');

        function alternarPanel() {
            panel.classList.toggle('minimizado');
            document.body.classList.toggle('panel-abierto', !panel.classList.contains('minimizado'));

            if(panel.classList.contains('minimizado')) {
                if(capaLoteResaltado) { map.removeLayer(capaLoteResaltado); capaLoteResaltado = null; }
                map.closePopup();
            }
        }

        botonArrastre.addEventListener('click', alternarPanel);

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

        window.actualizarLista = function(nombreZona, zonVig, zreUsocom) {
            if(!nombreZona) return;
            zonaActual      = String(nombreZona).trim();
            zonVigActual    = String(zonVig  || '').trim();
            zreUsocomActual = String(zreUsocom || '').trim();

            panel.classList.remove('minimizado');
            document.body.classList.add('panel-abierto');

            var esZRE = (zonaActual === 'Planes Especiales') && /^ZRE-\d/.test(zonVigActual);
            var tituloPanel = zonaActual;
            if (esZRE) {
                tituloPanel = zonVigActual;
                if (zreUsocomActual) tituloPanel += ' · ' + zreUsocomActual;
            }
            document.getElementById('nombre-uso-titulo').innerHTML = tituloPanel;
            document.getElementById('buscador-actividad').value = '';

            // Obs / Restricciones del Uso Compatible (solo para zonas normales)
            var contVentanas = document.getElementById('ventanas-zona');
            var divObs  = document.getElementById('ventana-observaciones');
            var divRest = document.getElementById('ventana-restricciones');

            if (!esZRE) {
                var zonaParaFiltro = zonaActual === 'Usos Específicos - Otros Usos' ? 'Usos Específicos - Otros Usos' : zonaActual;
                var resultadosZona = datosUsos.filter(f => estandarizarTexto(f['Uso Compatible']) === estandarizarTexto(zonaParaFiltro));
                if (resultadosZona.length > 0) {
                    var obs  = (resultadosZona[0]['Observaciones'] || '').trim();
                    var rest = (resultadosZona[0]['Restricciones'] || '').trim();
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
                document.getElementById('texto-observaciones').innerHTML =
                    'Zona de Reglamentación Especial. Los giros y su compatibilidad se rigen por el Plan Especial correspondiente a cada ubicación dentro del ' + zonVigActual + '.';
            }

            document.getElementById('contenido-scrollable').scrollTop = 0;
            renderizarResultados();
        }

        // Colores por tipo de autorización

        function renderizarResultados() {
            if (!zonaActual) return;
            var busqueda = estandarizarTexto(document.getElementById('buscador-actividad').value);
            var esZRE    = (zonaActual === 'Planes Especiales') && /^ZRE-\d/.test(zonVigActual);
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
                    '<span style="color:#ffca28;">● ' + nRest + ' Con restricciones</span>';

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
                        girosHtml += '<p style="margin:6px 0 0;font-size:10px;color:#aaa;font-style:italic;">' + c.obs + '</p>';
                    }

                    htmlContenido +=
                        '<div style="background:#2a2a2a;border-left:5px solid ' + c_borde + ';padding:12px;margin-bottom:12px;border-radius:4px;">' +
                        '<div style="display:flex;justify-content:space-between;margin-bottom:8px;">' +
                        '<span style="background:' + c_borde + ';color:' + (tieneX?'#fff':'#000') + ';padding:2px 6px;border-radius:3px;font-size:11px;font-weight:bold;">CIIU: ' + c.clase + '</span>' +
                        '<span style="font-size:10px;font-weight:bold;color:' + c_borde + ';">' + zreId + '</span>' +
                        '</div>' +
                        '<strong style="font-size:13px;color:#fff;display:block;margin-bottom:5px;">' + c.desc + '</strong>' +
                        ubicacionesHtml +
                        girosHtml +
                        '</div>';
                });

                document.getElementById('lista-clases-container').innerHTML = htmlContenido ||
                    "<p style='color:#777;text-align:center;padding:20px;font-style:italic;'>No hay actividades compatibles para este ZRE.</p>";
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

            var resultados = datosUsos.filter(function(f) {
                return estandarizarTexto(f['Uso Compatible']) === estandarizarTexto(zonaParaFiltro);
            });

            if (busqueda) {
                resultados = resultados.filter(function(f) {
                    var tieneGiro = datosActividades.some(function(g) {
                        return String(g.CLASE) === String(f.Clase) &&
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
                '<span style="color:#ffca28;">● ' + restringidos + ' Con restricciones</span>';

            var htmlContenido = '';
            resultados.forEach(function(item) {
                var esRestringido = String(item['Autorización']).includes('restricción');
                var cCaja  = esRestringido ? '#ffca28' : '#4CAF50';
                var cTexto = esRestringido ? '#000' : '#fff';
                var tAviso = esRestringido ? 'Con restricciones' : 'Permitidas';

                // Giros para esta clase CON su autorización individual en la zona
                var girosDeEstaClase = datosActividades.filter(function(g) {
                    return String(g.CLASE) === String(item.Clase);
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
                        girosHtml += '<p style="margin:6px 0 0;font-size:10px;color:#aaa;font-style:italic;">' + girosDeEstaClase[0].OBSERVACIONES + '</p>';
                    }
                } else {
                    girosHtml = "<p style='margin:8px 0 0;font-size:11px;color:#777;font-style:italic;'>* No hay giros específicos detallados.</p>";
                }

                htmlContenido +=
                    '<div style="background:#2a2a2a;border-left:5px solid ' + cCaja + ';padding:12px;margin-bottom:12px;border-radius:4px;">' +
                    '<div style="display:flex;justify-content:space-between;margin-bottom:8px;">' +
                    '<span style="background:' + cCaja + ';color:' + cTexto + ';padding:2px 6px;border-radius:3px;font-size:11px;font-weight:bold;">CIIU: ' + item['Clase'] + '</span>' +
                    '<span style="font-size:10px;font-weight:bold;color:' + cCaja + ';">' + tAviso + '</span>' +
                    '</div>' +
                    '<strong style="font-size:13px;color:#fff;display:block;margin-bottom:5px;">' + item['Descripción'] + '</strong>' +
                    girosHtml +
                    '</div>';
            });

            document.getElementById('lista-clases-container').innerHTML = htmlContenido ||
                "<p style='color:#777;text-align:center;padding:20px;font-style:italic;'>No se encontraron actividades.</p>";
        }

        document.getElementById('buscador-actividad').addEventListener('input', renderizarResultados);
