const ChatService = require('../services/chat.service');

module.exports = function registerChatHandler(io, socket) {
    const currentUserId = socket.user.id;

    // 1. Send private message
    socket.on('message:send', async (data, ackCallback) => {
        try {
            const { recipientId, content, tempId } = data;

            if (!recipientId || !content || !content.trim()) {
                if (typeof ackCallback === 'function') {
                    return ackCallback({ success: false, error: 'Recipient ID and message content are required' });
                }
                return socket.emit('error', { message: 'Recipient and content required' });
            }

            // ChatService automatically runs phone & email masking and stores to MySQL
            const savedMessage = await ChatService.sendPrivateMessage({
                senderId: currentUserId,
                recipientId,
                content: content.trim(),
            });

            const messagePayload = {
                id: savedMessage.id,
                tempId,
                conversationId: savedMessage.conversationId,
                senderId: currentUserId,
                senderName: socket.user.name,
                recipientId: parseInt(recipientId, 10),
                content: savedMessage.maskedContent, // Masked phone/email
                status: 'sent',
                createdAt: savedMessage.createdAt,
            };

            // Instant WebSocket delivery to recipient's personal room (NO polling needed)
            io.to(`user_${recipientId}`).emit('message:receive', messagePayload);

            // Instant acknowledgment back to the sender
            if (typeof ackCallback === 'function') {
                ackCallback({ success: true, message: messagePayload });
            } else {
                socket.emit('message:sent', messagePayload);
            }
        } catch (error) {
            console.error('Socket message:send error:', error);
            if (typeof ackCallback === 'function') {
                ackCallback({ success: false, error: error.message });
            }
        }
    });

    // 2. Typing indicator
    socket.on('message:typing', ({ recipientId, isTyping }) => {
        if (!recipientId) return;
        io.to(`user_${recipientId}`).emit('user:typing', {
            senderId: currentUserId,
            senderName: socket.user.name,
            isTyping: Boolean(isTyping),
        });
    });

    // 3. Mark message as seen / read receipt
    socket.on('message:seen', async ({ conversationId, senderId, messageIds }) => {
        try {
            if (!conversationId) return;
            await ChatService.markAsRead(conversationId, currentUserId, messageIds);

            // Inform original sender that their messages have been read
            io.to(`user_${senderId}`).emit('message:status_update', {
                conversationId,
                readerId: currentUserId,
                messageIds,
                status: 'read',
            });
        } catch (err) {
            console.error('Socket message:seen error:', err);
        }
    });
};
