const { Markup } = require('telegraf');
const db = require('../database');
const { initUserSession, clearUserSession } = require('./sessions');

function setupPlataformasHandlers(bot) {
    // Comando para registrar plataforma
    bot.command('registrar_plataforma', async (ctx) => {
        const session = initUserSession(ctx.from.id);
        session.step = 'plataforma_nombre';
        session.data = {};
        await ctx.reply('🏢 *Registrar Nueva Plataforma*\n\nIngresa el nombre de la plataforma:', { parse_mode: 'Markdown' });
    });

    // Handler para botón de registrar plataforma
    bot.hears('🏢 Registrar Plataforma', async (ctx) => {
        const session = initUserSession(ctx.from.id);
        session.step = 'plataforma_nombre';
        session.data = {};
        await ctx.reply('🏢 *Registrar Nueva Plataforma*\n\nIngresa el nombre de la plataforma:', { parse_mode: 'Markdown' });
    });

    // Comando para listar plataformas
    bot.command('listar_plataformas', async (ctx) => {
        try {
            const plataformas = await db.obtenerPlataformas();

            if (plataformas.length === 0) {
                return await ctx.reply('🏢 No hay plataformas registradas.');
            }

            let mensaje = '🔗 *Plataformas Registradas:*\n\n';
            plataformas.forEach((plataforma, index) => {
                mensaje += `${index + 1}. *${plataforma.nombre}*\n`;
                if (plataforma.tipo) mensaje += `   🔧 Tipo: ${plataforma.tipo}\n`;
                if (plataforma.url_base) mensaje += `   🌐 URL: ${plataforma.url_base}\n`;
                mensaje += `   ✅ Estado: ${plataforma.activo ? 'Activo' : 'Inactivo'}\n\n`;
            });

            await ctx.reply(mensaje, { parse_mode: 'Markdown' });
        } catch (error) {
            console.error('Error al listar plataformas:', error);
            await ctx.reply('❌ Error al obtener la lista de plataformas.');
        }
    });

    // Handler para botón de listar plataformas
    bot.hears('🔗 Listar Plataformas', async (ctx) => {
        try {
            const plataformas = await db.obtenerPlataformas();

            if (plataformas.length === 0) {
                return await ctx.reply('🏢 No hay plataformas registradas.');
            }

            let mensaje = '🔗 *Plataformas Registradas:*\n\n';
            plataformas.forEach((plataforma, index) => {
                mensaje += `${index + 1}. *${plataforma.nombre}*\n`;
                if (plataforma.tipo) mensaje += `   🔧 Tipo: ${plataforma.tipo}\n`;
                if (plataforma.url_base) mensaje += `   🌐 URL: ${plataforma.url_base}\n`;
                mensaje += `   ✅ Estado: ${plataforma.activo ? 'Activo' : 'Inactivo'}\n\n`;
            });

            await ctx.reply(mensaje, { parse_mode: 'Markdown' });
        } catch (error) {
            console.error('Error al listar plataformas:', error);
            await ctx.reply('❌ Error al obtener la lista de plataformas.');
        }
    });

    // Handler para botones de tipo de plataforma
    bot.action(/^tipo_(.+)$/, async (ctx) => {
        const tipo = ctx.match[1];
        const session = require('./sessions').getUserSession(ctx.from.id);

        if (!session || session.step !== 'plataforma_tipo') return;

        if (tipo !== 'skip') {
            session.data.tipo = tipo;
        }

        session.step = 'plataforma_url';
        await ctx.editMessageText('🌐 Ingresa la URL base de la plataforma (o envía /skip para omitir):');
    });

    // Función para procesar flujo de texto de plataformas
    async function handlePlataformaFlow(ctx, text, userId, session) {
        try {
            switch (session.step) {
                case 'plataforma_nombre':
                    session.data.nombre = text;
                    session.step = 'plataforma_tipo';

                    const tipoKeyboard = Markup.inlineKeyboard([
                        [Markup.button.callback('API', 'tipo_API')],
                        [Markup.button.callback('WebScraping', 'tipo_WebScraping')],
                        [Markup.button.callback('Omitir', 'tipo_skip')]
                    ]);

                    await ctx.reply('🔧 Selecciona el tipo de plataforma:', tipoKeyboard);
                    return true;

                case 'plataforma_url':
                    if (text !== '/skip') {
                        session.data.url_base = text;
                    }

                    // Guardar en base de datos
                    await db.crearPlataforma(
                        session.data.nombre,
                        session.data.tipo || null,
                        session.data.url_base || null
                    );

                    clearUserSession(userId);
                    await ctx.reply(`✅ *Plataforma registrada exitosamente*\n\n🏢 *${session.data.nombre}* ha sido agregada al sistema.`, { parse_mode: 'Markdown' });
                    return true;
            }
        } catch (error) {
            console.error('Error en flujo de plataforma:', error);
            clearUserSession(userId);
            await ctx.reply('❌ Error al procesar la información de la plataforma. Intenta nuevamente.');
            return true;
        }

        return false;
    }

    return { handlePlataformaFlow };
}

module.exports = setupPlataformasHandlers;