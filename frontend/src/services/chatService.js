import api from './api';

const chatService = {
  getConversations: () => api.get('/api/chat/conversations').then(r => r.data),
  startConversation: (payload) => api.post('/api/chat/conversations', payload).then(r => r.data),
  getMessages: (conversationId) => api.get(`/api/chat/conversations/${conversationId}/messages`).then(r => r.data),
  sendMessage: (conversationId, body) => api.post(`/api/chat/conversations/${conversationId}/messages`, { body }).then(r => r.data),
};

export default chatService;
