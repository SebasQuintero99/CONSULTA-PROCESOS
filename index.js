const { Telegraf, Markup } = require('telegraf');
const { checkAuthorization } = require('./auth');
const { getUserSession } = require('./handlers/sessions');

// Importar handlers modulares
const setupAbogadosHandlers = require('./handlers/abogados');
const setupPlataformasHandlers = require('./handlers/plataformas');
const setupProcesosHandlers = require('./handlers/procesos');
const setupAdminHandlers = require('./handlers/admin');

require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);

// Aplicar middleware de autorización a TODOS los comandos
bot.use(checkAuthorization);

// Configurar handlers modulares
const { handleAbogadoFlow } = setupAbogadosHandlers(bot);
const { handlePlataformaFlow } = setupPlataformasHandlers(bot);
const { handleProcesoFlow } = setupProcesosHandlers(bot);
setupAdminHandlers(bot);

// Comando start
bot.start(async (ctx) => {
    const { clearUserSession } = require('./handlers/sessions');
    clearUserSession(ctx.from.id);

    const welcomeMessage = `
🏛️ *Bot de Gestión de Procesos Legales*

Bienvenido al sistema de gestión de procesos.

*Comandos disponibles:*
📝 /registrar_abogado - Registrar nuevo abogado
🏢 /registrar_plataforma - Registrar nueva plataforma
⚖️ /registrar_proceso - Registrar nuevo proceso
👥 /listar_abogados - Ver abogados registrados
🔗 /listar_plataformas - Ver plataformas registradas
📋 /listar_procesos - Ver procesos registrados

¿Qué deseas hacer?
    `;

    const keyboard = Markup.keyboard([
        ['📝 Registrar Abogado', '🏢 Registrar Plataforma'],
        ['⚖️ Registrar Proceso'],
        ['👥 Listar Abogados', '🔗 Listar Plataformas'],
        ['📋 Listar Procesos']
    ]).resize();

    await ctx.reply(welcomeMessage, { parse_mode: 'Markdown', ...keyboard });
});

// Manejador de texto para flujos de conversación
bot.on('text', async (ctx) => {
    const userId = ctx.from.id;
    const session = getUserSession(userId);

    if (!session || !session.step) return;

    const text = ctx.message.text;

    try {
        // Intentar procesar con cada handler hasta encontrar uno que lo maneje
        let handled = false;

        // Procesar flujos de abogados
        if (session.step.startsWith('abogado_')) {
            handled = await handleAbogadoFlow(ctx, text, userId, session);
        }
        // Procesar flujos de plataformas
        else if (session.step.startsWith('plataforma_')) {
            handled = await handlePlataformaFlow(ctx, text, userId, session);
        }
        // Procesar flujos de procesos
        else if (session.step.startsWith('proceso_')) {
            handled = await handleProcesoFlow(ctx, text, userId, session);
        }

        if (!handled) {
            console.log('Paso no manejado:', session.step);
        }

    } catch (error) {
        console.error('Error en flujo de conversación:', error);
        const { clearUserSession } = require('./handlers/sessions');
        clearUserSession(userId);
        await ctx.reply('❌ Ocurrió un error. Por favor, intenta nuevamente.');
    }
});

// Inicializar bot
async function startBot() {
    try {
        const db = require('./database');

        // Verificar conexión a base de datos
        const dbConnected = await db.testConnection();
        if (!dbConnected) {
            console.error('❌ No se pudo conectar a la base de datos. Verifica la configuración.');
            process.exit(1);
        }

        // Iniciar bot
        await bot.launch();
        console.log('🤖 Bot iniciado correctamente');
        console.log('📝 Listo para recibir comandos...');

        // Graceful stop
        process.once('SIGINT', () => bot.stop('SIGINT'));
        process.once('SIGTERM', () => bot.stop('SIGTERM'));

    } catch (error) {
        console.error('❌ Error al iniciar el bot:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    startBot();
}

module.exports = bot;