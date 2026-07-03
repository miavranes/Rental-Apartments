import api from './api';

const analyticsService = {
  getOwner: () => api.get('/api/analytics/owner').then(r => r.data),
};

export default analyticsService;
