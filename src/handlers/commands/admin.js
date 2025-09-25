const { isAdmin, addAuthorizedUser, removeAuthorizedUser, AUTHORIZED_USERS } = require('../../middleware/auth');

function setupAdminCommands(bot) {
    // Comando para autorizar un usuario
    bot.command('autorizar', async (ctx) => {
        const userId = ctx.from.id;

        // Verificar que sea admin
        if (!isAdmin(userId)) {
            return await ctx.reply('❌ Solo el administrador puede usar este comando.');
        }

        const args = ctx.message.text.split(' ');
        if (args.length < 2) {
            return await ctx.reply('❌ *Uso incorrecto*\n\nUsa: `/autorizar USER_ID`\n\nEjemplo: `/autorizar 123456789`', { parse_mode: 'Markdown' });
        }

        const targetUserId = parseInt(args[1]);
        if (isNaN(targetUserId)) {
            return await ctx.reply('❌ ID de usuario inválido. Debe ser un número.');
        }

        const added = addAuthorizedUser(targetUserId);
        if (added) {
            await ctx.reply(`✅ *Usuario autorizado*\n\nEl usuario con ID \`${targetUserId}\` ahora puede usar el bot.`, { parse_mode: 'Markdown' });
            console.log(`✅ Admin ${userId} autorizó al usuario ${targetUserId}`);
        } else {
            await ctx.reply(`⚠️ El usuario con ID \`${targetUserId}\` ya estaba autorizado.`, { parse_mode: 'Markdown' });
        }
    });

    // Comando para desautorizar un usuario
    bot.command('desautorizar', async (ctx) => {
        const userId = ctx.from.id;

        // Verificar que sea admin
        if (!isAdmin(userId)) {
            return await ctx.reply('❌ Solo el administrador puede usar este comando.');
        }

        const args = ctx.message.text.split(' ');
        if (args.length < 2) {
            return await ctx.reply('❌ *Uso incorrecto*\n\nUsa: `/desautorizar USER_ID`\n\nEjemplo: `/desautorizar 123456789`', { parse_mode: 'Markdown' });
        }

        const targetUserId = parseInt(args[1]);
        if (isNaN(targetUserId)) {
            return await ctx.reply('❌ ID de usuario inválido. Debe ser un número.');
        }

        // No permitir desautorizar al admin
        if (isAdmin(targetUserId)) {
            return await ctx.reply('❌ No puedes desautorizar al administrador principal.');
        }

        const removed = removeAuthorizedUser(targetUserId);
        if (removed) {
            await ctx.reply(`✅ *Usuario desautorizado*\n\nEl usuario con ID \`${targetUserId}\` ya no puede usar el bot.`, { parse_mode: 'Markdown' });
            console.log(`✅ Admin ${userId} desautorizó al usuario ${targetUserId}`);
        } else {
            await ctx.reply(`⚠️ El usuario con ID \`${targetUserId}\` no estaba autorizado.`, { parse_mode: 'Markdown' });
        }
    });

    // Comando para listar usuarios autorizados
    bot.command(['usuarios_autorizados', 'usuarios'], async (ctx) => {
        const userId = ctx.from.id;

        // Verificar que sea admin
        if (!isAdmin(userId)) {
            return await ctx.reply('❌ Solo el administrador puede usar este comando.');
        }

        let mensaje = '👥 *Usuarios Autorizados*\n\n';

        if (AUTHORIZED_USERS.length === 0) {
            mensaje += 'No hay usuarios autorizados.';
        } else {
            AUTHORIZED_USERS.forEach((authorizedId, index) => {
                const isAdminUser = isAdmin(authorizedId);
                const role = isAdminUser ? '👑 Administrador' : '👤 Usuario';
                mensaje += `${index + 1}. \`${authorizedId}\` - ${role}\n`;
            });

            mensaje += `\n📊 *Total:* ${AUTHORIZED_USERS.length} usuario(s)`;
        }

        await ctx.reply(mensaje, { parse_mode: 'Markdown' });
    });
}

module.exports = { setupAdminCommands };