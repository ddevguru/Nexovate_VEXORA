export type UserRole = 'ADMIN' | 'INVESTIGATOR' | 'VIEWER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface Investigation {
  id: string;
  name: string;
  description?: string;
  status: 'ACTIVE' | 'CLOSED' | 'IN_PROGRESS' | 'COMPLETED';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  created_by?: string;
  created_at: string;
  updated_at: string;
  event_count: number;
  evidence_count: number;
  risk_score: number;
}

export interface EvidenceFile {
  id: string;
  investigation_id: string;
  filename: string;
  file_type: string;
  file_size: number;
  sha256_hash: string;
  uploaded_at: string;
  processing_status: 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  event_count: number;
}

export interface SecurityEvent {
  id: string;
  investigation_id: string;
  evidence_file_id?: string;
  timestamp: string;
  event_type: string;
  user?: string;
  source_ip?: string;
  destination_ip?: string;
  action: string;
  resource?: string;
  resource_type?: string;
  hostname?: string;
  status: 'SUCCESS' | 'FAILURE' | 'UNKNOWN';
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  risk_score: number;
  raw_log?: string;
  normalized_data?: Record<string, any>;
  significance_reasons?: string[];
  is_anomaly?: boolean;
}

export interface TimelineResponse {
  total_events: number;
  page: number;
  page_size: number;
  total_pages: number;
  events: SecurityEvent[];
}

export interface Anomaly {
  id: string;
  investigation_id: string;
  event_id: string;
  anomaly_score: number;
  risk_level: 'NORMAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reason: string;
  detector: string;
  created_at: string;
  event?: SecurityEvent;
}

export interface AttackStage {
  stage: string;
  title: string;
  confidence: number;
  evidence_ids: string[];
  description: string;
}

export interface Incident {
  id: string;
  investigation_id: string;
  title: string;
  description?: string;
  severity: string;
  confidence: number;
  start_time?: string;
  end_time?: string;
  status: string;
  created_at: string;
  attack_stages?: AttackStage[];
}

export interface AttackNode {
  id: string;
  node_type: string;
  label: string;
  node_metadata?: Record<string, any>;
  details?: any;
}

export interface AttackEdge {
  id: string;
  source_node_id: string;
  target_node_id: string;
  relationship: string;
  confidence: number;
}

export interface AttackGraphData {
  nodes: AttackNode[];
  edges: AttackEdge[];
  attack_path_node_ids: string[];
}

export interface AISummary {
  investigation_id: string;
  incident_title: string;
  executive_summary: string;
  timeline_summary: string;
  affected_users: string[];
  affected_resources: string[];
  suspicious_ips: string[];
  attack_stages: AttackStage[];
  risk_score: number;
  confidence: number;
  observed_facts: string[];
  ai_interpretation: string[];
  recommended_steps?: string[];
  provider_used?: string;
  root_cause_analysis?: string;
  key_findings?: string[];
  recommended_remediations?: string[];
}

export interface DashboardMetrics {
  investigation_id: string;
  investigation_name: string;
  total_events: number;
  significant_events_count: number;
  anomalies_count: number;
  critical_findings_count: number;
  unique_users_count: number;
  unique_ips_count: number;
  unique_resources_count: number;
  overall_risk_score: number;
  confidence_score: number;
  severity_distribution: Record<string, number>;
  event_category_distribution: Record<string, number>;
  events_over_time: Array<{ hour: string; events: number; anomalies: number; max_risk: number }>;
  top_suspicious_users: Array<{ user: string; score: number }>;
  top_suspicious_ips: Array<{ ip: string; score: number }>;
  recent_significant_events: SecurityEvent[];
  attack_chain_summary: AttackStage[];
}

export interface Report {
  id: string;
  investigation_id: string;
  report_type: string;
  file_path: string;
  generated_at: string;
}

// --- MULTI-AGENT CYBERFORENSIC SUITE ---
export interface AgentTraceStep {
  step_number: number;
  thought: string;
  action: string;
  tool_used?: string;
  observation: string;
  confidence: number;
  latency_ms: number;
  verdict?: string;
}

export interface AgentResult {
  agent_id: string;
  name: string;
  role: string;
  avatar_icon: string;
  status: string;
  threat_detected: boolean;
  threat_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  confidence_score: number;
  latency_ms: number;
  logs_examined_count: number;
  logs_analyzed_count: number;
  findings: string[];
  traces: AgentTraceStep[];
  speech_text: string;
  model_provider?: string;
}

export interface MultiAgentSuiteResponse {
  timestamp: string;
  total_events_analyzed: number;
  execution_time_ms: number;
  langfuse_trace_id: string;
  provider_used: string;
  tokens_processed?: number;
  ml_confidence_score?: number;
  agents: AgentResult[];
}
