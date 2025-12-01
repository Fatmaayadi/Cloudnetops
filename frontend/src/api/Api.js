import axios from 'axios';

const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const api = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' }
});

// Inject token automatically if present
api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('cnops_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// LOGIN — send email (backend supports email OR username)
export async function login(email, password) {
  const res = await api.post('/auth/login', { email, password });
  return res.data;
}

// SIGNUP — send email for registration
export async function signup(email, password, role) {
  const res = await api.post('/auth/register', { email, password, role });
  return res.data;
}

export default api;
