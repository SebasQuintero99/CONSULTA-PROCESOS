const { Markup } = require('telegraf');
const SchedulerService = require('../../services/scheduler');
const ramaJudicialApi = require('../../services/ramaJudicialApi');
const NotificationService = require('../../services/notificationService');

let schedulerService;

function setupRevisionCommands(bot) {
    // Inicializar scheduler service
    schedulerService = new SchedulerService(bot);

    // Handlers para botones del teclado principal
    bot.hears('🔍 Revisar Estados', async (ctx) => {
        try {
            await ctx.reply('🔄 *Iniciando revisión manual de estados...*\n\nEsto puede tomar algunos minutos.', { parse_mode: 'Markdown' });
            await schedulerService.ejecutarRevisionManual();
            await ctx.reply('✅ *Revisión manual completada*\n\nVerifica las notificaciones para ver los resultados.', { parse_mode: 'Markdown' });
        } catch (error) {
            console.error('Error en revisión manual:', error);
            await ctx.reply('❌ Error al ejecutar la revisión manual. Intenta nuevamente.');
        }
    });

    bot.hears('📊 Estado Automatización', async (ctx) => {
        try {
            const status = schedulerService.getStatus();

            let mensaje = '📊 *Estado del Sistema de Automatización*\n\n';
            mensaje += `🔄 *Revisión en curso:* ${status.isRunning ? 'Sí ✅' : 'No ⭐'}\n`;
            mensaje += `⏰ *Programación activa:* ${status.hasScheduledTask ? 'Sí ✅' : 'No ❌'}\n`;
            mensaje += `📅 *Próxima ejecución:* ${status.nextExecution}\n\n`;

            try {
                const totalProcesos = await require('../../config/database').query('SELECT COUNT(*) as total FROM procesos');
                mensaje += `📋 *Total procesos registrados:* ${totalProcesos[0].total}\n`;

                const ultimoLog = await require('../../config/database').query(`
                    SELECT fecha_consulta, exito, mensaje
                    FROM logs_consultas
                    ORDER BY fecha_consulta DESC
                    LIMIT 1
                `);

                if (ultimoLog.length > 0) {
                    const log = ultimoLog[0];
                    const fecha = new Date(log.fecha_consulta).toLocaleString('es-CO');
                    mensaje += `🕐 *Última consulta:* ${fecha}\n`;
                    mensaje += `📝 *Estado:* ${log.exito ? '✅ Exitosa' : '❌ Error'}\n`;
                } else {
                    mensaje += `🕐 *Última consulta:* Sin registros\n`;
                }
            } catch (dbError) {
                console.error('Error consultando base de datos:', dbError.message);
                mensaje += `📋 *Base de datos:* ❌ Error de conexión\n`;
                mensaje += `⚠️ *Problema:* ${dbError.code === 'ECONNRESET' ? 'Conexión perdida con Railway' : 'Error de base de datos'}\n`;
            }

            mensaje += '\n_Usa /revisar para ejecutar revisión manual_';

            await ctx.reply(mensaje, { parse_mode: 'Markdown' });
        } catch (error) {
            console.error('Error obteniendo estado:', error.message);
            await ctx.reply(`❌ Error al obtener el estado del sistema.\n\n*Error:* ${error.message}`);
        }
    });

    bot.hears('⚙️ Config. Automatización', async (ctx) => {
        try {
            const keyboard = Markup.inlineKeyboard([
                [Markup.button.callback('⏰ Diario (9:00 AM)', 'auto_daily')],
                [Markup.button.callback('🔧 Desarrollo (5 min)', 'auto_dev')],
                [Markup.button.callback('⏸️ Detener', 'auto_stop')],
                [Markup.button.callback('📊 Estado', 'auto_status')]
            ]);

            await ctx.reply('⚙️ *Configuración de Automatización*\n\nSelecciona una opción:', {
                parse_mode: 'Markdown',
                ...keyboard
            });
        } catch (error) {
            console.error('Error en configuración:', error);
            await ctx.reply('❌ Error al mostrar configuración.');
        }
    });

    // Comandos para revisar estados manualmente
    bot.command(['revisar_estados', 'revisar'], async (ctx) => {
        try {
            await ctx.reply('🔄 *Iniciando revisión manual de estados...*\n\nEsto puede tomar algunos minutos.', { parse_mode: 'Markdown' });

            await schedulerService.ejecutarRevisionManual();

            await ctx.reply('✅ *Revisión manual completada*\n\nVerifica las notificaciones para ver los resultados.', { parse_mode: 'Markdown' });
        } catch (error) {
            console.error('Error en revisión manual:', error);
            await ctx.reply('❌ Error al ejecutar la revisión manual. Intenta nuevamente.');
        }
    });

    // Comando para ver estado del sistema de automatización
    bot.command(['estado_automatizacion', 'estado'], async (ctx) => {
        try {
            const status = schedulerService.getStatus();

            let mensaje = '📊 *Estado del Sistema de Automatización*\n\n';
            mensaje += `🔄 *Revisión en curso:* ${status.isRunning ? 'Sí ✅' : 'No ⭐'}\n`;
            mensaje += `⏰ *Programación activa:* ${status.hasScheduledTask ? 'Sí ✅' : 'No ❌'}\n`;
            mensaje += `📅 *Próxima ejecución:* ${status.nextExecution}\n\n`;

            try {
                const totalProcesos = await require('../../config/database').query('SELECT COUNT(*) as total FROM procesos');
                mensaje += `📋 *Total procesos registrados:* ${totalProcesos[0].total}\n`;

                const ultimoLog = await require('../../config/database').query(`
                    SELECT fecha_consulta, exito, mensaje
                    FROM logs_consultas
                    ORDER BY fecha_consulta DESC
                    LIMIT 1
                `);

                if (ultimoLog.length > 0) {
                    const log = ultimoLog[0];
                    const fecha = new Date(log.fecha_consulta).toLocaleString('es-CO');
                    mensaje += `🕐 *Última consulta:* ${fecha}\n`;
                    mensaje += `📝 *Estado:* ${log.exito ? '✅ Exitosa' : '❌ Error'}\n`;
                } else {
                    mensaje += `🕐 *Última consulta:* Sin registros\n`;
                }
            } catch (dbError) {
                console.error('Error consultando base de datos:', dbError.message);
                mensaje += `📋 *Base de datos:* ❌ Error de conexión\n`;
                mensaje += `⚠️ *Problema:* ${dbError.code === 'ECONNRESET' ? 'Conexión perdida con Railway' : 'Error de base de datos'}\n`;
            }

            mensaje += '\n_Usa /revisar para ejecutar revisión manual_';

            await ctx.reply(mensaje, { parse_mode: 'Markdown' });
        } catch (error) {
            console.error('Error obteniendo estado:', error.message);
            await ctx.reply(`❌ Error al obtener el estado del sistema.\n\n*Error:* ${error.message}`);
        }
    });

    // Comando para consultar un proceso específico
    bot.command(['consultar_proceso', 'consultar'], async (ctx) => {
        try {
            const args = ctx.message.text.split(' ');
            if (args.length < 2) {
                await ctx.reply('❌ *Uso incorrecto*\n\nUsa: `/consultar_proceso NUMERO_RADICACION`\n\nEjemplo: `/consultar_proceso 41001311000120230009300`', { parse_mode: 'Markdown' });
                return;
            }

            const numeroRadicacion = args[1];
            await ctx.reply(`🔍 *Consultando proceso:* ${numeroRadicacion}\n\nPor favor espera...`, { parse_mode: 'Markdown' });

            const resultado = await ramaJudicialApi.consultarProceso(numeroRadicacion);

            if (!resultado) {
                await ctx.reply(`❌ *Proceso no encontrado*\n\nEl proceso ${numeroRadicacion} no existe o no está disponible en el sistema de Rama Judicial.`, { parse_mode: 'Markdown' });
                return;
            }

            // Obtener actuaciones
            const actuaciones = await ramaJudicialApi.obtenerActuaciones(resultado.idProceso);

            let mensaje = `📋 *Información del Proceso*\n\n`;
            mensaje += `🔢 *Número:* ${resultado.numeroRadicacion}\n`;
            mensaje += `🆔 *ID Proceso:* ${resultado.idProceso}\n`;

            if (resultado.despacho) mensaje += `🏛️ *Despacho:* ${resultado.despacho}\n`;
            if (resultado.ponente) mensaje += `⚖️ *Ponente:* ${resultado.ponente}\n`;

            if (actuaciones.actuaciones.length > 0) {
                mensaje += `\n📝 *Últimas 3 Actuaciones:*\n\n`;
                actuaciones.actuaciones.slice(0, 3).forEach((actuacion, index) => {
                    const fecha = new Date(actuacion.fechaActuacion).toLocaleDateString('es-CO');
                    mensaje += `*${index + 1}.* ${fecha}\n`;
                    mensaje += `   ${actuacion.actuacion || 'Sin descripción'}\n`;
                    if (actuacion.anotacion) mensaje += `   📌 ${actuacion.anotacion}\n`;
                    mensaje += '\n';
                });

                if (actuaciones.actuaciones.length > 3) {
                    mensaje += `... y ${actuaciones.actuaciones.length - 3} actuaciones más.\n\n`;
                }
            } else {
                mensaje += `\n📝 *Actuaciones:* Sin actuaciones registradas\n\n`;
            }

            mensaje += `🕐 *Consultado:* ${new Date().toLocaleString('es-CO')}`;

            await ctx.reply(mensaje, { parse_mode: 'Markdown' });

        } catch (error) {
            console.error('Error consultando proceso:', error);
            await ctx.reply('❌ Error al consultar el proceso. Verifica que el número de radicación sea correcto.');
        }
    });

    // Comando para configurar automatización (solo admin)
    bot.command(['config_automatizacion', 'config'], async (ctx) => {
        try {
            const keyboard = Markup.inlineKeyboard([
                [Markup.button.callback('⏰ Diario (9:00 AM)', 'auto_daily')],
                [Markup.button.callback('🔧 Desarrollo (5 min)', 'auto_dev')],
                [Markup.button.callback('⏸️ Detener', 'auto_stop')],
                [Markup.button.callback('📊 Estado', 'auto_status')]
            ]);

            await ctx.reply('⚙️ *Configuración de Automatización*\n\nSelecciona una opción:', {
                parse_mode: 'Markdown',
                ...keyboard
            });
        } catch (error) {
            console.error('Error en configuración:', error);
            await ctx.reply('❌ Error al mostrar configuración.');
        }
    });

    // Callbacks para configuración
    bot.action('auto_daily', async (ctx) => {
        try {
            schedulerService.detenerScheduler();
            schedulerService.iniciarSchedulerDiario();
            await ctx.editMessageText('✅ *Automatización configurada*\n\nSe ejecutará todos los días a las 9:00 AM (hora de Colombia).\n\nPróxima ejecución: ' + schedulerService.getNextExecutionTime(), { parse_mode: 'Markdown' });
        } catch (error) {
            await ctx.editMessageText('❌ Error configurando automatización diaria.');
        }
    });

    bot.action('auto_dev', async (ctx) => {
        try {
            schedulerService.detenerScheduler();
            schedulerService.iniciarSchedulerDesarrollo();
            await ctx.editMessageText('🔧 *Modo Desarrollo Activado*\n\nSe ejecutará cada 5 minutos.\n\n⚠️ Solo para pruebas y desarrollo.', { parse_mode: 'Markdown' });
        } catch (error) {
            await ctx.editMessageText('❌ Error configurando modo desarrollo.');
        }
    });

    bot.action('auto_stop', async (ctx) => {
        try {
            const stopped = schedulerService.detenerScheduler();
            await ctx.editMessageText(stopped ? '⏸️ *Automatización Detenida*\n\nNo se ejecutarán más revisiones programadas.' : '❌ No había automatización activa.', { parse_mode: 'Markdown' });
        } catch (error) {
            await ctx.editMessageText('❌ Error deteniendo automatización.');
        }
    });

    bot.action('auto_status', async (ctx) => {
        try {
            const status = schedulerService.getStatus();
            let mensaje = '📊 *Estado Actual:*\n\n';
            mensaje += `🔄 Revisión en curso: ${status.isRunning ? 'Sí' : 'No'}\n`;
            mensaje += `⏰ Programación activa: ${status.hasScheduledTask ? 'Sí' : 'No'}\n`;
            mensaje += `📅 Próxima ejecución: ${status.nextExecution}`;
            await ctx.editMessageText(mensaje, { parse_mode: 'Markdown' });
        } catch (error) {
            await ctx.editMessageText('❌ Error obteniendo estado.');
        }
    });

    // Iniciar automatización por defecto al arrancar
    setTimeout(() => {
        schedulerService.iniciarSchedulerDiario();
    }, 5000); // Esperar 5 segundos después del inicio del bot
}

module.exports = { setupRevisionCommands };