import api from './api';

const geocodingService = {
  search: (q) =>
    api.get('/api/geocode/search', { params: { q } }).then(r => r.data),
};

export default geocodingService;
