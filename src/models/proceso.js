const db = require('../config/database');

class ProcesoModel {
    async crear(numeroRadicacion, abogadoId, plataformaId, descripcion = null, procesoApi = null) {
        let idProcesoRama = null;
        let juzgado = null;
        let estado = null;
        let fechaRadicacion = null;
        let sujetosProcesales = null;
        let fechaUltimaActualizacion = null;

        // Si hay datos del API, extraer la información
        if (procesoApi) {
            idProcesoRama = procesoApi.idProceso || null;
            juzgado = procesoApi.despacho || null;
            estado = procesoApi.ponente || null;
            fechaRadicacion = procesoApi.fechaProceso || null;
            fechaUltimaActualizacion = procesoApi.fechaUltimaActualizacion || null;

            // Guardar sujetosProcesales como JSON si existe
            if (procesoApi.sujetosProcesales && procesoApi.sujetosProcesales.length > 0) {
                sujetosProcesales = JSON.stringify(procesoApi.sujetosProcesales);
            }
        }

        const sql = `INSERT INTO procesos
                    (numero_radicacion, abogado_id, plataforma_id, descripcion, id_proceso_rama, juzgado, estado, fecha_radicacion, sujetos_procesales, fechaUltimaActuacion)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        return await db.query(sql, [
            numeroRadicacion,
            abogadoId,
            plataformaId,
            descripcion,
            idProcesoRama,
            juzgado,
            estado,
            fechaRadicacion,
            sujetosProcesales,
            fechaUltimaActualizacion
        ]);
    }

    async obtenerTodos() {
        const sql = `SELECT p.*, a.nombre as abogado_nombre, pl.nombre as plataforma_nombre
                    FROM procesos p
                    JOIN abogados a ON p.abogado_id = a.id
                    JOIN plataformas pl ON p.plataforma_id = pl.id
                    ORDER BY p.creado_en DESC`;
        return await db.query(sql);
    }

    async obtenerPorAbogado(abogadoId) {
        const sql = `SELECT p.*, a.nombre as abogado_nombre, pl.nombre as plataforma_nombre
                    FROM procesos p
                    JOIN abogados a ON p.abogado_id = a.id
                    JOIN plataformas pl ON p.plataforma_id = pl.id
                    WHERE p.abogado_id = ?
                    ORDER BY p.creado_en DESC`;
        return await db.query(sql, [abogadoId]);
    }

    async existeNumeroRadicacion(numeroRadicacion) {
        const sql = 'SELECT COUNT(*) as count FROM procesos WHERE numero_radicacion = ?';
        const results = await db.query(sql, [numeroRadicacion]);
        return results[0].count > 0;
    }

    async obtenerPorId(id) {
        const sql = `SELECT p.*, a.nombre as abogado_nombre, pl.nombre as plataforma_nombre
                    FROM procesos p
                    JOIN abogados a ON p.abogado_id = a.id
                    JOIN plataformas pl ON p.plataforma_id = pl.id
                    WHERE p.id = ?`;
        const results = await db.query(sql, [id]);
        return results[0];
    }
}

module.exports = new ProcesoModel();