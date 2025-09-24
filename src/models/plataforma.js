const db = require('../config/database');

class PlataformaModel {
    async crear(nombre, tipo = null, urlBase = null, activo = true) {
        const sql = 'INSERT INTO plataformas (nombre, tipo, url_base, activo) VALUES (?, ?, ?, ?)';
        return await db.query(sql, [nombre, tipo, urlBase, activo]);
    }

    async obtenerTodas() {
        const sql = 'SELECT * FROM plataformas WHERE activo = true ORDER BY nombre';
        return await db.query(sql);
    }

    async obtenerPorId(id) {
        const sql = 'SELECT * FROM plataformas WHERE id = ?';
        const results = await db.query(sql, [id]);
        return results[0];
    }

    async existe(nombre) {
        const sql = 'SELECT COUNT(*) as count FROM plataformas WHERE nombre = ?';
        const results = await db.query(sql, [nombre]);
        return results[0].count > 0;
    }
}

module.exports = new PlataformaModel();