const { getUserSession } = require('../../middleware/session');

function setupPlataformasCallbacks(bot) {
    bot.action(/^tipo_(.+)$/, async (ctx) => {
        const tipo = ctx.match[1];
        const session = getUserSession(ctx.from.id);

        if (!session || session.step !== 'plataforma_tipo') return;

        if (tipo !== 'skip') {
            session.data.tipo = tipo;
        }

        session.step = 'plataforma_url';
        await ctx.editMessageText('🌐 Ingresa la URL base de la plataforma (o envía /skip para omitir):');
    });
}

module.exports = { setupPlataformasCallbacks };