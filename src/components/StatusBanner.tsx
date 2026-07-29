import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Clock, Server } from 'lucide-react';
import { StatusSummary } from '../types';

interface StatusBannerProps {
  summary: StatusSummary | null;
  siteCount: number;
}

export const StatusBanner: React.FC<StatusBannerProps> = ({ summary, siteCount }) => {
  if (!summary) return null;

  const { overallStatus, upCount, downCount, degradedCount, lastUpdated, avgLatencyMs } = summary;

  let bgClass = 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200';
  let icon = <CheckCircle2 className="w-7 h-7 text-emerald-400" />;
  let title = 'All Monitored Services Operational';
  let subtitle = 'All target endpoints responded with expected status codes within optimal response times.';

  if (overallStatus === 'outage') {
    bgClass = 'bg-rose-950/40 border-rose-500/30 text-rose-200';
    icon = <XCircle className="w-7 h-7 text-rose-400" />;
    title = 'Major Service Outage Detected';
    subtitle = `${downCount} out of ${siteCount} monitored services are currently unreachable or returning HTTP errors.`;
  } else if (overallStatus === 'degraded') {
    bgClass = 'bg-amber-950/40 border-amber-500/30 text-amber-200';
    icon = <AlertTriangle className="w-7 h-7 text-amber-400" />;
    title = 'Partial Degradation / Slow Responses';
    subtitle = `${downCount > 0 ? `${downCount} site(s) unreachable` : `${degradedCount} site(s) experiencing high latency`}.`;
  }

  return (
    <div className={`rounded-xl border p-5 sm:p-6 shadow-lg backdrop-blur-sm transition-all ${bgClass}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-4">
          <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 shrink-0">
            {icon}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">{title}</h1>
            <p className="text-sm mt-1 text-slate-300 max-w-2xl">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-xs font-mono bg-slate-900/80 px-4 py-2.5 rounded-lg border border-slate-800/80 text-slate-300 shrink-0">
          <div className="flex items-center space-x-2 border-r border-slate-800 pr-3">
            <Server className="w-4 h-4 text-slate-400" />
            <span>{upCount}/{siteCount} Online</span>
          </div>
          <div className="flex items-center space-x-1.5 border-r border-slate-800 pr-3">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{avgLatencyMs} ms avg</span>
          </div>
          <div className="text-slate-400">
            <span>{lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
