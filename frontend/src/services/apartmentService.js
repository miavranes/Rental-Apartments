import api from './api';

const apartmentService = {
  getAll: (params) => api.get('/api/apartments', { params }).then(r => r.data),
  getOne: (id) => api.get(`/api/apartments/${id}`).then(r => r.data),
  create: (payload) => api.post('/api/apartments', payload).then(r => r.data),
  update: (id, payload) => api.put(`/api/apartments/${id}`, payload).then(r => r.data),
  delete: (id) => api.delete(`/api/apartments/${id}`).then(r => r.data),
  getReviews: (id) => api.get(`/api/reviews/apartment/${id}`).then(r => r.data),
};

export default apartmentService;