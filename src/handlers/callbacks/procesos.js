const ProcesoModel = require('../../models/proceso');
const AbogadoModel = require('../../models/abogado');
const db = require('../../config/database');
const { getUserSession } = require('../../middleware/session');

function setupProcesosCallbacks(bot) {
    bot.action(/^select_abogado_(\d+)$/, async (ctx) => {
        const abogadoId = parseInt(ctx.match[1]);
        const session = getUserSession(ctx.from.id);

        if (!session || session.step !== 'proceso_seleccionar_abogado') {
            return;
        }

        session.data.abogado_id = abogadoId;
        session.step = 'proceso_seleccionar_plataforma';

        const { Markup } = require('telegraf');
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
        const session = getUserSession(ctx.from.id);

        if (!session || session.step !== 'proceso_seleccionar_plataforma') return;

        session.data.plataforma_id = plataformaId;
        session.step = 'proceso_numero_radicacion';

        await ctx.editMessageText('📝 Ingresa el número de radicación del proceso:');
    });

    bot.action(/^listar_procesos_abogado_(\d+)$/, async (ctx) => {
        const abogadoId = parseInt(ctx.match[1]);

        try {
            const procesos = await db.obtenerProcesosPorAbogado(abogadoId);
            const abogado = await db.obtenerAbogadoPorId(abogadoId);

            if (procesos.length === 0) {
                return await ctx.editMessageText(`⚖️ El abogado *${abogado.nombre}* no tiene procesos registrados.`, { parse_mode: 'Markdown' });
            }

            let mensaje = `📋 *Procesos de ${abogado.nombre}:*\n\n`;
            procesos.slice(0, 10).forEach((proceso, index) => {
                mensaje += `${index + 1}. *${proceso.numero_radicacion}*\n`;
                if (proceso.descripcion) mensaje += `   📝 ${proceso.descripcion}\n`;
                mensaje += `   🏢 Plataforma: ${proceso.plataforma_nombre}\n`;
                if (proceso.juzgado) mensaje += `   🏛️ Juzgado: ${proceso.juzgado}\n`;
                if (proceso.estado) mensaje += `   📊 Estado: ${proceso.estado}\n`;

                // Agregar información de última actuación
                if (proceso.ultima_actuacion_fecha) {
                    const fechaActuacion = new Date(proceso.ultima_actuacion_fecha).toLocaleDateString('es-CO');
                    mensaje += `   ⚖️ Última actuación: ${fechaActuacion}\n`;
                    if (proceso.ultima_actuacion_descripcion) {
                        // Truncar descripción si es muy larga
                        const descripcion = proceso.ultima_actuacion_descripcion.length > 60
                            ? proceso.ultima_actuacion_descripcion.substring(0, 60) + '...'
                            : proceso.ultima_actuacion_descripcion;
                        mensaje += `   📋 ${descripcion}\n`;
                    }
                } else {
                    mensaje += `   ⚖️ Sin actuaciones registradas\n`;
                }

                mensaje += `   📅 Registrado: ${new Date(proceso.creado_en).toLocaleDateString()}\n\n`;
            });

            if (procesos.length > 10) {
                mensaje += `... y ${procesos.length - 10} procesos más.`;
            }

            await ctx.editMessageText(mensaje, { parse_mode: 'Markdown' });
        } catch (error) {
            console.error('Error al listar procesos por abogado:', error);
            await ctx.editMessageText('❌ Error al obtener los procesos del abogado.');
        }
    });

    bot.action('listar_todos_procesos', async (ctx) => {
        try {
            const procesos = await db.obtenerProcesos();

            if (procesos.length === 0) {
                return await ctx.editMessageText('⚖️ No hay procesos registrados.');
            }

            let mensaje = '📋 *Todos los Procesos Registrados:*\n\n';
            procesos.slice(0, 10).forEach((proceso, index) => {
                mensaje += `${index + 1}. *${proceso.numero_radicacion}*\n`;
                if (proceso.descripcion) mensaje += `   📝 ${proceso.descripcion}\n`;
                mensaje += `   👤 Abogado: ${proceso.abogado_nombre}\n`;
                mensaje += `   🏢 Plataforma: ${proceso.plataforma_nombre}\n`;
                if (proceso.juzgado) mensaje += `   🏛️ Juzgado: ${proceso.juzgado}\n`;
                if (proceso.estado) mensaje += `   📊 Estado: ${proceso.estado}\n`;

                // Agregar información de última actuación
                if (proceso.ultima_actuacion_fecha) {
                    const fechaActuacion = new Date(proceso.ultima_actuacion_fecha).toLocaleDateString('es-CO');
                    mensaje += `   ⚖️ Última actuación: ${fechaActuacion}\n`;
                    if (proceso.ultima_actuacion_descripcion) {
                        // Truncar descripción si es muy larga
                        const descripcion = proceso.ultima_actuacion_descripcion.length > 60
                            ? proceso.ultima_actuacion_descripcion.substring(0, 60) + '...'
                            : proceso.ultima_actuacion_descripcion;
                        mensaje += `   📋 ${descripcion}\n`;
                    }
                } else {
                    mensaje += `   ⚖️ Sin actuaciones registradas\n`;
                }

                mensaje += `   📅 Registrado: ${new Date(proceso.creado_en).toLocaleDateString()}\n\n`;
            });

            if (procesos.length > 10) {
                mensaje += `... y ${procesos.length - 10} procesos más.`;
            }

            await ctx.editMessageText(mensaje, { parse_mode: 'Markdown' });
        } catch (error) {
            console.error('Error al listar todos los procesos:', error);
            await ctx.editMessageText('❌ Error al obtener la lista de procesos.');
        }
    });
}

module.exports = { setupProcesosCallbacks };