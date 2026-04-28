import api from './api';

const paymentService = {
  createIntent: (reservation_id) =>
    api.post('/api/payments/create-intent', { reservation_id }).then(r => r.data),
};

export default paymentService;