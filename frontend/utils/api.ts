import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      Cookies.remove('token');
      Cookies.remove('user');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (data: { email: string; password: string; userType: string }) =>
    api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/auth/change-password', data),
};

// Admin API
export const adminAPI = {
  // Teams
  createTeam: (data: any) => api.post('/admin/teams', data),
  getTeams: (params?: any) => api.get('/admin/teams', { params }),
  getTeamById: (id: string) => api.get(`/admin/teams/${id}`),
  updateTeam: (id: string, data: any) => api.put(`/admin/teams/${id}`, data),
  deleteTeam: (id: string) => api.delete(`/admin/teams/${id}`),
  
  // Members
  createTeamMember: (teamId: string, data: any) => 
    api.post(`/admin/teams/${teamId}/members`, data),
  getTeamMembers: (params?: any) => api.get('/admin/members', { params }),
  updateTeamMember: (id: string, data: any) => api.put(`/admin/members/${id}`, data),
  deleteTeamMember: (id: string) => api.delete(`/admin/members/${id}`),
  resetMemberPassword: (id: string) => api.post(`/admin/members/${id}/reset-password`),
};

// Document API
export const documentAPI = {
  // Team member endpoints
  uploadDocument: (data: FormData) => 
    api.post('/documents/upload', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  getMyDocuments: () => api.get('/documents/my-documents'),
  getTeamProgress: () => api.get('/documents/team-progress'),
  
  // Admin endpoints
  getAllDocuments: (params?: any) => api.get('/documents', { params }),
  getDocumentStats: () => api.get('/documents/stats'),
  approveDocument: (id: string, data?: { comment?: string }) => 
    api.put(`/documents/${id}/approve`, data),
  rejectDocument: (id: string, data: { comment: string }) => 
    api.put(`/documents/${id}/reject`, data),
};

// User API
export const userAPI = {
  getProfile: () => api.get('/user/me'),
  updateProfile: (data: { name: string }) => api.put('/user/me', data),
  getDashboardStats: () => api.get('/user/dashboard-stats'),
  getNotifications: (params?: any) => api.get('/user/notifications', { params }),
  markNotificationAsRead: (id: string) => api.put(`/user/notifications/${id}/read`),
  markAllNotificationsAsRead: () => api.put('/user/notifications/read-all'),
};

export default api;
