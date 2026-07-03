import api from './api';

const favoriteService = {
  getAll: () => api.get('/api/favorites').then(r => r.data),
  getIds: () => api.get('/api/favorites/ids').then(r => r.data),
  add: (apartmentId) => api.post(`/api/favorites/${apartmentId}`).then(r => r.data),
  remove: (apartmentId) => api.delete(`/api/favorites/${apartmentId}`).then(r => r.data),
};

export default favoriteService;
