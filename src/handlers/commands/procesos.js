const { Markup } = require('telegraf');
const ProcesoModel = require('../../models/proceso');
const AbogadoModel = require('../../models/abogado');
const PlataformaModel = require('../../models/plataforma');
const ramaJudicialApi = require('../../services/ramaJudicialApi');
const { initUserSession, clearUserSession } = require('../../middleware/session');

function setupProcesosCommands(bot) {
    bot.command('registrar_proceso', async (ctx) => {
        try {
            const abogados = await AbogadoModel.obtenerTodos();
            const plataformas = await PlataformaModel.obtenerTodas();

            if (abogados.length === 0) {
                return await ctx.reply('❌ No hay abogados registrados. Registra un abogado primero con /registrar_abogado');
            }

            if (plataformas.length === 0) {
                return await ctx.reply('❌ No hay plataformas registradas. Registra una plataforma primero con /registrar_plataforma');
            }

            const session = initUserSession(ctx.from.id);
            session.step = 'proceso_seleccionar_abogado';
            session.data = { abogados, plataformas };

            const keyboard = Markup.inlineKeyboard(
                abogados.map(abogado => [
                    Markup.button.callback(`${abogado.nombre}`, `select_abogado_${abogado.id}`)
                ])
            );

            await ctx.reply('⚖️ *Registrar Nuevo Proceso*\n\nSelecciona un abogado:', {
                parse_mode: 'Markdown',
                ...keyboard
            });
        } catch (error) {
            console.error('Error al listar abogados/plataformas:', error);
            await ctx.reply('❌ Error al cargar datos. Intenta nuevamente.');
        }
    });

    bot.hears('⚖️ Registrar Proceso', async (ctx) => {
        try {
            const abogados = await AbogadoModel.obtenerTodos();
            const plataformas = await PlataformaModel.obtenerTodas();

            if (abogados.length === 0) {
                return await ctx.reply('❌ No hay abogados registrados. Registra un abogado primero con /registrar_abogado');
            }

            if (plataformas.length === 0) {
                return await ctx.reply('❌ No hay plataformas registradas. Registra una plataforma primero con /registrar_plataforma');
            }

            const session = initUserSession(ctx.from.id);
            session.step = 'proceso_seleccionar_abogado';
            session.data = { abogados, plataformas };

            const keyboard = Markup.inlineKeyboard(
                abogados.map(abogado => [
                    Markup.button.callback(`${abogado.nombre}`, `select_abogado_${abogado.id}`)
                ])
            );

            await ctx.reply('⚖️ *Registrar Nuevo Proceso*\n\nSelecciona un abogado:', {
                parse_mode: 'Markdown',
                ...keyboard
            });
        } catch (error) {
            console.error('Error al listar abogados/plataformas:', error);
            await ctx.reply('❌ Error al cargar datos. Intenta nuevamente.');
        }
    });

    bot.command('listar_procesos', async (ctx) => {
        try {
            const abogados = await AbogadoModel.obtenerTodos();

            if (abogados.length === 0) {
                return await ctx.reply('❌ No hay abogados registrados. No se pueden listar procesos.');
            }

            const session = initUserSession(ctx.from.id);
            session.step = 'listar_procesos_seleccionar_abogado';
            session.data = { abogados };

            const keyboard = Markup.inlineKeyboard([
                ...abogados.map(abogado => [
                    Markup.button.callback(`${abogado.nombre}`, `listar_procesos_abogado_${abogado.id}`)
                ]),
                [Markup.button.callback('📋 Ver todos los procesos', 'listar_todos_procesos')]
            ]);

            await ctx.reply('📋 *Listar Procesos*\n\n👤 Selecciona un abogado para ver sus procesos:', {
                parse_mode: 'Markdown',
                ...keyboard
            });
        } catch (error) {
            console.error('Error al listar abogados para procesos:', error);
            await ctx.reply('❌ Error al cargar los abogados.');
        }
    });

    bot.hears('📋 Listar Procesos', async (ctx) => {
        try {
            const abogados = await AbogadoModel.obtenerTodos();

            if (abogados.length === 0) {
                return await ctx.reply('❌ No hay abogados registrados. No se pueden listar procesos.');
            }

            const session = initUserSession(ctx.from.id);
            session.step = 'listar_procesos_seleccionar_abogado';
            session.data = { abogados };

            const keyboard = Markup.inlineKeyboard([
                ...abogados.map(abogado => [
                    Markup.button.callback(`${abogado.nombre}`, `listar_procesos_abogado_${abogado.id}`)
                ]),
                [Markup.button.callback('📋 Ver todos los procesos', 'listar_todos_procesos')]
            ]);

            await ctx.reply('📋 *Listar Procesos*\n\n👤 Selecciona un abogado para ver sus procesos:', {
                parse_mode: 'Markdown',
                ...keyboard
            });
        } catch (error) {
            console.error('Error al listar abogados para procesos:', error);
            await ctx.reply('❌ Error al cargar los abogados.');
        }
    });
}

async function handleProcesoFlow(ctx, text, userId, session) {
    try {
        switch (session.step) {
            case 'proceso_numero_radicacion':
                const existe = await ProcesoModel.existeNumeroRadicacion(text);
                if (existe) {
                    await ctx.reply(`❌ *Número de radicación duplicado*\n\nEl número de radicación \`${text}\` ya existe en el sistema. Por favor, ingresa un número diferente:`, { parse_mode: 'Markdown' });
                    return true;
                }

                session.data.numero_radicacion = text;
                session.step = 'proceso_descripcion';
                await ctx.reply('📝 Ingresa una breve descripción del proceso (máximo 100 caracteres):');
                return true;

            case 'proceso_descripcion':
                if (text.length > 100) {
                    await ctx.reply('❌ La descripción debe tener máximo 100 caracteres. Tu descripción tiene ' + text.length + ' caracteres. Intenta nuevamente:');
                    return true;
                }

                session.data.descripcion = text;

                await ctx.reply('🔍 *Validando número de radicación...*\n\nConsultando el proceso en el sistema de Rama Judicial para obtener información adicional...', { parse_mode: 'Markdown' });

                try {
                    // Consultar el proceso en el API para obtener datos adicionales
                    let procesoApi = null;
                    try {
                        procesoApi = await ramaJudicialApi.consultarProceso(session.data.numero_radicacion);
                    } catch (apiError) {
                        console.log(`⚠️ No se pudo consultar el proceso en el API: ${apiError.message}`);
                    }

                    await ProcesoModel.crear(
                        session.data.numero_radicacion,
                        session.data.abogado_id,
                        session.data.plataforma_id,
                        session.data.descripcion,
                        procesoApi
                    );

                    const abogado = await AbogadoModel.obtenerPorId(session.data.abogado_id);
                    const plataforma = await PlataformaModel.obtenerPorId(session.data.plataforma_id);

                    clearUserSession(userId);

                    let mensaje = `✅ *Proceso registrado exitosamente*\n\n` +
                                  `⚖️ **Número de radicación:** ${session.data.numero_radicacion}\n` +
                                  `📝 **Descripción:** ${session.data.descripcion}\n` +
                                  `👤 **Abogado:** ${abogado.nombre}\n` +
                                  `🏢 **Plataforma:** ${plataforma.nombre}`;

                    if (procesoApi) {
                        mensaje += `\n\n📋 **Datos adicionales obtenidos:**`;
                        if (procesoApi.despacho) mensaje += `\n🏛️ **Juzgado:** ${procesoApi.despacho}`;
                        if (procesoApi.fechaProceso) {
                            const fecha = new Date(procesoApi.fechaProceso).toLocaleDateString('es-CO');
                            mensaje += `\n📅 **Fecha radicación:** ${fecha}`;
                        }

                        // Mostrar sujetos procesales detalladamente
                        if (procesoApi.sujetosProcesales && procesoApi.sujetosProcesales.length > 0) {
                            mensaje += `\n\n👥 **Sujetos procesales:** (${procesoApi.sujetosProcesales.length})`;
                            procesoApi.sujetosProcesales.slice(0, 5).forEach((sujeto, index) => {
                                mensaje += `\n   ${index + 1}. ${sujeto.nombre || 'Sin nombre'}`;
                                if (sujeto.tipoSujeto) mensaje += ` - ${sujeto.tipoSujeto}`;
                            });
                            if (procesoApi.sujetosProcesales.length > 5) {
                                mensaje += `\n   ... y ${procesoApi.sujetosProcesales.length - 5} más`;
                            }
                        }

                        // Obtener y mostrar última actuación
                        try {
                            const actuaciones = await ramaJudicialApi.obtenerActuaciones(procesoApi.idProceso);
                            if (actuaciones.actuaciones && actuaciones.actuaciones.length > 0) {
                                const ultimaActuacion = actuaciones.actuaciones[0];
                                mensaje += `\n\n⚖️ **Última actuación:**`;
                                const fechaActuacion = new Date(ultimaActuacion.fechaActuacion).toLocaleDateString('es-CO');
                                mensaje += `\n📅 **Fecha:** ${fechaActuacion}`;
                                if (ultimaActuacion.actuacion) {
                                    // Truncar si es muy larga
                                    const descripcionActuacion = ultimaActuacion.actuacion.length > 100
                                        ? ultimaActuacion.actuacion.substring(0, 100) + '...'
                                        : ultimaActuacion.actuacion;
                                    mensaje += `\n📋 **Actuación:** ${descripcionActuacion}`;
                                }
                                if (ultimaActuacion.anotacion) {
                                    mensaje += `\n📌 **Anotación:** ${ultimaActuacion.anotacion}`;
                                }
                            }
                        } catch (actuacionError) {
                            console.log('No se pudieron obtener actuaciones:', actuacionError.message);
                            mensaje += `\n\n⚖️ **Última actuación:** No disponible`;
                        }
                    } else {
                        mensaje += `\n\n⚠️ *Nota:* No se pudo obtener información adicional del proceso desde Rama Judicial. Los datos se completarán en la próxima revisión automática.`;
                    }

                    await ctx.reply(mensaje, { parse_mode: 'Markdown' });
                } catch (error) {
                    console.error('Error al crear proceso:', error);
                    await ctx.reply('❌ Error al registrar el proceso. Intenta nuevamente.');
                    clearUserSession(userId);
                }
                return true;
        }
    } catch (error) {
        console.error('Error en flujo de proceso:', error);
        clearUserSession(userId);
        await ctx.reply('❌ Error al procesar la información del proceso. Intenta nuevamente.');
        return true;
    }

    return false;
}

module.exports = { setupProcesosCommands, handleProcesoFlow };