const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const MaskingService = require('./masking.service');

class ChatService {
    /**
     * Handles 1-on-1 message sending:
     * 1. Resolves conversation
     * 2. Runs data masking on content
     * 3. Stores in database
     */
    static async sendPrivateMessage({ senderId, recipientId, content }) {
        if (!content || !content.trim()) {
            throw new Error('Message content cannot be empty');
        }

        // 1. Locate or create 1-to-1 conversation
        const conversationId = await Conversation.findOrCreatePrivate(senderId, recipientId);

        // 2. Sensitive PII Masking: Mask phone numbers and emails
        const maskedContent = MaskingService.maskMessage(content);

        // 3. Persist to MySQL
        const savedMessage = await Message.create({
            conversationId,
            senderId,
            originalContent: content,
            maskedContent,
            status: 'sent',
        });

        return {
            ...savedMessage,
            recipientId: parseInt(recipientId, 10),
            content: maskedContent, // Always emit the masked version to clients
        };
    }

    static async getMessages(conversationId, limit = 50, beforeId = null) {
        return Message.getByConversation(conversationId, limit, beforeId);
    }

    static async getUserConversations(userId) {
        return Conversation.getUserConversations(userId);
    }

    static async markAsRead(conversationId, readerId, messageIds = null) {
        return Message.markAsRead(conversationId, readerId, messageIds);
    }
}

module.exports = ChatService;
