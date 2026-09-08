import axios from 'axios';
import {
  User,
  Investigation,
  EvidenceFile,
  SecurityEvent,
  TimelineResponse,
  Anomaly,
  Incident,
  AttackGraphData,
  AISummary,
  DashboardMetrics,
  Report,
  MultiAgentSuiteResponse
} from '../types';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cybertrace_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// High-performance client-side response cache (SWR / Stale-While-Revalidate)
const responseCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 180 * 1000; // 3 minutes cache

export const clearAPICache = (prefix?: string) => {
  if (!prefix) {
    responseCache.clear();
    return;
  }
  for (const key of responseCache.keys()) {
    if (key.includes(prefix)) {
      responseCache.delete(key);
    }
  }
};

const cachedGet = async <T>(url: string, params?: Record<string, any>): Promise<T> => {
  const cacheKey = `${url}?${JSON.stringify(params || {})}`;
  const cached = responseCache.get(cacheKey);
  const now = Date.now();

  if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
    return cached.data as T;
  }

  const res = await api.get<T>(url, { params });
  responseCache.set(cacheKey, { data: res.data, timestamp: now });
  return res.data;
};

const cachedPost = async <T>(url: string, data?: any): Promise<T> => {
  const cacheKey = `POST:${url}?${JSON.stringify(data || {})}`;
  const cached = responseCache.get(cacheKey);
  const now = Date.now();

  if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
    return cached.data as T;
  }

  const res = await api.post<T>(url, data);
  responseCache.set(cacheKey, { data: res.data, timestamp: now });
  return res.data;
};

export const authAPI = {
  login: async (email: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    const res = await api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    return res.data;
  },
  register: async (name: string, email: string, password: string, role = 'INVESTIGATOR') => {
    const res = await api.post('/auth/register', { name, email, password, role });
    return res.data;
  },
  getMe: async () => {
    return cachedGet<User>('/auth/me');
  }
};

export const investigationsAPI = {
  list: async () => {
    return cachedGet<Investigation[]>('/investigations');
  },
  create: async (name: string, description?: string, severity = 'MEDIUM') => {
    const res = await api.post<Investigation>('/investigations', { name, description, severity });
    clearAPICache('/investigations');
    return res.data;
  },
  get: async (id: string) => {
    return cachedGet<Investigation>(`/investigations/${id}`);
  },
  delete: async (id: string) => {
    await api.delete(`/investigations/${id}`);
    clearAPICache('/investigations');
  }
};

export const evidenceAPI = {
  upload: async (investigationId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post<EvidenceFile>(`/investigations/${investigationId}/evidence`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    clearAPICache(investigationId);
    return res.data;
  },
  list: async (investigationId: string) => {
    return cachedGet<EvidenceFile[]>(`/investigations/${investigationId}/evidence`);
  },
  delete: async (fileId: string) => {
    await api.delete(`/evidence/${fileId}`);
    clearAPICache();
  }
};

export const timelineAPI = {
  analyze: async (investigationId: string) => {
    const res = await api.post(`/investigations/${investigationId}/analyze`);
    clearAPICache(investigationId);
    return res.data;
  },
  getTimeline: async (investigationId: string, params: Record<string, any>) => {
    return cachedGet<TimelineResponse>(`/investigations/${investigationId}/timeline`, params);
  }
};

export const eventsAPI = {
  getDetail: async (eventId: string) => {
    return cachedGet<SecurityEvent>(`/events/${eventId}`);
  },
  ingest: async (investigationId: string, events: any[]) => {
    const res = await api.post(`/investigations/${investigationId}/events/ingest`, { events });
    clearAPICache(investigationId);
    return res.data;
  }
};

export const anomaliesAPI = {
  list: async (investigationId: string) => {
    return cachedGet<Anomaly[]>(`/investigations/${investigationId}/anomalies`);
  }
};

export const incidentsAPI = {
  list: async (investigationId: string) => {
    return cachedGet<Incident[]>(`/investigations/${investigationId}/incidents`);
  },
  getAttackGraph: async (investigationId: string) => {
    return cachedGet<AttackGraphData>(`/investigations/${investigationId}/attack-graph`);
  },
  getReplayStream: async (investigationId: string) => {
    return cachedGet<SecurityEvent[]>(`/investigations/${investigationId}/replay`);
  },
  getImpactAnalysis: async (investigationId: string) => {
    return cachedGet<{
      investigation_id: string;
      overall_risk_score: number;
      high_risk_events_count: number;
      affected_users: string[];
      affected_hosts: string[];
      affected_databases: string[];
      affected_files: string[];
      estimated_impact_level: string;
    }>(`/investigations/${investigationId}/impact`);
  }
};

export const aiAPI = {
  query: async (investigationId: string, query: string) => {
    const res = await api.post<{ query: string; answer: string; referenced_event_ids: string[]; provider_used: string }>('/ai/investigate', {
      investigation_id: investigationId,
      query
    });
    return res.data;
  },
  getSummary: async (investigationId: string) => {
    return cachedPost<AISummary>(`/ai/summary/${investigationId}`);
  }
};

export const reportsAPI = {
  generate: async (investigationId: string) => {
    const res = await api.post<Report>(`/investigations/${investigationId}/reports`);
    clearAPICache(investigationId);
    return res.data;
  },
  list: async (investigationId: string) => {
    return cachedGet<Report[]>(`/investigations/${investigationId}/reports`);
  },
  downloadBlob: async (reportId: string) => {
    const res = await api.get(`/reports/${reportId}/download`, {
      responseType: 'blob'
    });
    return res.data as Blob;
  },
  getDownloadUrl: (reportId: string) => `/api/reports/${reportId}/download`
};

export const dashboardAPI = {
  getMetrics: async (investigationId: string) => {
    return cachedGet<DashboardMetrics>(`/investigations/${investigationId}/dashboard`);
  }
};

export const auditAPI = {
  list: async () => {
    return cachedGet<Array<{ id: string; user_id?: string; action: string; resource_type?: string; resource_id?: string; timestamp: string }>>('/audit-logs');
  }
};

export const multiAgentAPI = {
  runAll: async (investigationId?: string): Promise<MultiAgentSuiteResponse> => {
    if (investigationId) {
      return cachedPost<MultiAgentSuiteResponse>(`/ai/agents/run-all/${investigationId}`);
    }
    return cachedPost<MultiAgentSuiteResponse>('/ai/agents/run-all');
  }
};

export default api;
