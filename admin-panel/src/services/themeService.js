import api from './api';

const themeService = {
  async getAll(params = {}) {
    const response = await api.get('/admin/themes', { params });
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/admin/themes/${id}`);
    return response.data.theme;
  },

  async create(data) {
    const response = await api.post('/admin/themes', data);
    return response.data.theme;
  },

  async update(id, data) {
    const response = await api.put(`/admin/themes/${id}`, data);
    return response.data.theme;
  },

  async delete(id) {
    const response = await api.delete(`/admin/themes/${id}`);
    return response.data;
  },

  // For dropdowns (public API)
  async getAllPublic(language = 'pt') {
    const response = await api.get('/themes', { params: { language } });
    return response.data.themes;
  },
};

export default themeService;
