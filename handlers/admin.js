const { isAdmin, addAuthorizedUser, removeAuthorizedUser, AUTHORIZED_USERS } = require('../auth');

function setupAdminHandlers(bot) {
    // Panel principal de administración
    bot.command('admin', async (ctx) => {
        if (!isAdmin(ctx.from.id)) {
            return await ctx.reply('❌ No tienes permisos de administrador.');
        }

        const mensaje = `
🔧 *Panel de Administración*

*Comandos disponibles:*
/usuarios_autorizados - Ver lista de usuarios autorizados
/agregar_usuario [ID] - Agregar usuario autorizado
/remover_usuario [ID] - Remover usuario autorizado
/mi_id - Ver tu ID de Telegram

*Ejemplo:* \`/agregar_usuario 123456789\`
        `;

        await ctx.reply(mensaje, { parse_mode: 'Markdown' });
    });

    // Listar usuarios autorizados
    bot.command('usuarios_autorizados', async (ctx) => {
        if (!isAdmin(ctx.from.id)) {
            return await ctx.reply('❌ No tienes permisos de administrador.');
        }

        let mensaje = '👥 *Usuarios Autorizados:*\n\n';
        AUTHORIZED_USERS.forEach((userId, index) => {
            mensaje += `${index + 1}. ID: \`${userId}\`\n`;
        });

        await ctx.reply(mensaje, { parse_mode: 'Markdown' });
    });

    // Ver ID de usuario
    bot.command('mi_id', async (ctx) => {
        const userId = ctx.from.id;
        const isAuthorized = AUTHORIZED_USERS.includes(userId);

        let mensaje = `🆔 *Tu ID de Telegram:* \`${userId}\`\n\n`;

        if (isAuthorized) {
            mensaje += `✅ Estás autorizado para usar este bot.`;
        } else {
            mensaje += `🔒 No estás autorizado para usar este bot.\n\n📨 **Para solicitar acceso:**\n1. Envía este ID al administrador: \`${userId}\`\n2. El administrador usará: \`/agregar_usuario ${userId}\``;
        }

        await ctx.reply(mensaje, { parse_mode: 'Markdown' });
    });

    // Agregar usuario autorizado
    bot.command('agregar_usuario', async (ctx) => {
        if (!isAdmin(ctx.from.id)) {
            return await ctx.reply('❌ No tienes permisos de administrador.');
        }

        const args = ctx.message.text.split(' ');
        if (args.length !== 2) {
            return await ctx.reply('❌ Uso correcto: `/agregar_usuario [ID_USUARIO]`\n\nEjemplo: `/agregar_usuario 123456789`', { parse_mode: 'Markdown' });
        }

        const userId = parseInt(args[1]);
        if (isNaN(userId)) {
            return await ctx.reply('❌ El ID debe ser un número válido.');
        }

        if (addAuthorizedUser(userId)) {
            await ctx.reply(`✅ Usuario con ID \`${userId}\` agregado a la lista de autorizados.`, { parse_mode: 'Markdown' });
        } else {
            await ctx.reply(`⚠️ El usuario con ID \`${userId}\` ya estaba autorizado.`, { parse_mode: 'Markdown' });
        }
    });

    // Remover usuario autorizado
    bot.command('remover_usuario', async (ctx) => {
        if (!isAdmin(ctx.from.id)) {
            return await ctx.reply('❌ No tienes permisos de administrador.');
        }

        const args = ctx.message.text.split(' ');
        if (args.length !== 2) {
            return await ctx.reply('❌ Uso correcto: `/remover_usuario [ID_USUARIO]`\n\nEjemplo: `/remover_usuario 123456789`', { parse_mode: 'Markdown' });
        }

        const userId = parseInt(args[1]);
        if (isNaN(userId)) {
            return await ctx.reply('❌ El ID debe ser un número válido.');
        }

        if (removeAuthorizedUser(userId)) {
            await ctx.reply(`✅ Usuario con ID \`${userId}\` removido de la lista de autorizados.`, { parse_mode: 'Markdown' });
        } else {
            await ctx.reply(`⚠️ El usuario con ID \`${userId}\` no estaba en la lista de autorizados.`, { parse_mode: 'Markdown' });
        }
    });
}

module.exports = setupAdminHandlers;