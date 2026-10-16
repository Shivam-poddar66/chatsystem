const db = require('../config/database');

class User {
    static async findByEmail(email) {
        const [rows] = await db.execute(
            'SELECT * FROM users WHERE email = ? LIMIT 1',
            [email.toLowerCase().trim()]
        );
        return rows[0] || null;
    }

    static async findById(id) {
        const [rows] = await db.execute(
            'SELECT id, name, email, phone, avatar, status, last_seen_at, created_at FROM users WHERE id = ? LIMIT 1',
            [id]
        );
        return rows[0] || null;
    }

    static async create({ name, email, phone = null, password, avatar = null }) {
        const [result] = await db.execute(
            'INSERT INTO users (name, email, phone, password, avatar, status) VALUES (?, ?, ?, ?, ?, ?)',
            [name, email.toLowerCase().trim(), phone, password, avatar, 'offline']
        );
        return this.findById(result.insertId);
    }

    static async getAllExcept(currentUserId) {
        const [rows] = await db.execute(
            `SELECT id, name, email, phone, avatar, status, last_seen_at 
             FROM users 
             WHERE id != ? 
             ORDER BY status DESC, name ASC`,
            [currentUserId]
        );
        return rows;
    }

    static async updateStatus(userId, status, lastSeenAt = null) {
        if (lastSeenAt) {
            await db.execute(
                'UPDATE users SET status = ?, last_seen_at = ? WHERE id = ?',
                [status, lastSeenAt, userId]
            );
        } else {
            await db.execute(
                'UPDATE users SET status = ? WHERE id = ?',
                [status, userId]
            );
        }
    }
}

module.exports = User;
