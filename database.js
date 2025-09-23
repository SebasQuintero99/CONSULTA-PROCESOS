const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

class Database {
    async query(sql, params = []) {
        try {
            const [results] = await pool.execute(sql, params);
            return results;
        } catch (error) {
            console.error('Error en consulta:', error);
            throw error;
        }
    }

    // MÉTODOS PARA ABOGADOS
    async crearAbogado(nombre, email = null, telefono = null) {
        const sql = 'INSERT INTO abogados (nombre, email, telefono) VALUES (?, ?, ?)';
        return await this.query(sql, [nombre, email, telefono]);
    }

    async obtenerAbogados() {
        const sql = 'SELECT * FROM abogados ORDER BY nombre';
        return await this.query(sql);
    }

    async obtenerAbogadoPorId(id) {
        const sql = 'SELECT * FROM abogados WHERE id = ?';
        const results = await this.query(sql, [id]);
        return results[0];
    }

    // MÉTODOS PARA PLATAFORMAS
    async crearPlataforma(nombre, tipo = null, urlBase = null, activo = true) {
        const sql = 'INSERT INTO plataformas (nombre, tipo, url_base, activo) VALUES (?, ?, ?, ?)';
        return await this.query(sql, [nombre, tipo, urlBase, activo]);
    }

    async obtenerPlataformas() {
        const sql = 'SELECT * FROM plataformas WHERE activo = true ORDER BY nombre';
        return await this.query(sql);
    }

    async obtenerPlataformaPorId(id) {
        const sql = 'SELECT * FROM plataformas WHERE id = ?';
        const results = await this.query(sql, [id]);
        return results[0];
    }

    // MÉTODOS PARA PROCESOS
    async existeNumeroRadicacion(numeroRadicacion) {
        const sql = 'SELECT COUNT(*) as count FROM procesos WHERE numero_radicacion = ?';
        const results = await this.query(sql, [numeroRadicacion]);
        return results[0].count > 0;
    }

    async crearProceso(numeroRadicacion, abogadoId, plataformaId, descripcion = null, idProcesoRama = null, juzgado = null, estado = null, fechaRadicacion = null) {
        const sql = `INSERT INTO procesos
                    (numero_radicacion, abogado_id, plataforma_id, descripcion, id_proceso_rama, juzgado, estado, fecha_radicacion)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        return await this.query(sql, [numeroRadicacion, abogadoId, plataformaId, descripcion, idProcesoRama, juzgado, estado, fechaRadicacion]);
    }

    async obtenerProcesos() {
        const sql = `SELECT p.*, a.nombre as abogado_nombre, pl.nombre as plataforma_nombre
                    FROM procesos p
                    JOIN abogados a ON p.abogado_id = a.id
                    JOIN plataformas pl ON p.plataforma_id = pl.id
                    ORDER BY p.creado_en DESC`;
        return await this.query(sql);
    }

    async obtenerProcesosPorAbogado(abogadoId) {
        const sql = `SELECT p.*, a.nombre as abogado_nombre, pl.nombre as plataforma_nombre
                    FROM procesos p
                    JOIN abogados a ON p.abogado_id = a.id
                    JOIN plataformas pl ON p.plataforma_id = pl.id
                    WHERE p.abogado_id = ?
                    ORDER BY p.creado_en DESC`;
        return await this.query(sql, [abogadoId]);
    }

    // MÉTODO PARA VERIFICAR CONEXIÓN
    async testConnection() {
        try {
            await this.query('SELECT 1');
            console.log('✅ Conexión a base de datos exitosa');
            return true;
        } catch (error) {
            console.error('❌ Error al conectar con la base de datos:', error);
            return false;
        }
    }
}

module.exports = new Database();