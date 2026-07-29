import React from 'react';
import { Activity, Github, RefreshCw, AlertTriangle, Sun, Moon, Monitor } from 'lucide-react';

export type ThemeMode = 'system' | 'dark' | 'light';

interface NavbarProps {
  activeTab: 'dashboard' | 'incidents' | 'github';
  setActiveTab: (tab: 'dashboard' | 'incidents' | 'github') => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  lastUpdated: string | null;
  countdown: number;
  autoRefreshEnabled: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onRefresh,
  isRefreshing,
  lastUpdated,
  countdown,
  themeMode,
  setThemeMode
}) => {
  return (
    <header className="bg-white dark:bg-[#0F1115] border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-900 dark:text-white text-lg tracking-tight">StatusWatch</span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  GitHub Pages Ready
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">Automated Uptime & Latency Monitoring</p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="flex space-x-1 sm:space-x-2 bg-slate-100 dark:bg-slate-950/60 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
            <button
              id="tab-dashboard"
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Status</span>
            </button>

            <button
              id="tab-incidents"
              onClick={() => setActiveTab('incidents')}
              className={`flex items-center space-x-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                activeTab === 'incidents'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
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
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Github className="w-4 h-4" />
              <span>GitHub Setup</span>
            </button>
          </nav>

          {/* Right Controls: Theme Selector & Reload */}
          <div className="flex items-center space-x-3">
            {/* Theme Selector Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5">
              <button
                id="theme-light-btn"
                onClick={() => setThemeMode('light')}
                title="Light Mode"
                className={`p-1.5 rounded transition-colors ${
                  themeMode === 'light'
                    ? 'bg-white text-amber-500 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                id="theme-dark-btn"
                onClick={() => setThemeMode('dark')}
                title="Dark Mode"
                className={`p-1.5 rounded transition-colors ${
                  themeMode === 'dark'
                    ? 'bg-slate-800 text-emerald-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
              <button
                id="theme-system-btn"
                onClick={() => setThemeMode('system')}
                title="Match System Setting"
                className={`p-1.5 rounded transition-colors ${
                  themeMode === 'system'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="hidden lg:flex flex-col items-end text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Auto-refresh ({countdown}s)</span>
              </span>
              {lastUpdated && (
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  Updated: {new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>

            <button
              id="btn-manual-refresh"
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Reload Status Data"
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-500' : ''}`} />
              <span className="hidden md:inline">Reload Data</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
