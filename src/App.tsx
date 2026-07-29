import React, { useState, useEffect } from 'react';
import { MonitoredUrl, StatusData, SiteStatus } from './types';
import { Navbar, ThemeMode } from './components/Navbar';
import { StatusBanner } from './components/StatusBanner';
import { MetricsOverview } from './components/MetricsOverview';
import { ServiceCard } from './components/ServiceCard';
import { ServiceTableView } from './components/ServiceTableView';
import { ServiceDetailsModal } from './components/ServiceDetailsModal';
import { GitHubActionsGuide } from './components/GitHubActionsGuide';
import { IncidentHistory } from './components/IncidentHistory';
import { Search, Filter, RefreshCw, LayoutGrid, List } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'incidents' | 'github'>('dashboard');
  const [statusData, setStatusData] = useState<StatusData | null>(null);
  const [config, setConfig] = useState<MonitoredUrl[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDetailsSite, setSelectedDetailsSite] = useState<SiteStatus | null>(null);

  // Theme Mode State ('system' | 'dark' | 'light'), default 'system'
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('statuswatch_theme');
    if (saved === 'dark' || saved === 'light' || saved === 'system') return saved;
    return 'system';
  });

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    localStorage.setItem('statuswatch_theme', mode);
  };

  // Sync theme mode to documentElement class 'dark'
  useEffect(() => {
    const applyTheme = () => {
      let isDark = false;
      if (themeMode === 'system') {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      } else {
        isDark = themeMode === 'dark';
      }

      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    applyTheme();

    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [themeMode]);

  // Auto-refresh countdown (60s ticker)
  const [countdown, setCountdown] = useState<number>(60);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(true);

  // Fetch status and config from static JSON or backend API
  const fetchData = async () => {
    try {
      let fetchedStatus = null;
      let fetchedConfig = null;

      // 1. Try static data files (works on GitHub Pages & static hosting)
      try {
        const staticStatusRes = await fetch('./data/status.json');
        if (staticStatusRes.ok) {
          const contentType = staticStatusRes.headers.get('content-type') || '';
          if (!contentType.includes('html')) {
            fetchedStatus = await staticStatusRes.json();
          }
        }
      } catch (e) {
        // ignore static fetch failure
      }

      try {
        const staticConfigRes = await fetch('./data/urls.json');
        if (staticConfigRes.ok) {
          const contentType = staticConfigRes.headers.get('content-type') || '';
          if (!contentType.includes('html')) {
            fetchedConfig = await staticConfigRes.json();
          }
        }
      } catch (e) {
        // ignore static fetch failure
      }

      // 2. Fallback to /api/ endpoints if running in Express local dev environment
      if (!fetchedStatus) {
        try {
          const apiStatusRes = await fetch('/api/status');
          if (apiStatusRes.ok) {
            const contentType = apiStatusRes.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
              fetchedStatus = await apiStatusRes.json();
            }
          }
        } catch (e) {
          // ignore API error
        }
      }

      if (!fetchedConfig) {
        try {
          const apiConfigRes = await fetch('/api/config');
          if (apiConfigRes.ok) {
            const contentType = apiConfigRes.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
              fetchedConfig = await apiConfigRes.json();
            }
          }
        } catch (e) {
          // ignore API error
        }
      }

      if (fetchedStatus) setStatusData(fetchedStatus);
      if (fetchedConfig) setConfig(fetchedConfig);
    } catch (err) {
      console.error('Failed to fetch status or config:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (!autoRefreshEnabled) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchData();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [autoRefreshEnabled]);

  // Refresh status data
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setCountdown(60);
    setIsRefreshing(false);
  };

  // Categories list
  const categories = ['All', ...Array.from(new Set((statusData?.sites || []).map(s => s.category)))];

  // Filtered sites list
  const filteredSites = (statusData?.sites || []).filter(site => {
    const matchesCategory = selectedCategory === 'All' || site.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      site.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      site.url.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A0B0D] text-slate-900 dark:text-slate-100 font-sans selection:bg-emerald-500 selection:text-white pb-16 transition-colors duration-200">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRefresh={handleManualRefresh}
        isRefreshing={isRefreshing}
        lastUpdated={statusData?.lastUpdated || null}
        countdown={countdown}
        autoRefreshEnabled={autoRefreshEnabled}
        setAutoRefreshEnabled={setAutoRefreshEnabled}
        themeMode={themeMode}
        setThemeMode={setThemeMode}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <RefreshCw className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-spin" />
            <p className="text-sm font-mono text-slate-500 dark:text-slate-400">Loading website health metrics...</p>
          </div>
        ) : (
          <>
            {/* TAB 1: DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <StatusBanner summary={statusData?.summary || null} siteCount={statusData?.sites?.length || 0} />
                <MetricsOverview summary={statusData?.summary || null} sites={statusData?.sites || []} />

                {/* Filter and Search Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0F1115] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search by name or URL..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#0A0B0D] border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono placeholder:text-slate-400"
                    />
                  </div>

                  <div className="flex items-center space-x-3 overflow-x-auto pb-1 sm:pb-0">
                    <div className="flex items-center space-x-1.5">
                      <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <div className="flex space-x-1">
                        {categories.map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-2.5 py-1 text-xs font-mono font-medium rounded-lg transition-colors whitespace-nowrap ${
                              selectedCategory === cat
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'bg-slate-100 dark:bg-[#0A0B0D] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* View Mode Toggle */}
                    <div className="flex items-center bg-slate-100 dark:bg-[#0A0B0D] border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 shrink-0">
                      <button
                        onClick={() => setViewMode('grid')}
                        title="Grid View"
                        className={`p-1.5 rounded text-xs font-mono flex items-center space-x-1 ${
                          viewMode === 'grid'
                            ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-bold shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setViewMode('table')}
                        title="High-Density Table View"
                        className={`p-1.5 rounded text-xs font-mono flex items-center space-x-1 ${
                          viewMode === 'table'
                            ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-bold shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        <List className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Service Cards / Table View */}
                {filteredSites.length === 0 ? (
                  <div className="bg-white dark:bg-[#0F1115] border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center text-slate-500 dark:text-slate-400 shadow-sm">
                    <p className="text-sm font-mono">No monitored endpoints match the active filter criteria.</p>
                  </div>
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredSites.map((site) => (
                      <ServiceCard
                        key={site.id}
                        site={site}
                        onSelectDetails={setSelectedDetailsSite}
                      />
                    ))}
                  </div>
                ) : (
                  <ServiceTableView
                    sites={filteredSites}
                    onSelectDetails={setSelectedDetailsSite}
                  />
                )}
              </div>
            )}

            {/* TAB 2: INCIDENTS */}
            {activeTab === 'incidents' && (
              <IncidentHistory incidents={statusData?.incidents || []} />
            )}

            {/* TAB 3: GITHUB SETUP GUIDE */}
            {activeTab === 'github' && (
              <GitHubActionsGuide />
            )}
          </>
        )}
      </main>

      {/* Details Modal */}
      <ServiceDetailsModal
        site={selectedDetailsSite}
        onClose={() => setSelectedDetailsSite(null)}
      />
    </div>
  );
}
