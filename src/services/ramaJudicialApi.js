const axios = require('axios');
const db = require('../config/database');

class RamaJudicialApiService {
    constructor() {
        this.baseURL = 'https://consultaprocesos.ramajudicial.gov.co:448/api/v2';
        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
    }

    async consultarProceso(numeroRadicacion) {
        try {
            console.log(`🔍 Consultando proceso: ${numeroRadicacion}`);

            const response = await this.client.get(`/Procesos/Consulta/NumeroRadicacion`, {
                params: {
                    numero: numeroRadicacion,
                    SoloActivos: false,
                    pagina: 1
                }
            });

            // No registrar log aquí ya que no tenemos proceso_id aún

            if (!response.data || !response.data.procesos || response.data.procesos.length === 0) {
                console.log(`❌ No se encontró el proceso ${numeroRadicacion}`);
                return null;
            }

            const proceso = response.data.procesos[0];
            console.log(`✅ Proceso encontrado - ID: ${proceso.idProceso}`);

            return {
                idProceso: proceso.idProceso,
                numeroRadicacion: proceso.numeroRadicacion,
                despacho: proceso.despacho,
                ponente: proceso.ponente,
                fechaUltimaActualizacion: proceso.fechaUltimaActuacion,
                fechaProceso: proceso.fechaProceso,
                sujetosProcesales: proceso.sujetosProcesales,
                datos: proceso
            };

        } catch (error) {
            console.error(`❌ Error consultando proceso ${numeroRadicacion}:`, error.message);
            // No registrar log aquí ya que no tenemos proceso_id
            throw error;
        }
    }

    async obtenerDetallesProceso(idProceso) {
        try {
            console.log(`📋 Obteniendo detalles del proceso ID: ${idProceso}`);

            const response = await this.client.get(`/Proceso/Detalle/${idProceso}`);

            if (!response.data) {
                console.log(`❌ No se encontraron detalles para el proceso ID: ${idProceso}`);
                return null;
            }

            console.log(`✅ Detalles obtenidos para proceso ID: ${idProceso}`);
            return response.data;

        } catch (error) {
            console.error(`❌ Error obteniendo detalles del proceso ${idProceso}:`, error.message);
            throw error;
        }
    }

    async obtenerActuaciones(idProceso, pagina = 1) {
        try {
            console.log(`📝 Obteniendo actuaciones del proceso ID: ${idProceso}, página: ${pagina}`);

            const response = await this.client.get(`/Proceso/Actuaciones/${idProceso}`, {
                params: { pagina }
            });

            if (!response.data || !response.data.actuaciones) {
                console.log(`❌ No se encontraron actuaciones para el proceso ID: ${idProceso}`);
                return { actuaciones: [], totalPages: 0 };
            }

            console.log(`✅ Actuaciones obtenidas: ${response.data.actuaciones.length} registros`);
            return {
                actuaciones: response.data.actuaciones,
                totalPages: response.data.paginacion?.totalPages || 1,
                currentPage: pagina
            };

        } catch (error) {
            console.error(`❌ Error obteniendo actuaciones del proceso ${idProceso}:`, error.message);
            throw error;
        }
    }

    async verificarCambiosEnProceso(numeroRadicacion, procesoId) {
        try {
            console.log(`🔄 Verificando cambios en proceso: ${numeroRadicacion}`);

            // Consultar información actual del proceso
            const procesoActual = await this.consultarProceso(numeroRadicacion);
            if (!procesoActual) {
                return { hayChangios: false, mensaje: 'Proceso no encontrado' };
            }

            // Obtener la fecha de última actualización guardada en base de datos
            const procesoGuardado = await db.query(`
                SELECT fechaUltimaActuacion
                FROM procesos
                WHERE id = ?
            `, [procesoId]);

            const fechaGuardada = procesoGuardado.length > 0 && procesoGuardado[0].fechaUltimaActuacion
                ? new Date(procesoGuardado[0].fechaUltimaActuacion)
                : null;

            const fechaActual = procesoActual.fechaUltimaActualizacion
                ? new Date(procesoActual.fechaUltimaActualizacion)
                : null;

            // Si no hay fecha guardada, es la primera vez
            if (!fechaGuardada) {
                console.log(`🆕 Primera vez consultando proceso ${numeroRadicacion}`);
                return {
                    hayChangios: true,
                    mensaje: 'Primera consulta del proceso',
                    procesoActual,
                    requiereActuacion: true
                };
            }

            // Si no hay fecha actual, verificar si faltan datos básicos
            if (!fechaActual) {
                console.log(`⚠️ Proceso sin fechaUltimaActualizacion: ${numeroRadicacion}`);

                // Verificar si faltan datos básicos del primer endpoint
                const procesoGuardadoCompleto = await db.query(`
                    SELECT fecha_radicacion, sujetos_procesales, id_proceso_rama
                    FROM procesos WHERE id = ?
                `, [procesoId]);

                const datosGuardados = procesoGuardadoCompleto[0];
                const faltanDatos = !datosGuardados.fecha_radicacion ||
                                  !datosGuardados.sujetos_procesales ||
                                  !datosGuardados.id_proceso_rama;

                if (faltanDatos) {
                    console.log(`🔄 Actualizando datos básicos faltantes para: ${numeroRadicacion}`);
                    return {
                        hayChangios: true,
                        mensaje: 'Actualizando datos básicos del primer endpoint',
                        procesoActual,
                        requiereActuacion: false // No obtener actuaciones si no hay fecha
                    };
                }

                return {
                    hayChangios: false,
                    mensaje: 'Proceso sin fecha de última actualización',
                    procesoActual
                };
            }

            // Comparar fechas de última actualización
            if (fechaActual > fechaGuardada) {
                console.log(`🆕 Proceso actualizado: ${numeroRadicacion}`);
                console.log(`   Fecha guardada: ${fechaGuardada.toISOString()}`);
                console.log(`   Fecha actual: ${fechaActual.toISOString()}`);
                return {
                    hayChangios: true,
                    mensaje: 'Proceso actualizado',
                    procesoActual,
                    requiereActuacion: true
                };
            }

            console.log(`✅ Sin cambios en proceso: ${numeroRadicacion}`);
            return {
                hayChangios: false,
                mensaje: 'Sin cambios en el proceso',
                procesoActual
            };

        } catch (error) {
            console.error(`❌ Error verificando cambios en proceso ${numeroRadicacion}:`, error.message);
            return {
                hayChangios: false,
                mensaje: `Error: ${error.message}`
            };
        }
    }

    async actualizarProceso(numeroRadicacion, procesoId) {
        try {
            console.log(`🔄 Actualizando información del proceso: ${numeroRadicacion}`);

            const resultado = await this.verificarCambiosEnProceso(numeroRadicacion, procesoId);

            if (!resultado.hayChangios) {
                return resultado;
            }

            const { procesoActual } = resultado;

            // Actualizar información básica del proceso
            await db.query(`
                UPDATE procesos SET
                    id_proceso_rama = ?,
                    juzgado = ?,
                    estado = ?,
                    fecha_radicacion = ?,
                    sujetos_procesales = ?,
                    fechaUltimaActuacion = ?
                WHERE id = ?
            `, [
                procesoActual.idProceso,
                procesoActual.despacho || null,
                procesoActual.ponente || null,
                procesoActual.fechaProceso || null,
                procesoActual.sujetosProcesales ? JSON.stringify(procesoActual.sujetosProcesales) : null,
                procesoActual.fechaUltimaActualizacion || null,
                procesoId
            ]);

            // Solo obtener y guardar UNA actuación si se requiere
            if (resultado.requiereActuacion) {
                const actuacionesActuales = await this.obtenerActuaciones(procesoActual.idProceso);
                if (actuacionesActuales.actuaciones.length > 0) {
                    const ultimaActuacion = actuacionesActuales.actuaciones[0];

                    // Borrar la actuación anterior (si existe) y guardar solo la nueva
                    await db.query(`DELETE FROM actuaciones WHERE proceso_id = ?`, [procesoId]);

                    await db.query(`
                        INSERT INTO actuaciones
                        (proceso_id, fecha_actuacion, actuacion, anotacion, fecha_inicial, fecha_final, fecha_registro)
                        VALUES (?, ?, ?, ?, ?, ?, NOW())
                    `, [
                        procesoId,
                        ultimaActuacion.fechaActuacion,
                        ultimaActuacion.actuacion || 'Sin descripción',
                        ultimaActuacion.anotacion || null,
                        ultimaActuacion.fechaInicial || null,
                        ultimaActuacion.fechaFinal || null
                    ]);

                    // Agregar la actuación al resultado para notificaciones
                    resultado.ultimaActuacion = ultimaActuacion;
                }
            }

            console.log(`✅ Proceso actualizado exitosamente`);
            return resultado;

        } catch (error) {
            console.error(`❌ Error actualizando proceso ${numeroRadicacion}:`, error.message);
            throw error;
        }
    }

    async registrarLog(procesoId, plataformaId, exito, mensaje) {
        try {
            // Si no hay procesoId, usar NULL explícitamente
            const procesoIdValue = procesoId || null;
            const plataformaIdValue = plataformaId || null;

            await db.query(`
                INSERT INTO logs_consultas (proceso_id, plataforma_id, exito, mensaje, fecha_consulta)
                VALUES (?, ?, ?, ?, NOW())
            `, [procesoIdValue, plataformaIdValue, exito, mensaje]);
        } catch (error) {
            // Si hay error con el log, lo registramos pero no bloqueamos el proceso principal
            console.error('Error registrando log:', error.message);
        }
    }

    async verificarTodosProcesos() {
        try {
            console.log('🔄 Iniciando verificación de todos los procesos...');

            // Obtener todos los procesos activos
            const procesos = await db.query(`
                SELECT p.*, a.nombre as abogado_nombre, pl.nombre as plataforma_nombre
                FROM procesos p
                JOIN abogados a ON p.abogado_id = a.id
                JOIN plataformas pl ON p.plataforma_id = pl.id
                ORDER BY p.numero_radicacion
            `);

            const resultados = [];

            for (const proceso of procesos) {
                console.log(`\n📋 Verificando: ${proceso.numero_radicacion}`);

                try {
                    const resultado = await this.verificarCambiosEnProceso(proceso.numero_radicacion, proceso.id);

                    if (resultado.hayChangios) {
                        await this.actualizarProceso(proceso.numero_radicacion, proceso.id);
                        resultados.push({
                            proceso: proceso,
                            cambios: resultado,
                            actualizado: true
                        });
                    } else {
                        resultados.push({
                            proceso: proceso,
                            cambios: resultado,
                            actualizado: false
                        });
                    }

                    // Pausa entre consultas para no saturar la API
                    await new Promise(resolve => setTimeout(resolve, 2000));

                } catch (error) {
                    console.error(`❌ Error procesando ${proceso.numero_radicacion}:`, error.message);
                    resultados.push({
                        proceso: proceso,
                        error: error.message,
                        actualizado: false
                    });
                }
            }

            console.log(`\n✅ Verificación completada. ${resultados.length} procesos revisados`);
            return resultados;

        } catch (error) {
            console.error('❌ Error en verificación masiva:', error.message);
            throw error;
        }
    }
}

module.exports = new RamaJudicialApiService();