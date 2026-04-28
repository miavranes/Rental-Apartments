import api from './api';

const reservationService = {
  create: (payload) => api.post('/api/reservations', payload).then(r => r.data),
  getMyReservations: () => api.get('/api/reservations/my').then(r => r.data),
  getOwnerReservations: () => api.get('/api/reservations/owner').then(r => r.data),
  confirm: (id) => api.patch(`/api/reservations/${id}/confirm`).then(r => r.data),
  cancel: (id) => api.patch(`/api/reservations/${id}/cancel`).then(r => r.data),
};

export default reservationService;