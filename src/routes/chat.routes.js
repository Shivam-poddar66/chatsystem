const express = require('express');
const router = express.Router();
const ChatController = require('../controllers/chat.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.use(authMiddleware);

router.get('/conversations', ChatController.getConversations);
router.post('/conversations', ChatController.getOrCreateConversation);
router.get('/conversations/:conversationId/messages', ChatController.getMessages);
router.post('/conversations/:conversationId/read', ChatController.markRead);

module.exports = router;
