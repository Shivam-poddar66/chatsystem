const db = require('../config/database');

class Message {
    static async create({ conversationId, senderId, originalContent, maskedContent, status = 'sent' }) {
        const [result] = await db.execute(
            `INSERT INTO messages (conversation_id, sender_id, original_content, masked_content, status) 
             VALUES (?, ?, ?, ?, ?)`,
            [conversationId, senderId, originalContent, maskedContent, status]
        );

        // Update the conversation's updated_at timestamp
        await db.execute(
            'UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [conversationId]
        );

        return {
            id: result.insertId,
            conversationId,
            senderId,
            originalContent,
            maskedContent,
            status,
            createdAt: new Date(),
        };
    }

    /**
     * Retrieve paginated messages for a conversation in chronological order.
     */
    static async getByConversation(conversationId, limit = 50, beforeId = null) {
        let query;
        let params;

        if (beforeId) {
            query = `
                SELECT 
                    m.id,
                    m.conversation_id AS conversationId,
                    m.sender_id AS senderId,
                    m.masked_content AS content,
                    m.status,
                    m.created_at AS createdAt,
                    u.name AS senderName,
                    u.avatar AS senderAvatar
                FROM messages m
                JOIN users u ON m.sender_id = u.id
                WHERE m.conversation_id = ? AND m.id < ?
                ORDER BY m.id DESC
                LIMIT ?
            `;
            params = [conversationId, beforeId, limit];
        } else {
            query = `
                SELECT 
                    m.id,
                    m.conversation_id AS conversationId,
                    m.sender_id AS senderId,
                    m.masked_content AS content,
                    m.status,
                    m.created_at AS createdAt,
                    u.name AS senderName,
                    u.avatar AS senderAvatar
                FROM messages m
                JOIN users u ON m.sender_id = u.id
                WHERE m.conversation_id = ?
                ORDER BY m.id DESC
                LIMIT ?
            `;
            params = [conversationId, limit];
        }

        const [rows] = await db.execute(query, params);
        // Reverse to return chronological order (oldest to newest)
        return rows.reverse();
    }

    /**
     * Mark messages in a conversation as read by the other party.
     */
    static async markAsRead(conversationId, readerId, messageIds = null) {
        if (Array.isArray(messageIds) && messageIds.length > 0) {
            const placeholders = messageIds.map(() => '?').join(',');
            await db.execute(
                `UPDATE messages 
                 SET status = 'read' 
                 WHERE conversation_id = ? 
                   AND sender_id != ? 
                   AND id IN (${placeholders})`,
                [conversationId, readerId, ...messageIds]
            );
        } else {
            await db.execute(
                `UPDATE messages 
                 SET status = 'read' 
                 WHERE conversation_id = ? 
                   AND sender_id != ? 
                   AND status != 'read'`,
                [conversationId, readerId]
            );
        }
    }
}

module.exports = Message;
