import React, { useState } from 'react';
import { Github, Copy, Check, Download, Terminal, Play, ArrowRight, Shield, Layers, FileCode } from 'lucide-react';

export const GitHubActionsGuide: React.FC = () => {
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  const workflowYml = `name: Website Status Monitor & GitHub Pages Deploy

on:
  schedule:
    # Run every 5 minutes (GitHub Actions cron schedule)
    - cron: '*/5 * * * *'
  workflow_dispatch: # Allows manual trigger from GitHub UI
  push:
    branches:
      - main

permissions:
  contents: write
  pages: write
  id-token: write

jobs:
  monitor-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Node.js Environment
        uses: actions/setup-node@v4
        with:
          node-version: '24'

      - name: Execute Website Health Checks
        run: node scripts/monitor.js

      - name: Commit Updated Status Log (data/status.json)
        run: |
          git config --global user.name "github-actions[bot]"
          git config --global user.email "github-actions[bot]@users.noreply.github.com"
          git add public/data/status.json
          git diff --staged --quiet || git commit -m "chore(status): update website status logs [skip ci]"
          git push origin main || true

      - name: Build Dashboard Static Files
        run: |
          npm ci || npm install
          npm run build

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: \${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist`;

  const monitorJs = `import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const CONFIG_PATH = path.join(ROOT_DIR, 'data', 'urls.json');
const OUTPUT_PATH = path.join(ROOT_DIR, 'public', 'data', 'status.json');

// Ensure directories exist
function ensureDirs() {
  const publicDataDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(publicDataDir)) {
    fs.mkdirSync(publicDataDir, { recursive: true });
  }
}

// Load URLs to check
function loadConfig() {
  if (fs.existsSync(CONFIG_PATH)) {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  }
  return [];
}

async function checkUrl(site) {
  const timeout = site.timeout || 5000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  const startTime = Date.now();

  try {
    const res = await fetch(site.url, {
      method: site.method || 'GET',
      headers: { 'User-Agent': 'StatusMonitorBot/1.0' },
      signal: controller.signal
    });
    clearTimeout(timer);
    const responseTimeMs = Date.now() - startTime;
    const statusCode = res.status;
    const expected = site.expectedStatus || 200;
    const isOk = statusCode === expected || (statusCode >= 200 && statusCode < 400 && expected === 200);

    return {
      timestamp: new Date().toISOString(),
      statusCode,
      responseTimeMs,
      status: isOk ? (responseTimeMs > 1500 ? 'degraded' : 'up') : 'down',
      error: isOk ? null : \`HTTP status \${statusCode}\`
    };
  } catch (err) {
    clearTimeout(timer);
    return {
      timestamp: new Date().toISOString(),
      statusCode: 0,
      responseTimeMs: Date.now() - startTime,
      status: 'down',
      error: err.name === 'AbortError' ? 'Timeout' : err.message
    };
  }
}

async function run() {
  ensureDirs();
  const config = loadConfig();
  let existingData = { sites: [] };

  if (fs.existsSync(OUTPUT_PATH)) {
    try { existingData = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf-8')); } catch (e) {}
  }

  const existingMap = new Map((existingData.sites || []).map(s => [s.id, s]));
  const updatedSites = [];
  let totalUp = 0, totalDown = 0, totalDegraded = 0;

  for (const item of config) {
    if (!item.enabled) continue;
    const check = await checkUrl(item);
    const prev = existingMap.get(item.id);
    let history = prev && prev.history ? [...prev.history] : [];
    history.push(check);
    if (history.length > 90) history = history.slice(history.length - 90);

    const upCount = history.filter(h => h.status === 'up' || h.status === 'degraded').length;
    const uptime24h = Math.round((upCount / history.length) * 1000) / 10;
    const avgLatency = Math.round(history.reduce((a, b) => a + b.responseTimeMs, 0) / history.length);

    if (check.status === 'up') totalUp++;
    else if (check.status === 'degraded') totalDegraded++;
    else totalDown++;

    updatedSites.push({
      id: item.id,
      name: item.name,
      url: item.url,
      category: item.category || 'General',
      current: check,
      uptime24h,
      avgResponseTimeMs: avgLatency,
      history
    });
  }

  const output = {
    lastUpdated: new Date().toISOString(),
    summary: {
      lastUpdated: new Date().toISOString(),
      overallStatus: totalDown > 0 ? 'degraded' : 'operational',
      total: updatedSites.length,
      upCount: totalUp,
      downCount: totalDown,
      degradedCount: totalDegraded
    },
    sites: updatedSites
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf-8');
  console.log('Status updated successfully!');
}

run();`;

  const handleCopy = (content: string, key: string) => {
    navigator.clipboard.writeText(content);
    setCopiedFile(key);
    setTimeout(() => setCopiedFile(null), 2500);
  };

  const handleDownloadFile = (content: string, filename: string) => {
    const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(content);
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", filename);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
  };

  return (
    <div className="space-y-8">
      {/* Hero Setup banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-md">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
            <Github className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">GitHub Actions & GitHub Pages Integration</h2>
            <p className="text-slate-300 text-sm mt-1 max-w-3xl">
              This status tool is designed to run completely free using <strong>GitHub Actions</strong> cron schedules. Every minute/5 minutes, GitHub Actions reads <code className="text-emerald-400">data/urls.json</code>, sends HTTP requests, records response time & status codes into <code className="text-emerald-400">public/data/status.json</code>, and automatically deploys the updated dashboard to GitHub Pages!
            </p>
          </div>
        </div>
      </div>

      {/* 4 Step Setup Cards */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
          <Layers className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <span>4-Step Quick Deployment Guide</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Step 1 */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 relative overflow-hidden shadow-sm">
            <div className="absolute top-3 right-4 text-4xl font-black text-slate-100 dark:text-slate-800 select-none">01</div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">Step 1</span>
            <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">Push Repo to GitHub</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Create a public or private repository on GitHub and push this project codebase to the <code className="text-slate-800 dark:text-slate-200 font-mono">main</code> branch.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 relative overflow-hidden shadow-sm">
            <div className="absolute top-3 right-4 text-4xl font-black text-slate-100 dark:text-slate-800 select-none">02</div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">Step 2</span>
            <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">Enable GitHub Pages</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              In your GitHub Repository, navigate to <strong>Settings</strong> &rr; <strong>Pages</strong>. Set <strong>Build and deployment Source</strong> to <strong>GitHub Actions</strong>.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 relative overflow-hidden shadow-sm">
            <div className="absolute top-3 right-4 text-4xl font-black text-slate-100 dark:text-slate-800 select-none">03</div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">Step 3</span>
            <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">Set Workflow File</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Save <code className="text-slate-800 dark:text-slate-200 font-mono">.github/workflows/monitor.yml</code> in your repository. GitHub Actions will pick it up automatically.
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 relative overflow-hidden shadow-sm">
            <div className="absolute top-3 right-4 text-4xl font-black text-slate-100 dark:text-slate-800 select-none">04</div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">Step 4</span>
            <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">Automatic Uptime Checks</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Actions will run every 5 min, save response codes & latency in <code className="text-slate-800 dark:text-slate-200 font-mono">public/data/status.json</code>, and push live status updates to your GitHub Pages domain!
            </p>
          </div>
        </div>
      </div>

      {/* Embedded File Viewers with Copy Buttons */}
      <div className="space-y-6">
        {/* File 1: Workflow YML */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileCode className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">.github/workflows/monitor.yml</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleCopy(workflowYml, 'workflow')}
                className="flex items-center space-x-1 px-3 py-1 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-mono rounded border border-slate-300 dark:border-slate-700 transition-colors"
              >
                {copiedFile === 'workflow' ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedFile === 'workflow' ? 'Copied!' : 'Copy'}</span>
              </button>
              <button
                onClick={() => handleDownloadFile(workflowYml, 'monitor.yml')}
                className="flex items-center space-x-1 px-3 py-1 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-mono rounded border border-slate-300 dark:border-slate-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            </div>
          </div>
          <pre className="p-4 bg-slate-50 dark:bg-slate-950/80 font-mono text-xs text-slate-800 dark:text-slate-300 overflow-x-auto leading-relaxed max-h-80">
            {workflowYml}
          </pre>
        </div>

        {/* File 2: Monitor Runner Script */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">scripts/monitor.js</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleCopy(monitorJs, 'script')}
                className="flex items-center space-x-1 px-3 py-1 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-mono rounded border border-slate-300 dark:border-slate-700 transition-colors"
              >
                {copiedFile === 'script' ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedFile === 'script' ? 'Copied!' : 'Copy'}</span>
              </button>
              <button
                onClick={() => handleDownloadFile(monitorJs, 'monitor.js')}
                className="flex items-center space-x-1 px-3 py-1 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-mono rounded border border-slate-300 dark:border-slate-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            </div>
          </div>
          <pre className="p-4 bg-slate-50 dark:bg-slate-950/80 font-mono text-xs text-slate-800 dark:text-slate-300 overflow-x-auto leading-relaxed max-h-80">
            {monitorJs}
          </pre>
        </div>
      </div>
    </div>
  );
};
