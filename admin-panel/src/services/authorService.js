import api from './api';

const authorService = {
  async getAll(params = {}) {
    const response = await api.get('/admin/authors', { params });
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/admin/authors/${id}`);
    return response.data.author;
  },

  async create(data) {
    const response = await api.post('/admin/authors', data);
    return response.data.author;
  },

  async update(id, data) {
    const response = await api.put(`/admin/authors/${id}`, data);
    return response.data.author;
  },

  async delete(id) {
    const response = await api.delete(`/admin/authors/${id}`);
    return response.data;
  },

  // For dropdowns (public API)
  async getAllPublic(language = 'pt') {
    const response = await api.get('/authors', { params: { language } });
    return response.data.authors;
  },
};

export default authorService;
