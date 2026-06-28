import api from './api';

const reviewService = {
  create: (payload) => api.post('/api/reviews', payload).then(r => r.data),
  getForApartment: (id) => api.get(`/api/reviews/apartment/${id}`).then(r => r.data),
};

export default reviewService;
