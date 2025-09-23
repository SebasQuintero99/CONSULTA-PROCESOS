const { Telegraf, Markup } = require('telegraf');
const db = require('./database');
const { checkAuthorization, isAdmin, addAuthorizedUser, removeAuthorizedUser, AUTHORIZED_USERS } = require('./auth');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);

// Aplicar middleware de autorización a TODOS los comandos
bot.use(checkAuthorization);

// Estado de conversaciones
const userSessions = {};

// Función para inicializar sesión de usuario
function initUserSession(userId) {
    if (!userSessions[userId]) {
        userSessions[userId] = {
            step: null,
            data: {}
        };
    }
    return userSessions[userId];
}

// Función para limpiar sesión
function clearUserSession(userId) {
    delete userSessions[userId];
}

// Comando start
bot.start(async (ctx) => {
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

// COMANDOS PARA ABOGADOS
bot.command('registrar_abogado', async (ctx) => {
    const session = initUserSession(ctx.from.id);
    session.step = 'abogado_nombre';
    session.data = {};
    await ctx.reply('📝 *Registrar Nuevo Abogado*\n\nIngresa el nombre del abogado:', { parse_mode: 'Markdown' });
});

bot.hears('📝 Registrar Abogado', async (ctx) => {
    const session = initUserSession(ctx.from.id);
    session.step = 'abogado_nombre';
    session.data = {};
    await ctx.reply('📝 *Registrar Nuevo Abogado*\n\nIngresa el nombre del abogado:', { parse_mode: 'Markdown' });
});

// COMANDOS PARA PLATAFORMAS
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

// COMANDOS PARA PROCESOS
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

// COMANDOS DE LISTADO
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

bot.command('listar_procesos', async (ctx) => {
    try {
        const procesos = await db.obtenerProcesos();

        if (procesos.length === 0) {
            return await ctx.reply('⚖️ No hay procesos registrados.');
        }

        let mensaje = '📋 *Procesos Registrados:*\n\n';
        procesos.slice(0, 10).forEach((proceso, index) => {
            mensaje += `${index + 1}. *${proceso.numero_radicacion}*\n`;
            mensaje += `   👤 Abogado: ${proceso.abogado_nombre}\n`;
            mensaje += `   🏢 Plataforma: ${proceso.plataforma_nombre}\n`;
            if (proceso.juzgado) mensaje += `   🏛️ Juzgado: ${proceso.juzgado}\n`;
            if (proceso.estado) mensaje += `   📊 Estado: ${proceso.estado}\n`;
            mensaje += `   📅 Registrado: ${new Date(proceso.creado_en).toLocaleDateString()}\n\n`;
        });

        if (procesos.length > 10) {
            mensaje += `... y ${procesos.length - 10} procesos más.`;
        }

        await ctx.reply(mensaje, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error('Error al listar procesos:', error);
        await ctx.reply('❌ Error al obtener la lista de procesos.');
    }
});

bot.hears('📋 Listar Procesos', async (ctx) => {
    try {
        const procesos = await db.obtenerProcesos();

        if (procesos.length === 0) {
            return await ctx.reply('⚖️ No hay procesos registrados.');
        }

        let mensaje = '📋 *Procesos Registrados:*\n\n';
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

        await ctx.reply(mensaje, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error('Error al listar procesos:', error);
        await ctx.reply('❌ Error al obtener la lista de procesos.');
    }
});

// COMANDOS ADMINISTRATIVOS (solo para administradores)
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

// Manejador de texto para flujos de conversación
bot.on('text', async (ctx) => {
    const userId = ctx.from.id;
    const session = userSessions[userId];

    if (!session || !session.step) return;

    const text = ctx.message.text;

    try {
        switch (session.step) {
            case 'abogado_nombre':
                session.data.nombre = text;
                session.step = 'abogado_email';
                await ctx.reply('📧 Ingresa el email del abogado (o envía /skip para omitir):');
                break;

            case 'abogado_email':
                if (text !== '/skip') {
                    session.data.email = text;
                }
                session.step = 'abogado_telefono';
                await ctx.reply('📱 Ingresa el teléfono del abogado (o envía /skip para omitir):');
                break;

            case 'abogado_telefono':
                if (text !== '/skip') {
                    session.data.telefono = text;
                }

                // Guardar en base de datos
                const result = await db.crearAbogado(
                    session.data.nombre,
                    session.data.email || null,
                    session.data.telefono || null
                );

                clearUserSession(userId);
                await ctx.reply(`✅ *Abogado registrado exitosamente*\n\n👤 *${session.data.nombre}* ha sido agregado al sistema.`, { parse_mode: 'Markdown' });
                break;

            case 'plataforma_nombre':
                session.data.nombre = text;
                session.step = 'plataforma_tipo';

                const tipoKeyboard = Markup.inlineKeyboard([
                    [Markup.button.callback('API', 'tipo_API')],
                    [Markup.button.callback('WebScraping', 'tipo_WebScraping')],
                    [Markup.button.callback('Omitir', 'tipo_skip')]
                ]);

                await ctx.reply('🔧 Selecciona el tipo de plataforma:', tipoKeyboard);
                break;

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
                break;

            case 'proceso_numero_radicacion':
                session.data.numero_radicacion = text;
                session.step = 'proceso_descripcion';
                await ctx.reply('📝 Ingresa una breve descripción del proceso (máximo 100 caracteres):');
                break;

            case 'proceso_descripcion':
                // Validar longitud de descripción
                if (text.length > 100) {
                    return await ctx.reply('❌ La descripción debe tener máximo 100 caracteres. Tu descripción tiene ' + text.length + ' caracteres. Intenta nuevamente:');
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
                break;
        }
    } catch (error) {
        console.error('Error en flujo de conversación:', error);
        clearUserSession(userId);
        await ctx.reply('❌ Ocurrió un error. Por favor, intenta nuevamente.');
    }
});

// Manejadores de callbacks para botones inline
bot.action(/^select_abogado_(\d+)$/, async (ctx) => {
    const abogadoId = parseInt(ctx.match[1]);
    const session = userSessions[ctx.from.id];

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
    const session = userSessions[ctx.from.id];

    if (!session || session.step !== 'proceso_seleccionar_plataforma') return;

    session.data.plataforma_id = plataformaId;
    session.step = 'proceso_numero_radicacion';

    await ctx.editMessageText('📝 Ingresa el número de radicación del proceso:');
});

bot.action(/^tipo_(.+)$/, async (ctx) => {
    const tipo = ctx.match[1];
    const session = userSessions[ctx.from.id];

    if (!session || session.step !== 'plataforma_tipo') return;

    if (tipo !== 'skip') {
        session.data.tipo = tipo;
    }

    session.step = 'plataforma_url';
    await ctx.editMessageText('🌐 Ingresa la URL base de la plataforma (o envía /skip para omitir):');
});

// Inicializar bot
async function startBot() {
    try {
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