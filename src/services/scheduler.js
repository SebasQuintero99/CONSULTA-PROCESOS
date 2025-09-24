const cron = require('node-cron');
const ramaJudicialApi = require('./ramaJudicialApi');
const NotificationService = require('./notificationService');

class SchedulerService {
    constructor(bot) {
        this.bot = bot;
        this.notificationService = new NotificationService(bot);
        this.isRunning = false;
        this.scheduledTask = null;
    }

    async ejecutarRevisionCompleta() {
        if (this.isRunning) {
            console.log('⚠️ Ya hay una revisión en curso, omitiendo...');
            return;
        }

        this.isRunning = true;

        try {
            console.log('\n🔄 ===== INICIANDO REVISIÓN AUTOMÁTICA =====');
            console.log(`📅 Fecha: ${new Date().toLocaleString('es-CO')}`);

            // Notificar inicio
            await this.notificationService.notificarInicioRevision();

            // Ejecutar verificación de todos los procesos
            const resultados = await ramaJudicialApi.verificarTodosProcesos();

            // Procesar resultados y notificar cambios
            let procesosConCambios = 0;
            let procesosConError = 0;

            for (const resultado of resultados) {
                if (resultado.error) {
                    procesosConError++;
                    await this.notificationService.notificarErrorEnProceso(resultado.proceso, resultado.error);
                } else if (resultado.actualizado && resultado.cambios.hayChangios) {
                    procesosConCambios++;
                    await this.notificationService.notificarCambiosEnProceso(resultado);
                }
            }

            // Enviar reporte diario
            await this.notificationService.enviarReporteRevisionDiaria(resultados);

            console.log(`\n✅ ===== REVISIÓN COMPLETADA =====`);
            console.log(`📊 Total: ${resultados.length} procesos`);
            console.log(`🆕 Con cambios: ${procesosConCambios}`);
            console.log(`❌ Con errores: ${procesosConError}`);
            console.log(`📅 Finalizada: ${new Date().toLocaleString('es-CO')}\n`);

        } catch (error) {
            console.error('❌ Error en revisión automática:', error.message);

            // Notificar error crítico al admin
            try {
                const adminUserId = process.env.ADMIN_USER_ID;
                if (adminUserId) {
                    await this.bot.telegram.sendMessage(adminUserId,
                        `🚨 *ERROR CRÍTICO EN REVISIÓN AUTOMÁTICA* 🚨\n\n` +
                        `❌ *Error:* ${error.message}\n` +
                        `🕐 *Fecha:* ${new Date().toLocaleString('es-CO')}\n\n` +
                        `_Se requiere revisión manual del sistema_`,
                        { parse_mode: 'Markdown' }
                    );
                }
            } catch (notifError) {
                console.error('❌ Error enviando notificación de error crítico:', notifError.message);
            }

        } finally {
            this.isRunning = false;
        }
    }

    iniciarSchedulerDiario() {
        // Ejecutar todos los días a las 9:00 AM (Colombia GMT-5)
        this.scheduledTask = cron.schedule('0 9 * * *', async () => {
            console.log('🕘 Ejecutando tarea programada diaria...');
            await this.ejecutarRevisionCompleta();
        }, {
            scheduled: true,
            timezone: "America/Bogota"
        });

        console.log('⏰ Scheduler diario iniciado - Se ejecutará todos los días a las 9:00 AM');
        console.log(`📅 Próxima ejecución: ${this.getNextExecutionTime()}`);
    }

    iniciarSchedulerPersonalizado(cronExpression, descripcion = 'personalizado') {
        if (this.scheduledTask) {
            this.scheduledTask.stop();
        }

        this.scheduledTask = cron.schedule(cronExpression, async () => {
            console.log(`🕘 Ejecutando tarea programada ${descripcion}...`);
            await this.ejecutarRevisionCompleta();
        }, {
            scheduled: true,
            timezone: "America/Bogota"
        });

        console.log(`⏰ Scheduler ${descripcion} iniciado con expresión: ${cronExpression}`);
    }

    detenerScheduler() {
        if (this.scheduledTask) {
            this.scheduledTask.stop();
            console.log('⏸️ Scheduler detenido');
            return true;
        }
        return false;
    }

    getNextExecutionTime() {
        if (this.scheduledTask) {
            // Para mostrar la próxima ejecución (aproximación)
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(9, 0, 0, 0);

            return tomorrow.toLocaleString('es-CO');
        }
        return 'No programado';
    }

    getStatus() {
        return {
            isRunning: this.isRunning,
            hasScheduledTask: !!this.scheduledTask,
            nextExecution: this.getNextExecutionTime()
        };
    }

    // Métodos para testing y desarrollo
    async ejecutarRevisionManual() {
        console.log('🔧 Ejecutando revisión manual...');
        await this.ejecutarRevisionCompleta();
    }

    // Para desarrollo: ejecutar cada minuto (usar con cuidado)
    iniciarSchedulerTesting() {
        console.log('⚠️ MODO TESTING: Ejecutando cada minuto');
        this.scheduledTask = cron.schedule('* * * * *', async () => {
            console.log('🧪 Ejecutando tarea de testing...');
            await this.ejecutarRevisionCompleta();
        });
    }

    // Para desarrollo: ejecutar cada 5 minutos
    iniciarSchedulerDesarrollo() {
        console.log('🔧 MODO DESARROLLO: Ejecutando cada 5 minutos');
        this.scheduledTask = cron.schedule('*/5 * * * *', async () => {
            console.log('🔧 Ejecutando tarea de desarrollo...');
            await this.ejecutarRevisionCompleta();
        });
    }
}

module.exports = SchedulerService;