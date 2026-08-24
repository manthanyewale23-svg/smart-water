import { api } from './client';

export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (data: any) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
};

export const dashboardApi = {
  get: () => api.get('/dashboard'),
};

export const zonesApi = {
  list: () => api.get('/zones'),
  get: (id: string) => api.get(`/zones/${id}`),
};

export const consumptionApi = {
  list: (params?: any) => api.get('/consumption', { params }),
};

export const waterLossApi = {
  list: (params?: any) => api.get('/water-loss', { params }),
};

export const sensorsApi = {
  list: () => api.get('/sensors'),
  get: (id: string) => api.get(`/sensors/${id}`),
  readings: (id: string) => api.get(`/sensors/${id}/readings`),
  demoUpdate: () => api.post('/sensors/demo-update'),
};

export const mapApi = {
  assets: () => api.get('/map/assets'),
};

export const complaintsApi = {
  list: (params?: any) => api.get('/complaints', { params }),
  get: (id: string) => api.get(`/complaints/${id}`),
  create: (data: FormData) => api.post('/complaints', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: string, data: any) => api.patch(`/complaints/${id}`, data),
};

export const maintenanceApi = {
  list: (params?: any) => api.get('/maintenance', { params }),
  get: (id: string) => api.get(`/maintenance/${id}`),
  create: (data: any) => api.post('/maintenance', data),
  update: (id: string, data: FormData | any) => {
    if (data instanceof FormData) {
      return api.patch(`/maintenance/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
    }
    return api.patch(`/maintenance/${id}`, data);
  },
};

export const alertsApi = {
  list: (params?: any) => api.get('/alerts', { params }),
  update: (id: string, data: any) => api.patch(`/alerts/${id}`, data),
};

export const notificationsApi = {
  list: () => api.get('/notifications'),
  count: () => api.get('/notifications/count'),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

export const reportsApi = {
  get: (params: any) => api.get('/reports', { params }),
};

export const usersApi = {
  list: (params?: any) => api.get('/users', { params }),
  get: (id: string) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: string, data: any) => api.patch(`/users/${id}`, data),
};
