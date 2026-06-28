import api from './api';

const apartmentService = {
  getAll: (params) => api.get('/api/apartments', { params }).then(r => r.data),
  getOne: (id) => api.get(`/api/apartments/${id}`).then(r => r.data),
  create: (payload) => api.post('/api/apartments', payload).then(r => r.data),
  update: (id, payload) => api.put(`/api/apartments/${id}`, payload).then(r => r.data),
  delete: (id) => api.delete(`/api/apartments/${id}`).then(r => r.data),
  deleteImage: (aptId, imageId) => api.delete(`/api/apartments/${aptId}/images/${imageId}`).then(r => r.data),
  getReviews: (id) => api.get(`/api/reviews/apartment/${id}`).then(r => r.data),
  getMine: () => api.get('/api/apartments/my').then(r => r.data),
  getBlockedDates: (id) => api.get(`/api/apartments/${id}/blocked-dates`).then(r => r.data),
  blockDates: (id, dates) => api.post(`/api/apartments/${id}/blocked-dates`, { dates }).then(r => r.data),
  unblockDates: (id, dates) => api.delete(`/api/apartments/${id}/blocked-dates`, { data: { dates } }).then(r => r.data),
};

export default apartmentService;