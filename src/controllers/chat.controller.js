const ChatService = require('../services/chat.service');
const Conversation = require('../models/Conversation');
const presenceService = require('../services/presence.service');

class ChatController {
    static async getConversations(req, res) {
        try {
            const userId = req.user.id;
            const conversations = await ChatService.getUserConversations(userId);

            const enriched = conversations.map((c) => ({
                ...c,
                other_user_status: presenceService.isUserOnline(c.other_user_id) ? 'online' : 'offline',
            }));

            return res.json({ success: true, data: enriched });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    static async getOrCreateConversation(req, res) {
        try {
            const currentUserId = req.user.id;
            const { targetUserId } = req.body;

            if (!targetUserId) {
                return res.status(400).json({ success: false, message: 'targetUserId is required' });
            }

            const conversationId = await Conversation.findOrCreatePrivate(currentUserId, targetUserId);
            return res.json({ success: true, data: { conversationId } });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    static async getMessages(req, res) {
        try {
            const { conversationId } = req.params;
            const limit = parseInt(req.query.limit, 10) || 50;
            const beforeId = req.query.beforeId ? parseInt(req.query.beforeId, 10) : null;

            const messages = await ChatService.getMessages(conversationId, limit, beforeId);
            return res.json({ success: true, data: messages });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    static async markRead(req, res) {
        try {
            const { conversationId } = req.params;
            const { messageIds } = req.body;
            await ChatService.markAsRead(conversationId, req.user.id, messageIds);
            return res.json({ success: true, message: 'Messages marked as read' });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = ChatController;
