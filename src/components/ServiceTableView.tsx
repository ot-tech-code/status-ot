import React from 'react';
import { ExternalLink, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { SiteStatus } from '../types';

interface ServiceTableViewProps {
  sites: SiteStatus[];
  onSelectDetails: (site: SiteStatus) => void;
}

export const ServiceTableView: React.FC<ServiceTableViewProps> = ({
  sites,
  onSelectDetails
}) => {
  return (
    <div className="bg-white dark:bg-[#0F1115] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm dark:shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-[#0A0B0D] border-b border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-4">Service Name & Endpoint</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Latency</th>
              <th className="py-3 px-4">24h SLA Uptime</th>
              <th className="py-3 px-4">Last Check Bar</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-xs">
            {sites.map((site) => {
              const { id, name, url, category, current, uptime24h, avgResponseTimeMs, history } = site;
              const isUp = current.status === 'up';
              const isDegraded = current.status === 'degraded';
              const isDown = current.status === 'down';

              let statusBadge = (
                <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                  <span>200 Operational</span>
                </span>
              );

              if (isDegraded) {
                statusBadge = (
                  <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    <AlertTriangle className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                    <span>High Latency</span>
                  </span>
                );
              } else if (isDown) {
                statusBadge = (
                  <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    <XCircle className="w-3 h-3 text-rose-500 dark:text-rose-400" />
                    <span>{current.statusCode > 0 ? `HTTP ${current.statusCode}` : 'Unreachable'}</span>
                  </span>
                );
              }

              const recentHistory = history.slice(-20);

              return (
                <tr key={id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900 dark:text-white flex items-center space-x-2">
                      <span>{name}</span>
                    </div>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center space-x-1 mt-0.5 font-mono"
                    >
                      <span className="truncate max-w-xs">{url}</span>
                      <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-70" />
                    </a>
                  </td>

                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                      {category}
                    </span>
                  </td>

                  <td className="py-3 px-4">{statusBadge}</td>

                  <td className="py-3 px-4 font-mono">
                    <span className="text-slate-900 dark:text-white font-bold">{current.responseTimeMs} ms</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block">avg {avgResponseTimeMs}ms</span>
                  </td>

                  <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {uptime24h}%
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-1 h-4 w-32 bg-slate-100 dark:bg-[#0A0B0D] p-0.5 rounded border border-slate-200 dark:border-slate-800">
                      {recentHistory.map((item, idx) => {
                        let barBg = 'bg-emerald-500';
                        if (item.status === 'degraded') barBg = 'bg-amber-500';
                        if (item.status === 'down') barBg = 'bg-rose-500';
                        return (
                          <div
                            key={idx}
                            title={`${new Date(item.timestamp).toLocaleTimeString()}: ${item.responseTimeMs}ms (${item.status})`}
                            className={`flex-1 h-3 rounded-[1px] ${barBg}`}
                          />
                        );
                      })}
                    </div>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onSelectDetails(site)}
                      className="px-2.5 py-1 text-[11px] font-mono font-medium text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10 rounded border border-emerald-500/30 transition-colors"
                    >
                      Metrics
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
