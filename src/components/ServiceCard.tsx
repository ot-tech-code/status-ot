import React, { useState } from 'react';
import { ExternalLink, Clock, ShieldCheck, AlertOctagon, Check, Info } from 'lucide-react';
import { SiteStatus, CheckHistoryItem } from '../types';
import { LatencyChart } from './LatencyChart';

interface ServiceCardProps {
  site: SiteStatus;
  onSelectDetails: (site: SiteStatus) => void;
  onQuickCheck: (siteId: string) => void;
  isChecking: boolean;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  site,
  onSelectDetails,
  onQuickCheck,
  isChecking
}) => {
  const [hoveredCheck, setHoveredCheck] = useState<CheckHistoryItem | null>(null);

  const { name, url, category, current, uptime24h, avgResponseTimeMs, history } = site;
  const isUp = current.status === 'up';
  const isDegraded = current.status === 'degraded';
  const isDown = current.status === 'down';

  let statusBadge = (
    <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
      <span>{current.statusCode > 0 ? `${current.statusCode} Operational` : 'Operational'}</span>
    </span>
  );

  if (isDegraded) {
    statusBadge = (
      <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
        <span className="w-2 h-2 rounded-full bg-amber-400" />
        <span>{current.statusCode > 0 ? `${current.statusCode} Degraded` : 'High Latency'}</span>
      </span>
    );
  } else if (isDown) {
    statusBadge = (
      <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
        <span>{current.statusCode > 0 ? `HTTP ${current.statusCode}` : 'Unreachable'}</span>
      </span>
    );
  }

  // Generate 40 history visual pills
  const displayHistory = history.length > 0 ? history.slice(-40) : [];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all shadow-md group">
      {/* Top Card Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-semibold text-white group-hover:text-emerald-300 transition-colors">
              {name}
            </h3>
            <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-slate-800 text-slate-400 border border-slate-700/60">
              {category}
            </span>
          </div>

          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center space-x-1 mt-1 truncate max-w-sm"
          >
            <span className="truncate">{url}</span>
            <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
          </a>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {statusBadge}
        </div>
      </div>

      {/* Middle Latency & Uptime Stats */}
      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-800/80">
        <div>
          <span className="text-slate-400 text-xs font-medium block">Current Latency</span>
          <div className="flex items-baseline space-x-1.5 mt-0.5">
            <span className="text-lg font-bold text-white font-mono">{current.responseTimeMs} ms</span>
            <span className="text-[11px] text-slate-500">avg {avgResponseTimeMs}ms</span>
          </div>
        </div>

        <div>
          <span className="text-slate-400 text-xs font-medium block">24-Hour Uptime</span>
          <div className="flex items-baseline space-x-1 mt-0.5">
            <span className="text-lg font-bold text-emerald-400 font-mono">{uptime24h}%</span>
          </div>
        </div>
      </div>

      {/* Mini Latency Sparkline */}
      <div className="mt-3">
        <div className="flex justify-between items-center text-[11px] text-slate-500 mb-1">
          <span>Latency Trend</span>
          <span>Last 40 checks</span>
        </div>
        <LatencyChart history={history} height={32} />
      </div>

      {/* 40-Check Historical Timeline Bar */}
      <div className="mt-4 pt-3 border-t border-slate-800/60">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span className="font-mono text-[11px]">Uptime History (Past checks)</span>
          <span className="text-[11px] font-mono text-emerald-400 font-semibold">{uptime24h}%</span>
        </div>

        {/* Pill Bars */}
        <div className="flex items-center space-x-1 h-7 bg-slate-950/60 p-1.5 rounded-lg border border-slate-800/80">
          {displayHistory.map((item, idx) => {
            let barBg = 'bg-emerald-500 hover:bg-emerald-400';
            if (item.status === 'degraded') barBg = 'bg-amber-500 hover:bg-amber-400';
            if (item.status === 'down') barBg = 'bg-rose-500 hover:bg-rose-400';

            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredCheck(item)}
                onMouseLeave={() => setHoveredCheck(null)}
                className={`flex-1 h-4 rounded-sm transition-all cursor-pointer ${barBg}`}
              />
            );
          })}
        </div>

        {/* Hovered check details preview */}
        <div className="h-5 mt-1.5 text-[11px] font-mono flex items-center justify-between text-slate-400">
          {hoveredCheck ? (
            <>
              <span className="text-slate-300">
                {new Date(hoveredCheck.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="text-white font-semibold">{hoveredCheck.responseTimeMs}ms</span>
              <span className={hoveredCheck.status === 'up' ? 'text-emerald-400' : 'text-rose-400'}>
                {hoveredCheck.statusCode > 0 ? `HTTP ${hoveredCheck.statusCode}` : 'Error'}
              </span>
            </>
          ) : (
            <span className="text-slate-500 text-[10px]">Hover over bars to inspect check logs</span>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
        <button
          onClick={() => onSelectDetails(site)}
          className="text-xs font-medium text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
        >
          <Info className="w-3.5 h-3.5" />
          <span>View Detailed Metrics</span>
        </button>

        <button
          onClick={() => onQuickCheck(site.id)}
          disabled={isChecking}
          className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-mono transition-colors disabled:opacity-50"
        >
          {isChecking ? 'Checking...' : 'Check Now'}
        </button>
      </div>
    </div>
  );
};
