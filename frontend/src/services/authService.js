import api from './api';

const authService = {
  register: (payload) => api.post('/api/auth/register', payload).then(r => r.data),
  login: (email, password) => api.post('/api/auth/login', { email, password }).then(r => r.data),
  me: () => api.get('/api/auth/me').then(r => r.data),
  updateProfile: (payload) => api.put('/api/auth/profile', payload).then(r => r.data),
  switchRole: () => api.patch('/api/auth/switch-role').then(r => r.data),
  deleteAccount: () => api.delete('/api/auth/account').then(r => r.data),
};

export default authService;