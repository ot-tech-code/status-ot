import React from 'react';
import { X, ExternalLink, Activity } from 'lucide-react';
import { SiteStatus } from '../types';
import { LatencyChart } from './LatencyChart';

interface ServiceDetailsModalProps {
  site: SiteStatus | null;
  onClose: () => void;
}

export const ServiceDetailsModal: React.FC<ServiceDetailsModalProps> = ({ site, onClose }) => {
  if (!site) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0F1115] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{site.name}</h2>
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono">
                {site.category}
              </span>
            </div>
            <a
              href={site.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-1 mt-1 font-mono"
            >
              <span>{site.url}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 font-mono">
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 block">Expected Status</span>
              <span className="text-lg font-bold text-slate-900 dark:text-white">HTTP {site.expectedStatus || 200}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 block">Average Latency</span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{site.avgResponseTimeMs} ms</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 block">24h Uptime</span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{site.uptime24h}%</span>
            </div>
          </div>

          {/* Detailed Latency Chart */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center space-x-2">
              <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Response Time History</span>
            </h3>
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <LatencyChart history={site.history} height={80} />
            </div>
          </div>

          {/* Recent Checks Table */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Recent Check Logs</h3>
            <div className="bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Response Time</th>
                    <th className="p-3">HTTP Code</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                  {site.history.slice(-10).reverse().map((log, i) => (
                    <tr key={i} className="hover:bg-slate-100/60 dark:hover:bg-slate-900/40">
                      <td className="p-3 text-slate-500 dark:text-slate-400">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.status === 'up' 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                            : log.status === 'degraded' 
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' 
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        }`}>
                          {log.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3">{log.responseTimeMs} ms</td>
                      <td className="p-3">{log.statusCode > 0 ? log.statusCode : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
