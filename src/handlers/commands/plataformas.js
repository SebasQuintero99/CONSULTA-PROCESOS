const { Markup } = require('telegraf');
const PlataformaModel = require('../../models/plataforma');
const { initUserSession, clearUserSession } = require('../../middleware/session');

function setupPlataformasCommands(bot) {
    bot.command('registrar_plataforma', async (ctx) => {
        const session = initUserSession(ctx.from.id);
        session.step = 'plataforma_nombre';
        session.data = {};
        await ctx.reply('🏢 *Registrar Nueva Plataforma*\n\nIngresa el nombre de la plataforma:', { parse_mode: 'Markdown' });
    });

    bot.hears('🏢 Registrar Plataforma', async (ctx) => {
        const session = initUserSession(ctx.from.id);
        session.step = 'plataforma_nombre';
        session.data = {};
        await ctx.reply('🏢 *Registrar Nueva Plataforma*\n\nIngresa el nombre de la plataforma:', { parse_mode: 'Markdown' });
    });

    bot.command('listar_plataformas', async (ctx) => {
        try {
            const plataformas = await PlataformaModel.obtenerTodas();

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

    bot.hears('🔗 Listar Plataformas', async (ctx) => {
        try {
            const plataformas = await PlataformaModel.obtenerTodas();

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
}

async function handlePlataformaFlow(ctx, text, userId, session) {
    try {
        switch (session.step) {
            case 'plataforma_nombre':
                const existe = await PlataformaModel.existe(text);
                if (existe) {
                    await ctx.reply(`❌ *Plataforma ya existe*\n\nYa existe una plataforma con el nombre "${text}". Por favor, ingresa un nombre diferente:`, { parse_mode: 'Markdown' });
                    return true;
                }

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

                await PlataformaModel.crear(
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

module.exports = { setupPlataformasCommands, handlePlataformaFlow };