const { Markup } = require('telegraf');
const db = require('../database');
const { initUserSession, clearUserSession } = require('./sessions');

function setupAbogadosHandlers(bot) {
    // Comando para registrar abogado
    bot.command('registrar_abogado', async (ctx) => {
        const session = initUserSession(ctx.from.id);
        session.step = 'abogado_nombre';
        session.data = {};
        await ctx.reply('📝 *Registrar Nuevo Abogado*\n\nIngresa el nombre del abogado:', { parse_mode: 'Markdown' });
    });

    // Handler para botón de registrar abogado
    bot.hears('📝 Registrar Abogado', async (ctx) => {
        const session = initUserSession(ctx.from.id);
        session.step = 'abogado_nombre';
        session.data = {};
        await ctx.reply('📝 *Registrar Nuevo Abogado*\n\nIngresa el nombre del abogado:', { parse_mode: 'Markdown' });
    });

    // Comando para listar abogados
    bot.command('listar_abogados', async (ctx) => {
        try {
            const abogados = await db.obtenerAbogados();

            if (abogados.length === 0) {
                return await ctx.reply('📝 No hay abogados registrados.');
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

    // Handler para botón de listar abogados
    bot.hears('👥 Listar Abogados', async (ctx) => {
        try {
            const abogados = await db.obtenerAbogados();

            if (abogados.length === 0) {
                return await ctx.reply('📝 No hay abogados registrados.');
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

    // Función para procesar flujo de texto de abogados
    async function handleAbogadoFlow(ctx, text, userId, session) {
        try {
            switch (session.step) {
                case 'abogado_nombre':
                    session.data.nombre = text;
                    session.step = 'abogado_email';
                    await ctx.reply('📧 Ingresa el email del abogado (o envía /skip para omitir):');
                    return true;

                case 'abogado_email':
                    if (text !== '/skip') {
                        session.data.email = text;
                    }
                    session.step = 'abogado_telefono';
                    await ctx.reply('📱 Ingresa el teléfono del abogado (o envía /skip para omitir):');
                    return true;

                case 'abogado_telefono':
                    if (text !== '/skip') {
                        session.data.telefono = text;
                    }

                    // Guardar en base de datos
                    await db.crearAbogado(
                        session.data.nombre,
                        session.data.email || null,
                        session.data.telefono || null
                    );

                    clearUserSession(userId);
                    await ctx.reply(`✅ *Abogado registrado exitosamente*\n\n👤 *${session.data.nombre}* ha sido agregado al sistema.`, { parse_mode: 'Markdown' });
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

    return { handleAbogadoFlow };
}

module.exports = setupAbogadosHandlers;