const { Markup } = require('telegraf');
const AbogadoModel = require('../../models/abogado');
const { initUserSession, clearUserSession } = require('../../middleware/session');

function setupAbogadosCommands(bot) {
    bot.command('registrar_abogado', async (ctx) => {
        const session = initUserSession(ctx.from.id);
        session.step = 'abogado_nombre';
        session.data = {};
        await ctx.reply('👤 *Registrar Nuevo Abogado*\n\nIngresa el nombre completo del abogado:', { parse_mode: 'Markdown' });
    });

    bot.hears('📝 Registrar Abogado', async (ctx) => {
        const session = initUserSession(ctx.from.id);
        session.step = 'abogado_nombre';
        session.data = {};
        await ctx.reply('👤 *Registrar Nuevo Abogado*\n\nIngresa el nombre completo del abogado:', { parse_mode: 'Markdown' });
    });

    bot.command('listar_abogados', async (ctx) => {
        try {
            const abogados = await AbogadoModel.obtenerTodos();

            if (abogados.length === 0) {
                return await ctx.reply('👤 No hay abogados registrados.');
            }

            let mensaje = '👥 *Abogados Registrados:*\n\n';
            abogados.forEach((abogado, index) => {
                mensaje += `${index + 1}. *${abogado.nombre}*\n`;
                if (abogado.email) mensaje += `   📧 ${abogado.email}\n`;
                if (abogado.telefono) mensaje += `   📱 ${abogado.telefono}\n`;
                mensaje += `   📅 Registrado: ${new Date(abogado.creado_en).toLocaleDateString()}\n\n`;
            });

            await ctx.reply(mensaje, { parse_mode: 'Markdown' });
        } catch (error) {
            console.error('Error al listar abogados:', error);
            await ctx.reply('❌ Error al obtener la lista de abogados.');
        }
    });

    bot.hears('👥 Listar Abogados', async (ctx) => {
        try {
            const abogados = await AbogadoModel.obtenerTodos();

            if (abogados.length === 0) {
                return await ctx.reply('👤 No hay abogados registrados.');
            }

            let mensaje = '👥 *Abogados Registrados:*\n\n';
            abogados.forEach((abogado, index) => {
                mensaje += `${index + 1}. *${abogado.nombre}*\n`;
                if (abogado.email) mensaje += `   📧 ${abogado.email}\n`;
                if (abogado.telefono) mensaje += `   📱 ${abogado.telefono}\n`;
                mensaje += `   📅 Registrado: ${new Date(abogado.creado_en).toLocaleDateString()}\n\n`;
            });

            await ctx.reply(mensaje, { parse_mode: 'Markdown' });
        } catch (error) {
            console.error('Error al listar abogados:', error);
            await ctx.reply('❌ Error al obtener la lista de abogados.');
        }
    });
}

async function handleAbogadoFlow(ctx, text, userId, session) {
    try {
        switch (session.step) {
            case 'abogado_nombre':
                const existe = await AbogadoModel.existe(text);
                if (existe) {
                    await ctx.reply(`❌ *Abogado ya existe*\n\nYa existe un abogado con el nombre "${text}". Por favor, ingresa un nombre diferente:`, { parse_mode: 'Markdown' });
                    return true;
                }

                session.data.nombre = text;
                session.step = 'abogado_email';
                await ctx.reply('📧 Ingresa el email del abogado (o envía /skip para omitir):');
                return true;

            case 'abogado_email':
                if (text !== '/skip') {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(text)) {
                        await ctx.reply('❌ Email inválido. Por favor, ingresa un email válido o envía /skip para omitir:');
                        return true;
                    }
                    session.data.email = text;
                }

                session.step = 'abogado_telefono';
                await ctx.reply('📱 Ingresa el teléfono del abogado (o envía /skip para omitir):');
                return true;

            case 'abogado_telefono':
                if (text !== '/skip') {
                    session.data.telefono = text;
                }

                await AbogadoModel.crear(
                    session.data.nombre,
                    session.data.email || null,
                    session.data.telefono || null
                );

                clearUserSession(userId);

                let mensaje = `✅ *Abogado registrado exitosamente*\n\n👤 *${session.data.nombre}*`;
                if (session.data.email) mensaje += `\n📧 ${session.data.email}`;
                if (session.data.telefono) mensaje += `\n📱 ${session.data.telefono}`;

                await ctx.reply(mensaje, { parse_mode: 'Markdown' });
                return true;
        }
    } catch (error) {
        console.error('Error en flujo de abogado:', error);
        clearUserSession(userId);
        await ctx.reply('❌ Error al procesar la información del abogado. Intenta nuevamente.');
        return true;
    }

    return false;
}

module.exports = { setupAbogadosCommands, handleAbogadoFlow };