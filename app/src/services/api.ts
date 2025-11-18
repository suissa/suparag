import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Documents (usando rota RAG unificada)
export const documentsAPI = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/rag/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  list: () => api.get('/rag/documents'),
  get: (id: string) => api.get(`/rag/documents/${id}`),
  delete: (id: string) => api.delete(`/rag/documents/${id}`),
};

// Settings
export const settingsAPI = {
  list: () => api.get('/settings'),
  get: (key: string) => api.get(`/settings/${key}`),
  update: (key: string, value: string) => api.post('/settings', { key, value }),
  delete: (key: string) => api.delete(`/settings/${key}`),
};

// Chunks
export const chunksAPI = {
  list: (documentId?: string) => 
    api.get('/chunks', { params: { document_id: documentId } }),
  get: (id: string) => api.get(`/chunks/${id}`),
  create: (data: any) => api.post('/chunks', data),
  delete: (id: string) => api.delete(`/chunks/${id}`),
};

// Graph
export const graphAPI = {
  list: (params?: any) => api.get('/graph', { params }),
  get: (id: string) => api.get(`/graph/${id}`),
  create: (data: any) => api.post('/graph', data),
  delete: (id: string) => api.delete(`/graph/${id}`),
  neighbors: (nodeId: string, direction?: string) => 
    api.get(`/graph/neighbors/${nodeId}`, { params: { direction } }),
  path: (fromNode: string, toNode: string, maxDepth?: number) =>
    api.get(`/graph/path/${fromNode}/${toNode}`, { params: { maxDepth } }),
  subgraph: (nodeId: string, maxDepth?: number) =>
    api.get(`/graph/subgraph/${nodeId}`, { params: { maxDepth } }),
  degree: (nodeId: string) => api.get(`/graph/degree/${nodeId}`),
};

// Chat
export const chatAPI = {
  sendMessage: (message: string, conversationId?: string) =>
    api.post('/chat', { message, conversationId }),
};

// Evaluations
export const evaluationsAPI = {
  list: (params?: any) => api.get('/evaluations', { params }),
  get: (id: string) => api.get(`/evaluations/${id}`),
  create: (data: any) => api.post('/evaluations', data),
  getStats: () => api.get('/evaluations/stats/overview'),
};

// Semantic Flags
export const semanticFlagsAPI = {
  list: (params?: any) => api.get('/semantic-flags', { params }),
  get: (id: string) => api.get(`/semantic-flags/${id}`),
  updateStatus: (id: string, data: any) => api.patch(`/semantic-flags/${id}/status`, data),
  getStats: () => api.get('/semantic-flags/stats/overview'),
};

export default api;
