import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_URL ? `${API_URL}/api` : '/api',
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('chatUser') || '{}');
  if (user.token) config.headers.Authorization = `Bearer ${user.token}`;
  return config;
});

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data)
};

export const userAPI = {
  getAll: () => api.get('/users')
};

export const messageAPI = {
  getChatHistory: (userId) => api.get(`/messages/${userId}`),
  uploadImage: (receiverId, file) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('receiverId', receiverId);
    return api.post('/messages/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  delete: (id) => api.delete(`/messages/${id}`)
};

export default api;
