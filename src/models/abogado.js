const db = require('../config/database');

class AbogadoModel {
    async crear(nombre, email = null, telefono = null) {
        const sql = 'INSERT INTO abogados (nombre, email, telefono) VALUES (?, ?, ?)';
        return await db.query(sql, [nombre, email, telefono]);
    }

    async obtenerTodos() {
        const sql = 'SELECT * FROM abogados ORDER BY nombre';
        return await db.query(sql);
    }

    async obtenerPorId(id) {
        const sql = 'SELECT * FROM abogados WHERE id = ?';
        const results = await db.query(sql, [id]);
        return results[0];
    }

    async existe(nombre) {
        const sql = 'SELECT COUNT(*) as count FROM abogados WHERE nombre = ?';
        const results = await db.query(sql, [nombre]);
        return results[0].count > 0;
    }
}

module.exports = new AbogadoModel();