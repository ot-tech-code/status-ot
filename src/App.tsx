import React, { useState, useEffect } from 'react';
import { MonitoredUrl, StatusData, SiteStatus } from './types';
import { Navbar } from './components/Navbar';
import { StatusBanner } from './components/StatusBanner';
import { MetricsOverview } from './components/MetricsOverview';
import { ServiceCard } from './components/ServiceCard';
import { ServiceDetailsModal } from './components/ServiceDetailsModal';
import { ConfigEditor } from './components/ConfigEditor';
import { GitHubActionsGuide } from './components/GitHubActionsGuide';
import { IncidentHistory } from './components/IncidentHistory';
import { Search, Filter, RefreshCw, RotateCcw, AlertTriangle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'config' | 'github' | 'incidents'>('dashboard');
  const [statusData, setStatusData] = useState<StatusData | null>(null);
  const [config, setConfig] = useState<MonitoredUrl[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDetailsSite, setSelectedDetailsSite] = useState<SiteStatus | null>(null);
  const [checkingSiteId, setCheckingSiteId] = useState<string | null>(null);

  // Auto-refresh countdown (60s ticker)
  const [countdown, setCountdown] = useState<number>(60);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(true);

  // Fetch status and config from backend
  const fetchData = async () => {
    try {
      const [statusRes, configRes] = await Promise.all([
        fetch('/api/status'),
        fetch('/api/config')
      ]);

      if (statusRes.ok) {
        const data = await statusRes.json();
        setStatusData(data);
      }

      if (configRes.ok) {
        const cfg = await configRes.json();
        setConfig(cfg);
      }
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

  // Manual refresh trigger
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/check-now', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setStatusData(data);
        setCountdown(60);
      }
    } catch (err) {
      console.error('Manual refresh failed:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Quick check for single site
  const handleQuickCheck = async (siteId: string) => {
    setCheckingSiteId(siteId);
    try {
      await handleManualRefresh();
    } finally {
      setCheckingSiteId(null);
    }
  };

  // Save new configuration
  const handleSaveConfig = async (newConfig: MonitoredUrl[]) => {
    setIsSavingConfig(true);
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      });
      if (res.ok) {
        const result = await res.json();
        setConfig(result.config);
        setStatusData(result.status);
      }
    } catch (err) {
      console.error('Failed to save configuration:', err);
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Reset simulated historical seed logs
  const handleResetSeedData = async () => {
    if (!window.confirm('Reset status history with fresh seed logs?')) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/reset-data', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setStatusData(data);
      }
    } catch (err) {
      console.error('Reset failed:', err);
    } finally {
      setIsLoading(false);
    }
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-white pb-16">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRefresh={handleManualRefresh}
        isRefreshing={isRefreshing}
        lastUpdated={statusData?.lastUpdated || null}
        countdown={countdown}
        autoRefreshEnabled={autoRefreshEnabled}
        setAutoRefreshEnabled={setAutoRefreshEnabled}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
            <p className="text-sm font-mono text-slate-400">Loading website health metrics...</p>
          </div>
        ) : (
          <>
            {/* TAB 1: DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <StatusBanner summary={statusData?.summary || null} siteCount={statusData?.sites?.length || 0} />
                <MetricsOverview summary={statusData?.summary || null} sites={statusData?.sites || []} />

                {/* Filter and Search Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search by name or URL..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
                    <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <div className="flex space-x-1">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                            selectedCategory === cat
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Service Cards Grid */}
                {filteredSites.length === 0 ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
                    <p className="text-sm font-mono">No monitored endpoints match the active filter criteria.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredSites.map((site) => (
                      <ServiceCard
                        key={site.id}
                        site={site}
                        onSelectDetails={setSelectedDetailsSite}
                        onQuickCheck={handleQuickCheck}
                        isChecking={checkingSiteId === site.id}
                      />
                    ))}
                  </div>
                )}

                {/* Footer options */}
                <div className="flex justify-end pt-4">
                  <button
                    onClick={handleResetSeedData}
                    className="text-xs text-slate-500 hover:text-slate-300 flex items-center space-x-1 font-mono transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Seed Data</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: CONFIG EDITOR */}
            {activeTab === 'config' && (
              <ConfigEditor
                config={config}
                onSaveConfig={handleSaveConfig}
                isSaving={isSavingConfig}
              />
            )}

            {/* TAB 3: INCIDENTS */}
            {activeTab === 'incidents' && (
              <IncidentHistory incidents={statusData?.incidents || []} />
            )}

            {/* TAB 4: GITHUB SETUP GUIDE */}
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
