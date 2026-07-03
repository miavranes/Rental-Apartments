const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getConversations, startConversation, getMessages, sendMessage } = require('../controllers/chatController');

router.get('/conversations', authenticate, getConversations);
router.post('/conversations', authenticate, startConversation);
router.get('/conversations/:id/messages', authenticate, getMessages);
router.post('/conversations/:id/messages', authenticate, sendMessage);

module.exports = router;
