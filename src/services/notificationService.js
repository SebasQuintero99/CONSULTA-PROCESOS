const db = require('../config/database');

class NotificationService {
    constructor(bot) {
        this.bot = bot;
    }

    async notificarCambiosEnProceso(resultado) {
        try {
            if (!resultado.hayChangios || !resultado.ultimaActuacion) {
                return;
            }

            const { proceso, ultimaActuacion, procesoActual } = resultado;

            // Obtener información del abogado para notificar
            const abogado = await db.obtenerAbogadoPorId(proceso.abogado_id);
            if (!abogado) {
                console.error(`❌ No se encontró abogado para proceso ${proceso.numero_radicacion}`);
                return;
            }

            // Obtener el admin user ID del .env
            const adminUserId = process.env.ADMIN_USER_ID;
            if (!adminUserId) {
                console.error('❌ ADMIN_USER_ID no configurado en .env');
                return;
            }

            // Construir mensaje de notificación
            let mensaje = `🚨 *ACTUALIZACION DE PROCESO* 🚨\n\n`;
            mensaje += `📋 *Proceso:* ${proceso.numero_radicacion}\n`;
            mensaje += `👤 *Abogado:* ${abogado.nombre}\n`;
            mensaje += `📝 *Descripción:* ${proceso.descripcion || 'Sin descripción'}\n`;

            if (procesoActual.datos.despacho) {
                mensaje += `🏛️ *Juzgado:* ${procesoActual.datos.despacho}\n`;
            }

            if (procesoActual.datos.ponente) {
                mensaje += `⚖️ *Ponente:* ${procesoActual.datos.ponente}\n`;
            }

            mensaje += `\n📅 *Nueva Actuación:*\n\n`;

            // Mostrar la nueva actuación
            const fecha = new Date(ultimaActuacion.fechaActuacion).toLocaleDateString('es-CO', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });

            mensaje += `📅 **Fecha:** ${fecha}\n`;
            mensaje += `📝 **Actuación:** ${ultimaActuacion.actuacion || 'Sin descripción'}\n`;

            if (ultimaActuacion.anotacion) {
                mensaje += `📌 **Anotación:** ${ultimaActuacion.anotacion}\n`;
            }

            mensaje += '\n';

            mensaje += `🕐 *Notificación enviada:* ${new Date().toLocaleString('es-CO')}\n`;
            mensaje += `\n_Sistema automático de revisión de estados_`;

            // Enviar notificación al admin
            await this.bot.telegram.sendMessage(adminUserId, mensaje, {
                parse_mode: 'Markdown',
                disable_web_page_preview: true
            });

            console.log(`✅ Notificación enviada para proceso ${proceso.numero_radicacion}`);

        } catch (error) {
            console.error('❌ Error enviando notificación:', error.message);
        }
    }

    async notificarErrorEnProceso(proceso, error) {
        try {
            const adminUserId = process.env.ADMIN_USER_ID;
            if (!adminUserId) {
                return;
            }

            let mensaje = `⚠️ *ERROR EN CONSULTA DE PROCESO* ⚠️\n\n`;
            mensaje += `📋 *Proceso:* ${proceso.numero_radicacion}\n`;
            mensaje += `👤 *Abogado:* ${proceso.abogado_nombre}\n`;
            mensaje += `❌ *Error:* ${error}\n`;
            mensaje += `🕐 *Fecha:* ${new Date().toLocaleString('es-CO')}\n`;
            mensaje += `\n_Sistema automático de revisión de estados_`;

            await this.bot.telegram.sendMessage(adminUserId, mensaje, {
                parse_mode: 'Markdown',
                disable_web_page_preview: true
            });

            console.log(`⚠️ Notificación de error enviada para proceso ${proceso.numero_radicacion}`);

        } catch (error) {
            console.error('❌ Error enviando notificación de error:', error.message);
        }
    }

    async enviarReporteRevisionDiaria(resultados) {
        try {
            const adminUserId = process.env.ADMIN_USER_ID;
            if (!adminUserId) {
                return;
            }

            const totalProcesos = resultados.length;
            const procesosConCambios = resultados.filter(r => r.actualizado).length;
            const procesosConError = resultados.filter(r => r.error).length;
            const procesosSinCambios = totalProcesos - procesosConCambios - procesosConError;

            let mensaje = `📊 *REPORTE DE REVISIÓN DIARIA* 📊\n\n`;
            mensaje += `📅 *Fecha:* ${new Date().toLocaleDateString('es-CO', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })}\n\n`;

            mensaje += `📈 *Resumen:*\n`;
            mensaje += `• Total procesos revisados: ${totalProcesos}\n`;
            mensaje += `• Con cambios: ${procesosConCambios} ✅\n`;
            mensaje += `• Sin cambios: ${procesosSinCambios} ⭐\n`;
            mensaje += `• Con errores: ${procesosConError} ❌\n\n`;

            // Detalles de procesos con cambios
            if (procesosConCambios > 0) {
                mensaje += `🆕 *Procesos con cambios:*\n`;
                resultados.filter(r => r.actualizado).forEach((resultado, index) => {
                    mensaje += `${index + 1}. ${resultado.proceso.numero_radicacion}\n`;
                    mensaje += `   👤 ${resultado.proceso.abogado_nombre}\n`;
                    mensaje += `   📝 Nueva actuación detectada\n\n`;
                });
            }

            // Procesos con errores
            if (procesosConError > 0) {
                mensaje += `⚠️ *Procesos con errores:*\n`;
                resultados.filter(r => r.error).forEach((resultado, index) => {
                    mensaje += `${index + 1}. ${resultado.proceso.numero_radicacion}\n`;
                    mensaje += `   👤 ${resultado.proceso.abogado_nombre}\n`;
                    mensaje += `   ❌ ${resultado.error}\n\n`;
                });
            }

            mensaje += `🤖 _Sistema automático de revisión de estados_`;

            await this.bot.telegram.sendMessage(adminUserId, mensaje, {
                parse_mode: 'Markdown',
                disable_web_page_preview: true
            });

            console.log('✅ Reporte diario enviado');

        } catch (error) {
            console.error('❌ Error enviando reporte diario:', error.message);
        }
    }

    async notificarInicioRevision() {
        try {
            const adminUserId = process.env.ADMIN_USER_ID;
            if (!adminUserId) {
                return;
            }

            const totalProcesos = await db.query('SELECT COUNT(*) as total FROM procesos');
            const count = totalProcesos[0].total;

            let mensaje = `🔄 *INICIANDO REVISIÓN AUTOMÁTICA* 🔄\n\n`;
            mensaje += `📅 *Fecha:* ${new Date().toLocaleString('es-CO')}\n`;
            mensaje += `📋 *Procesos a revisar:* ${count}\n`;
            mensaje += `⏱️ *Tiempo estimado:* ${Math.ceil(count * 2 / 60)} minuto(s)\n\n`;
            mensaje += `_El sistema verificará automáticamente todos los procesos registrados_`;

            await this.bot.telegram.sendMessage(adminUserId, mensaje, {
                parse_mode: 'Markdown',
                disable_web_page_preview: true
            });

            console.log('🔄 Notificación de inicio de revisión enviada');

        } catch (error) {
            console.error('❌ Error enviando notificación de inicio:', error.message);
        }
    }
}

module.exports = NotificationService;