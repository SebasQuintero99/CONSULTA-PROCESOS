const { Telegraf, Markup } = require('telegraf');
const { checkAuthorization } = require('./middleware/auth');
const { getUserSession } = require('./middleware/session');
const db = require('./config/database');

// Importar handlers
const { setupAbogadosCommands, handleAbogadoFlow } = require('./handlers/commands/abogados');
const { setupPlataformasCommands, handlePlataformaFlow } = require('./handlers/commands/plataformas');
const { setupProcesosCommands, handleProcesoFlow } = require('./handlers/commands/procesos');
const { setupRevisionCommands } = require('./handlers/commands/revision');
const { setupAdminCommands } = require('./handlers/commands/admin');
const { setupProcesosCallbacks } = require('./handlers/callbacks/procesos');
const { setupPlataformasCallbacks } = require('./handlers/callbacks/plataformas');

require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);

// Aplicar middleware de autorización
bot.use(checkAuthorization);

// Configurar handlers de comandos
setupAbogadosCommands(bot);
setupPlataformasCommands(bot);
setupProcesosCommands(bot);
setupRevisionCommands(bot);
setupAdminCommands(bot);

// Configurar handlers de callbacks
setupProcesosCallbacks(bot);
setupPlataformasCallbacks(bot);

// Comando start
bot.start(async (ctx) => {
    const { clearUserSession } = require('./middleware/session');
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

*🤖 Sistema de Automatización:*
🔍 /revisar_estados - Revisión manual de procesos
📊 /estado_automatizacion - Ver estado del sistema
🔍 /consultar_proceso [número] - Consultar proceso específico
⚙️ /config_automatizacion - Configurar automatización

*👑 Comandos de Administración:*
👤 /autorizar [ID] - Autorizar usuario
🚫 /desautorizar [ID] - Desautorizar usuario
👥 /usuarios - Ver usuarios autorizados

¿Qué deseas hacer?
    `;

    const keyboard = Markup.keyboard([
        ['📝 Registrar Abogado', '🏢 Registrar Plataforma'],
        ['⚖️ Registrar Proceso'],
        ['👥 Listar Abogados', '🔗 Listar Plataformas'],
        ['📋 Listar Procesos'],
        ['🔍 Revisar Estados', '📊 Estado Automatización'],
        ['⚙️ Config. Automatización']
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
        const { clearUserSession } = require('./middleware/session');
        clearUserSession(userId);
        await ctx.reply('❌ Ocurrió un error. Por favor, intenta nuevamente.');
    }
});

// Configurar comandos del menú de Telegram
async function setupBotCommands() {
    const commands = [
        { command: 'start', description: '🏠 Menú principal' },
        { command: 'registrar_abogado', description: '👨‍💼 Registrar nuevo abogado' },
        { command: 'registrar_plataforma', description: '🏢 Registrar nueva plataforma' },
        { command: 'registrar_proceso', description: '⚖️ Registrar nuevo proceso' },
        { command: 'listar_abogados', description: '👥 Ver abogados registrados' },
        { command: 'listar_plataformas', description: '🔗 Ver plataformas registradas' },
        { command: 'listar_procesos', description: '📋 Ver procesos registrados' },
        { command: 'revisar', description: '🔍 Revisar estados de procesos' },
        { command: 'estado', description: '📊 Estado del sistema automático' },
        { command: 'consultar', description: '🔍 Consultar proceso específico' },
        { command: 'config', description: '⚙️ Configurar automatización' },
        { command: 'autorizar', description: '👤 Autorizar usuario (solo admin)' },
        { command: 'desautorizar', description: '🚫 Desautorizar usuario (solo admin)' },
        { command: 'usuarios', description: '👥 Ver usuarios autorizados (solo admin)' }
    ];

    await bot.telegram.setMyCommands(commands);
    console.log('📋 Comandos del menú configurados correctamente');
}

// Inicializar bot
async function startBot() {
    try {
        // Verificar conexión a base de datos
        const dbConnected = await db.testConnection();
        if (!dbConnected) {
            console.error('❌ No se pudo conectar a la base de datos. Verifica la configuración.');
            process.exit(1);
        }

        // Configurar comandos del menú
        await setupBotCommands();

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