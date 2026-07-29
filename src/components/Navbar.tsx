import React from 'react';
import { Activity, Settings, Github, RefreshCw, ShieldCheck, AlertTriangle } from 'lucide-react';

interface NavbarProps {
  activeTab: 'dashboard' | 'config' | 'github' | 'incidents';
  setActiveTab: (tab: 'dashboard' | 'config' | 'github' | 'incidents') => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  lastUpdated: string | null;
  countdown: number;
  autoRefreshEnabled: boolean;
  setAutoRefreshEnabled: (val: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onRefresh,
  isRefreshing,
  lastUpdated,
  countdown,
  autoRefreshEnabled,
  setAutoRefreshEnabled
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-white text-lg tracking-tight">StatusWatch</span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-800 text-slate-300 border border-slate-700">
                  GitHub Pages Ready
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Automated Uptime & Latency Monitoring</p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="flex space-x-1 sm:space-x-2 bg-slate-950/60 p-1 rounded-lg border border-slate-800">
            <button
              id="tab-dashboard"
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Status</span>
            </button>

            <button
              id="tab-config"
              onClick={() => setActiveTab('config')}
              className={`flex items-center space-x-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                activeTab === 'config'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>urls.json Config</span>
            </button>

            <button
              id="tab-incidents"
              onClick={() => setActiveTab('incidents')}
              className={`flex items-center space-x-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                activeTab === 'incidents'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span className="hidden sm:inline">Incidents</span>
            </button>

            <button
              id="tab-github"
              onClick={() => setActiveTab('github')}
              className={`flex items-center space-x-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                activeTab === 'github'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Github className="w-4 h-4" />
              <span>GitHub Setup</span>
            </button>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-3">
            <div className="hidden lg:flex flex-col items-end text-xs text-slate-400">
              <span className="flex items-center space-x-1.5">
                <span className={`w-2 h-2 rounded-full ${autoRefreshEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                <span>Auto-check {autoRefreshEnabled ? `in ${countdown}s` : 'Paused'}</span>
              </span>
              {lastUpdated && (
                <span className="text-[11px] text-slate-500">
                  Updated: {new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              )}
            </div>

            <button
              id="btn-manual-refresh"
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Trigger Immediate Health Check"
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
              <span className="hidden md:inline">Run Check</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
