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
    const res = await api.get<User>('/auth/me');
    return res.data;
  }
};

export const investigationsAPI = {
  list: async () => {
    const res = await api.get<Investigation[]>('/investigations');
    return res.data;
  },
  create: async (name: string, description?: string, severity = 'MEDIUM') => {
    const res = await api.post<Investigation>('/investigations', { name, description, severity });
    return res.data;
  },
  get: async (id: string) => {
    const res = await api.get<Investigation>(`/investigations/${id}`);
    return res.data;
  },
  delete: async (id: string) => {
    await api.delete(`/investigations/${id}`);
  }
};

export const evidenceAPI = {
  upload: async (investigationId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post<EvidenceFile>(`/investigations/${investigationId}/evidence`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  list: async (investigationId: string) => {
    const res = await api.get<EvidenceFile[]>(`/investigations/${investigationId}/evidence`);
    return res.data;
  },
  delete: async (fileId: string) => {
    await api.delete(`/evidence/${fileId}`);
  }
};

export const timelineAPI = {
  analyze: async (investigationId: string) => {
    const res = await api.post(`/investigations/${investigationId}/analyze`);
    return res.data;
  },
  getTimeline: async (investigationId: string, params: Record<string, any>) => {
    const res = await api.get<TimelineResponse>(`/investigations/${investigationId}/timeline`, { params });
    return res.data;
  }
};

export const eventsAPI = {
  getDetail: async (eventId: string) => {
    const res = await api.get<SecurityEvent>(`/events/${eventId}`);
    return res.data;
  },
  ingest: async (investigationId: string, events: any[]) => {
    const res = await api.post(`/investigations/${investigationId}/events/ingest`, { events });
    return res.data;
  }
};

export const anomaliesAPI = {
  list: async (investigationId: string) => {
    const res = await api.get<Anomaly[]>(`/investigations/${investigationId}/anomalies`);
    return res.data;
  }
};

export const incidentsAPI = {
  list: async (investigationId: string) => {
    const res = await api.get<Incident[]>(`/investigations/${investigationId}/incidents`);
    return res.data;
  },
  getAttackGraph: async (investigationId: string) => {
    const res = await api.get<AttackGraphData>(`/investigations/${investigationId}/attack-graph`);
    return res.data;
  },
  getReplayStream: async (investigationId: string) => {
    const res = await api.get<SecurityEvent[]>(`/investigations/${investigationId}/replay`);
    return res.data;
  },
  getImpactAnalysis: async (investigationId: string) => {
    const res = await api.get<{
      investigation_id: string;
      overall_risk_score: number;
      high_risk_events_count: number;
      affected_users: string[];
      affected_hosts: string[];
      affected_databases: string[];
      affected_files: string[];
      estimated_impact_level: string;
    }>(`/investigations/${investigationId}/impact`);
    return res.data;
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
    const res = await api.post<AISummary>(`/ai/summary/${investigationId}`);
    return res.data;
  }
};

export const reportsAPI = {
  generate: async (investigationId: string) => {
    const res = await api.post<Report>(`/investigations/${investigationId}/reports`);
    return res.data;
  },
  list: async (investigationId: string) => {
    const res = await api.get<Report[]>(`/investigations/${investigationId}/reports`);
    return res.data;
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
    const res = await api.get<DashboardMetrics>(`/investigations/${investigationId}/dashboard`);
    return res.data;
  }
};

export const auditAPI = {
  list: async () => {
    const res = await api.get<Array<{ id: string; user_id?: string; action: string; resource_type?: string; resource_id?: string; timestamp: string }>>('/audit-logs');
    return res.data;
  }
};

export const multiAgentAPI = {
  runAll: async (investigationId?: string): Promise<MultiAgentSuiteResponse> => {
    if (investigationId) {
      const res = await api.post<MultiAgentSuiteResponse>(`/ai/agents/run-all/${investigationId}`);
      return res.data;
    }
    const res = await api.post<MultiAgentSuiteResponse>('/ai/agents/run-all');
    return res.data;
  }
};

export default api;
