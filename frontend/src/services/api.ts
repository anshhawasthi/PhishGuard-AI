import axios from 'axios';
import { IScanResult, IDashboardStats, IModelPerformance, IUser } from '../types';

export const getApiBaseUrl = (): string => {
  const url = import.meta.env.VITE_API_URL as string | undefined;
  if (!url) return '';
  return url.replace(/\/api\/?$/, '');
};

const apiBase = (import.meta.env.VITE_API_URL as string | undefined) || '/api';

const api = axios.create({
  baseURL: apiBase,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getReportUrl = (scanId: string): string => {
  const base = getApiBaseUrl();
  return `${base}/api/scans/${scanId}/report`;
};

export const getLiveReportUrl = (url: string): string => {
  const base = getApiBaseUrl();
  return `${base}/api/scans/live/report?url=${encodeURIComponent(url)}`;
};

// Attach JWT token from localStorage if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('phishguard_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  register: (data: { full_name: string; email: string; password: string }) =>
    api.post<{ message: string; token: string; user: IUser }>('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post<{ message: string; token: string; user: IUser }>('/auth/login', data),
  getMe: () => api.get<{ user: IUser }>('/auth/me'),
};

export const scanApi = {
  analyze: (url: string) => api.post<IScanResult>('/scans/analyze', { url }),
  getScans: (params?: { page?: number; limit?: number; verdict?: string; search?: string }) =>
    api.get<{ scans: IScanResult[]; total: number; page: number; pages: number }>('/scans', { params }),
  getScanById: (id: string) => api.get<IScanResult>(`/scans/${id}`),
  deleteScan: (id: string) => api.delete<{ message: string }>(`/scans/${id}`),
  bulkScanUrls: (urls: string[]) =>
    api.post<{ total: number; safe_count: number; suspicious_count: number; phishing_count: number; results: IScanResult[] }>(
      '/scans/bulk',
      { urls }
    ),
  bulkScanFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/scans/bulk', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  downloadReportUrl: (scanId: string) => getReportUrl(scanId),
};

export const dashboardApi = {
  getStats: () => api.get<IDashboardStats>('/dashboard/stats'),
  getActivity: () => api.get<{ activity: any[] }>('/dashboard/activity'),
};

export const adminApi = {
  getStats: () => api.get<any>('/admin/stats'),
  getUsers: () => api.get<{ users: IUser[] }>('/admin/users'),
  toggleUser: (userId: string) => api.patch<{ message: string; user: IUser }>(`/admin/users/${userId}/toggle`),
  uploadDataset: (file: File, datasetName: string, datasetType: string) => {
    const formData = new FormData();
    formData.append('dataset', file);
    formData.append('dataset_name', datasetName);
    formData.append('dataset_type', datasetType);
    return api.post('/admin/datasets/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  trainModels: () => api.post<{ message: string; models: IModelPerformance[]; activeModel: string }>('/admin/models/train'),
  getModelPerformance: () => api.get<{ activeModel: string; models: IModelPerformance[] }>('/admin/models/performance'),
  activateModel: (model_name: string) => api.post('/admin/models/activate', { model_name }),
};

export default api;
