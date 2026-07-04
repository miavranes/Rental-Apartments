// Single source of truth for backend URLs. Set REACT_APP_API_URL in
// frontend/.env for staging/production deploys; falls back to localhost
// for local development.
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
export const UPLOADS_URL = `${API_URL}/uploads/`;
