const db = require('../config/database');

class Conversation {
    /**
     * Finds an existing private conversation between two users or creates a new one.
     */
    static async findOrCreatePrivate(userId1, userId2) {
        const u1 = parseInt(userId1, 10);
        const u2 = parseInt(userId2, 10);

        // Check if a 1-to-1 conversation already exists
        const [existing] = await db.execute(
            `SELECT c.id 
             FROM conversations c
             JOIN conversation_participants cp1 ON c.id = cp1.conversation_id AND cp1.user_id = ?
             JOIN conversation_participants cp2 ON c.id = cp2.conversation_id AND cp2.user_id = ?
             WHERE c.type = 'private'
             LIMIT 1`,
            [u1, u2]
        );

        if (existing.length > 0) {
            return existing[0].id;
        }

        // Create new conversation
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const [convoResult] = await connection.execute(
                "INSERT INTO conversations (type) VALUES ('private')"
            );
            const conversationId = convoResult.insertId;

            await connection.execute(
                'INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?), (?, ?)',
                [conversationId, u1, conversationId, u2]
            );

            await connection.commit();
            return conversationId;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Get all active conversations for a user with the latest message and other participant details.
     */
    static async getUserConversations(userId) {
        const query = `
            SELECT 
                c.id AS conversation_id,
                c.type,
                c.updated_at,
                u.id AS other_user_id,
                u.name AS other_user_name,
                u.email AS other_user_email,
                u.avatar AS other_user_avatar,
                u.status AS other_user_status,
                u.last_seen_at AS other_user_last_seen,
                m.id AS last_message_id,
                m.masked_content AS last_message_content,
                m.sender_id AS last_message_sender_id,
                m.status AS last_message_status,
                m.created_at AS last_message_time,
                (
                    SELECT COUNT(*) 
                    FROM messages unread 
                    WHERE unread.conversation_id = c.id 
                      AND unread.sender_id != ? 
                      AND unread.status != 'read'
                ) AS unread_count
            FROM conversations c
            JOIN conversation_participants cp_me ON c.id = cp_me.conversation_id AND cp_me.user_id = ?
            JOIN conversation_participants cp_other ON c.id = cp_other.conversation_id AND cp_other.user_id != ?
            JOIN users u ON cp_other.user_id = u.id
            LEFT JOIN messages m ON m.id = (
                SELECT sub_m.id 
                FROM messages sub_m 
                WHERE sub_m.conversation_id = c.id 
                ORDER BY sub_m.id DESC 
                LIMIT 1
            )
            ORDER BY c.updated_at DESC
        `;

        const [rows] = await db.execute(query, [userId, userId, userId]);
        return rows;
    }
}

module.exports = Conversation;
