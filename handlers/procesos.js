const { Markup } = require('telegraf');
const db = require('../database');
const { initUserSession, clearUserSession } = require('./sessions');

function setupProcesosHandlers(bot) {
    // Comando para registrar proceso
    bot.command('registrar_proceso', async (ctx) => {
        try {
            const abogados = await db.obtenerAbogados();
            const plataformas = await db.obtenerPlataformas();

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

    // Handler para botón de registrar proceso
    bot.hears('⚖️ Registrar Proceso', async (ctx) => {
        try {
            const abogados = await db.obtenerAbogados();
            const plataformas = await db.obtenerPlataformas();

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

    // Comando para listar procesos
    bot.command('listar_procesos', async (ctx) => {
        try {
            const abogados = await db.obtenerAbogados();

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

    // Handler para botón de listar procesos
    bot.hears('📋 Listar Procesos', async (ctx) => {
        try {
            const abogados = await db.obtenerAbogados();

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

    // Handlers para selección de abogado y plataforma
    bot.action(/^select_abogado_(\d+)$/, async (ctx) => {
        const abogadoId = parseInt(ctx.match[1]);
        const session = require('./sessions').getUserSession(ctx.from.id);

        if (!session || session.step !== 'proceso_seleccionar_abogado') return;

        session.data.abogado_id = abogadoId;
        session.step = 'proceso_seleccionar_plataforma';

        const keyboard = Markup.inlineKeyboard(
            session.data.plataformas.map(plataforma => [
                Markup.button.callback(`${plataforma.nombre}`, `select_plataforma_${plataforma.id}`)
            ])
        );

        await ctx.editMessageText('🏢 Selecciona una plataforma:', {
            parse_mode: 'Markdown',
            ...keyboard
        });
    });

    bot.action(/^select_plataforma_(\d+)$/, async (ctx) => {
        const plataformaId = parseInt(ctx.match[1]);
        const session = require('./sessions').getUserSession(ctx.from.id);

        if (!session || session.step !== 'proceso_seleccionar_plataforma') return;

        session.data.plataforma_id = plataformaId;
        session.step = 'proceso_numero_radicacion';

        await ctx.editMessageText('📝 Ingresa el número de radicación del proceso:');
    });

    // Handlers para listar procesos por abogado
    bot.action(/^listar_procesos_abogado_(\d+)$/, async (ctx) => {
        const abogadoId = parseInt(ctx.match[1]);

        try {
            const procesos = await db.obtenerProcesosPorAbogado(abogadoId);
            const abogado = await db.obtenerAbogadoPorId(abogadoId);

            if (procesos.length === 0) {
                return await ctx.editMessageText(`⚖️ El abogado *${abogado.nombre}* no tiene procesos registrados.`, { parse_mode: 'Markdown' });
            }

            let mensaje = `📋 *Procesos de ${abogado.nombre}:*\n\n`;
            procesos.slice(0, 10).forEach((proceso, index) => {
                mensaje += `${index + 1}. *${proceso.numero_radicacion}*\n`;
                if (proceso.descripcion) mensaje += `   📝 ${proceso.descripcion}\n`;
                mensaje += `   🏢 Plataforma: ${proceso.plataforma_nombre}\n`;
                if (proceso.juzgado) mensaje += `   🏛️ Juzgado: ${proceso.juzgado}\n`;
                if (proceso.estado) mensaje += `   📊 Estado: ${proceso.estado}\n`;
                mensaje += `   📅 Registrado: ${new Date(proceso.creado_en).toLocaleDateString()}\n\n`;
            });

            if (procesos.length > 10) {
                mensaje += `... y ${procesos.length - 10} procesos más.`;
            }

            await ctx.editMessageText(mensaje, { parse_mode: 'Markdown' });
        } catch (error) {
            console.error('Error al listar procesos por abogado:', error);
            await ctx.editMessageText('❌ Error al obtener los procesos del abogado.');
        }
    });

    bot.action('listar_todos_procesos', async (ctx) => {
        try {
            const procesos = await db.obtenerProcesos();

            if (procesos.length === 0) {
                return await ctx.editMessageText('⚖️ No hay procesos registrados.');
            }

            let mensaje = '📋 *Todos los Procesos Registrados:*\n\n';
            procesos.slice(0, 10).forEach((proceso, index) => {
                mensaje += `${index + 1}. *${proceso.numero_radicacion}*\n`;
                if (proceso.descripcion) mensaje += `   📝 ${proceso.descripcion}\n`;
                mensaje += `   👤 Abogado: ${proceso.abogado_nombre}\n`;
                mensaje += `   🏢 Plataforma: ${proceso.plataforma_nombre}\n`;
                if (proceso.juzgado) mensaje += `   🏛️ Juzgado: ${proceso.juzgado}\n`;
                if (proceso.estado) mensaje += `   📊 Estado: ${proceso.estado}\n`;
                mensaje += `   📅 Registrado: ${new Date(proceso.creado_en).toLocaleDateString()}\n\n`;
            });

            if (procesos.length > 10) {
                mensaje += `... y ${procesos.length - 10} procesos más.`;
            }

            await ctx.editMessageText(mensaje, { parse_mode: 'Markdown' });
        } catch (error) {
            console.error('Error al listar todos los procesos:', error);
            await ctx.editMessageText('❌ Error al obtener la lista de procesos.');
        }
    });

    // Función para procesar flujo de texto de procesos
    async function handleProcesoFlow(ctx, text, userId, session) {
        try {
            switch (session.step) {
                case 'proceso_numero_radicacion':
                    // Validar que el número de radicación no esté duplicado
                    const existe = await db.existeNumeroRadicacion(text);
                    if (existe) {
                        await ctx.reply(`❌ *Número de radicación duplicado*\n\nEl número de radicación \`${text}\` ya existe en el sistema. Por favor, ingresa un número diferente:`, { parse_mode: 'Markdown' });
                        return true;
                    }

                    session.data.numero_radicacion = text;
                    session.step = 'proceso_descripcion';
                    await ctx.reply('📝 Ingresa una breve descripción del proceso (máximo 100 caracteres):');
                    return true;

                case 'proceso_descripcion':
                    // Validar longitud de descripción
                    if (text.length > 100) {
                        await ctx.reply('❌ La descripción debe tener máximo 100 caracteres. Tu descripción tiene ' + text.length + ' caracteres. Intenta nuevamente:');
                        return true;
                    }

                    session.data.descripcion = text;

                    // Guardar en base de datos con descripción
                    try {
                        await db.crearProceso(
                            session.data.numero_radicacion,
                            session.data.abogado_id,
                            session.data.plataforma_id,
                            session.data.descripcion
                        );

                        // Obtener nombres para mostrar confirmación
                        const abogado = await db.obtenerAbogadoPorId(session.data.abogado_id);
                        const plataforma = await db.obtenerPlataformaPorId(session.data.plataforma_id);

                        clearUserSession(userId);

                        const mensaje = `✅ *Proceso registrado exitosamente*\n\n` +
                                      `⚖️ **Número de radicación:** ${session.data.numero_radicacion}\n` +
                                      `📝 **Descripción:** ${session.data.descripcion}\n` +
                                      `👤 **Abogado:** ${abogado.nombre}\n` +
                                      `🏢 **Plataforma:** ${plataforma.nombre}`;

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

    return { handleProcesoFlow };
}

module.exports = setupProcesosHandlers;