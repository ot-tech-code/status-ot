import React from 'react';
import { Globe, CheckCircle, AlertTriangle, Zap, Percent } from 'lucide-react';
import { StatusSummary, SiteStatus } from '../types';

interface MetricsOverviewProps {
  summary: StatusSummary | null;
  sites: SiteStatus[];
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({ summary, sites }) => {
  if (!summary) return null;

  const totalSites = sites.length;
  const avgUptime = totalSites > 0
    ? (sites.reduce((acc, site) => acc + site.uptime24h, 0) / totalSites).toFixed(2)
    : '100.00';

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Total Monitored */}
      <div id="metric-monitored" className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
          <span>Monitored URLs</span>
          <Globe className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="mt-2">
          <span className="text-2xl font-bold text-white font-mono">{totalSites}</span>
          <span className="text-xs text-slate-400 ml-2">Endpoints</span>
        </div>
        <div className="mt-2 text-[11px] text-slate-500 font-mono">
          Configured in config/urls.json
        </div>
      </div>

      {/* 24h Overall Uptime */}
      <div id="metric-uptime" className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
          <span>24h Average Uptime</span>
          <Percent className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="mt-2">
          <span className="text-2xl font-bold text-white font-mono">{avgUptime}%</span>
        </div>
        <div className="mt-2 text-[11px] text-emerald-400 flex items-center space-x-1">
          <CheckCircle className="w-3 h-3" />
          <span>SLA Target: 99.9%</span>
        </div>
      </div>

      {/* Average Response Time */}
      <div id="metric-latency" className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
          <span>Global Avg Latency</span>
          <Zap className="w-4 h-4 text-blue-400" />
        </div>
        <div className="mt-2">
          <span className="text-2xl font-bold text-white font-mono">{summary.avgLatencyMs}</span>
          <span className="text-xs text-slate-400 ml-1">ms</span>
        </div>
        <div className="mt-2 text-[11px] text-slate-400">
          Fast response baseline
        </div>
      </div>

      {/* Status Breakdown */}
      <div id="metric-breakdown" className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
          <span>Health Breakdown</span>
          <AlertTriangle className="w-4 h-4 text-amber-400" />
        </div>
        <div className="mt-2 flex items-center space-x-3 text-xs font-mono">
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-white font-bold">{summary.upCount}</span>
            <span className="text-slate-400">Up</span>
          </div>
          {summary.degradedCount > 0 && (
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-amber-300 font-bold">{summary.degradedCount}</span>
              <span className="text-slate-400">Deg</span>
            </div>
          )}
          {summary.downCount > 0 && (
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="text-rose-400 font-bold">{summary.downCount}</span>
              <span className="text-slate-400">Down</span>
            </div>
          )}
        </div>
        <div className="mt-2 text-[11px] text-slate-500">
          Updated every 60s via GitHub Actions
        </div>
      </div>
    </div>
  );
};
