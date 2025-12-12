import api from './api';

const devotionalService = {
  // Get all devotionals
  async getAll(params = {}) {
    const response = await api.get('/admin/devotionals', { params });
    return response.data;
  },

  // Get devotional by ID
  async getById(id) {
    const response = await api.get(`/admin/devotionals/${id}`);
    return response.data.devotional;
  },

  // Create devotional
  async create(data) {
    const response = await api.post('/admin/devotionals', data);
    return response.data.devotional;
  },

  // Update devotional
  async update(id, data) {
    const response = await api.put(`/admin/devotionals/${id}`, data);
    return response.data.devotional;
  },

  // Delete devotional
  async delete(id) {
    const response = await api.delete(`/admin/devotionals/${id}`);
    return response.data;
  },

  // Publish/unpublish devotional
  async togglePublish(id, isPublished) {
    const response = await api.patch(`/admin/devotionals/${id}/publish`, {
      is_published: isPublished,
    });
    return response.data.devotional;
  },
};

export default devotionalService;
