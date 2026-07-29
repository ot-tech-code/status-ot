import React, { useState, useEffect } from 'react';
import { MonitoredUrl } from '../types';
import { Plus, Trash2, Edit3, Save, Download, Code, CheckCircle2, AlertCircle, FileText, RefreshCw } from 'lucide-react';

interface ConfigEditorProps {
  config: MonitoredUrl[];
  onSaveConfig: (newConfig: MonitoredUrl[]) => Promise<void>;
  isSaving: boolean;
}

export const ConfigEditor: React.FC<ConfigEditorProps> = ({ config, onSaveConfig, isSaving }) => {
  const [urls, setUrls] = useState<MonitoredUrl[]>(config);
  const [viewMode, setViewMode] = useState<'visual' | 'json'>('visual');
  const [jsonString, setJsonString] = useState<string>('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Sync internal state when props update
  useEffect(() => {
    setUrls(config);
    setJsonString(JSON.stringify(config, null, 2));
  }, [config]);

  // Handle switching to raw JSON mode
  const handleSwitchMode = (mode: 'visual' | 'json') => {
    if (mode === 'json') {
      setJsonString(JSON.stringify(urls, null, 2));
    } else {
      try {
        const parsed = JSON.parse(jsonString);
        if (Array.isArray(parsed)) {
          setUrls(parsed);
          setJsonError(null);
        }
      } catch (err: any) {
        setJsonError(`Invalid JSON syntax: ${err.message}`);
        return;
      }
    }
    setViewMode(mode);
  };

  // Add a new empty URL item
  const handleAddUrl = () => {
    const newItem: MonitoredUrl = {
      id: `site-${Date.now()}`,
      name: 'New Monitored Endpoint',
      url: 'https://example.com',
      method: 'GET',
      expectedStatus: 200,
      timeout: 5000,
      category: 'General',
      enabled: true,
      description: 'Custom site endpoint'
    };
    const updated = [...urls, newItem];
    setUrls(updated);
    setJsonString(JSON.stringify(updated, null, 2));
  };

  // Update specific field in visual mode
  const handleUpdateItem = (id: string, field: keyof MonitoredUrl, value: any) => {
    const updated = urls.map(item => item.id === id ? { ...item, [field]: value } : item);
    setUrls(updated);
    setJsonString(JSON.stringify(updated, null, 2));
  };

  // Delete an item
  const handleDeleteItem = (id: string) => {
    const updated = urls.filter(item => item.id !== id);
    setUrls(updated);
    setJsonString(JSON.stringify(updated, null, 2));
  };

  // Submit and save configuration
  const handleSave = async () => {
    setJsonError(null);
    let finalUrls = urls;

    if (viewMode === 'json') {
      try {
        finalUrls = JSON.parse(jsonString);
        if (!Array.isArray(finalUrls)) {
          setJsonError('JSON must be an array of MonitoredUrl objects.');
          return;
        }
        setUrls(finalUrls);
      } catch (err: any) {
        setJsonError(`JSON Syntax Error: ${err.message}`);
        return;
      }
    }

    await onSaveConfig(finalUrls);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Download urls.json file
  const handleDownloadJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(urls, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "urls.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <span>Monitored URLs Configuration (<code className="text-emerald-400 text-sm">urls.json</code>)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Define target endpoints for GitHub Actions to check every minute. Saved to <code className="text-slate-300">data/urls.json</code>.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Mode toggle */}
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => handleSwitchMode('visual')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                viewMode === 'visual' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Visual Editor
            </button>
            <button
              onClick={() => handleSwitchMode('json')}
              className={`px-3 py-1.5 rounded-md font-medium flex items-center space-x-1 transition-colors ${
                viewMode === 'json' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Raw JSON</span>
            </button>
          </div>

          <button
            onClick={handleDownloadJson}
            title="Download urls.json"
            className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export JSON</span>
          </button>
        </div>
      </div>

      {jsonError && (
        <div className="p-4 bg-rose-950/50 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center space-x-2 font-mono">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{jsonError}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="p-4 bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center space-x-2 font-mono">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Configuration saved! Server health checks executed immediately.</span>
        </div>
      )}

      {/* Main Mode Body */}
      {viewMode === 'visual' ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-mono text-slate-400">{urls.length} URLs configured</span>
            <button
              onClick={handleAddUrl}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add New URL</span>
            </button>
          </div>

          <div className="space-y-3">
            {urls.map((site) => (
              <div key={site.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  {/* Enable Switch */}
                  <div className="md:col-span-1 flex items-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={site.enabled}
                        onChange={(e) => handleUpdateItem(site.id, 'enabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                  {/* Name & Category */}
                  <div className="md:col-span-4 space-y-1">
                    <input
                      type="text"
                      value={site.name}
                      onChange={(e) => handleUpdateItem(site.id, 'name', e.target.value)}
                      placeholder="Service Display Name"
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                    <input
                      type="text"
                      value={site.category}
                      onChange={(e) => handleUpdateItem(site.id, 'category', e.target.value)}
                      placeholder="Category (e.g. APIs, Web)"
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-400 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* URL */}
                  <div className="md:col-span-4 space-y-1">
                    <input
                      type="url"
                      value={site.url}
                      onChange={(e) => handleUpdateItem(site.id, 'url', e.target.value)}
                      placeholder="https://example.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-emerald-400 font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Method & Status */}
                  <div className="md:col-span-2 flex space-x-2">
                    <select
                      value={site.method || 'GET'}
                      onChange={(e) => handleUpdateItem(site.id, 'method', e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="GET">GET</option>
                      <option value="HEAD">HEAD</option>
                      <option value="POST">POST</option>
                    </select>

                    <input
                      type="number"
                      value={site.expectedStatus || 200}
                      onChange={(e) => handleUpdateItem(site.id, 'expectedStatus', parseInt(e.target.value) || 200)}
                      placeholder="200"
                      title="Expected HTTP Status Code"
                      className="w-16 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300 font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Delete Action */}
                  <div className="md:col-span-1 flex justify-end">
                    <button
                      onClick={() => handleDeleteItem(site.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <textarea
            value={jsonString}
            onChange={(e) => setJsonString(e.target.value)}
            rows={18}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-200 focus:outline-none focus:border-emerald-500 leading-relaxed"
          />
        </div>
      )}

      {/* Save Action Bar */}
      <div className="flex justify-end pt-4 border-t border-slate-800">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl shadow-md transition-all disabled:opacity-50"
        >
          {isSaving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{isSaving ? 'Saving & Checking...' : 'Save Configuration & Run Check'}</span>
        </button>
      </div>
    </div>
  );
};
