export interface MonitoredUrl {
  id: string;
  name: string;
  url: string;
  method?: 'GET' | 'HEAD' | 'POST';
  expectedStatus?: number;
  timeout?: number;
  category: string;
  enabled: boolean;
  description?: string;
}

export interface CheckHistoryItem {
  timestamp: string;
  statusCode: number;
  responseTimeMs: number;
  status: 'up' | 'down' | 'degraded';
  error?: string | null;
}

export interface SiteStatus {
  id: string;
  name: string;
  url: string;
  category: string;
  enabled: boolean;
  expectedStatus: number;
  current: CheckHistoryItem;
  uptime24h: number;
  uptime7d: number;
  uptime30d: number;
  avgResponseTimeMs: number;
  history: CheckHistoryItem[];
}

export interface StatusSummary {
  lastUpdated: string;
  overallStatus: 'operational' | 'degraded' | 'outage';
  total: number;
  upCount: number;
  downCount: number;
  degradedCount: number;
  avgLatencyMs: number;
}

export interface StatusData {
  lastUpdated: string;
  summary: StatusSummary;
  sites: SiteStatus[];
  incidents: Incident[];
}

export interface Incident {
  id: string;
  siteId: string;
  siteName: string;
  url: string;
  startTime: string;
  endTime?: string | null;
  durationMs?: number | null;
  statusCode?: number | null;
  error?: string | null;
  status: 'active' | 'resolved';
}
