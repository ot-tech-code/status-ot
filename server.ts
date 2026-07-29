import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = process.cwd();

const CONFIG_PATH = path.join(ROOT_DIR, 'data', 'urls.json');
const STATUS_PATH = path.join(ROOT_DIR, 'public', 'data', 'status.json');

// Ensure directories exist
function ensureDirs() {
  const dataDir = path.dirname(CONFIG_PATH);
  const publicDataDir = path.dirname(STATUS_PATH);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(publicDataDir)) fs.mkdirSync(publicDataDir, { recursive: true });
}

// Load URLs config
function loadConfig() {
  ensureDirs();
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    } catch (e) {
      console.error('Error loading config:', e);
    }
  }
  const defaultConfig = [
    {
      id: 'site-1',
      name: 'Google Search',
      url: 'https://www.google.com',
      method: 'GET',
      expectedStatus: 200,
      timeout: 5000,
      category: 'Search & Web',
      enabled: true,
      description: 'Global web search engine endpoint'
    },
    {
      id: 'site-2',
      name: 'GitHub API',
      url: 'https://api.github.com',
      method: 'GET',
      expectedStatus: 200,
      timeout: 5000,
      category: 'Developer Tools',
      enabled: true,
      description: 'GitHub REST API endpoint'
    },
    {
      id: 'site-3',
      name: 'Cloudflare DNS',
      url: 'https://1.1.1.1',
      method: 'GET',
      expectedStatus: 200,
      timeout: 5000,
      category: 'Infrastructure',
      enabled: true,
      description: 'Cloudflare public DNS portal'
    },
    {
      id: 'site-4',
      name: 'Wikipedia Org',
      url: 'https://www.wikipedia.org',
      method: 'GET',
      expectedStatus: 200,
      timeout: 5000,
      category: 'Knowledge Base',
      enabled: true,
      description: 'Wikipedia main entry portal'
    },
    {
      id: 'site-5',
      name: 'HTTPBin 200 Test',
      url: 'https://httpbin.org/status/200',
      method: 'GET',
      expectedStatus: 200,
      timeout: 5000,
      category: 'API Microservices',
      enabled: true,
      description: 'Simulated endpoint returning 200 OK'
    }
  ];
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(defaultConfig, null, 2), 'utf-8');
  return defaultConfig;
}

// Perform URL health check
async function checkUrl(site: any) {
  const timeout = site.timeout || 5000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  const startTime = Date.now();

  try {
    const res = await fetch(site.url, {
      method: site.method || 'GET',
      headers: {
        'User-Agent': 'StatusMonitorBot/1.0 (+https://github.com)'
      },
      signal: controller.signal
    });
    clearTimeout(timer);
    const responseTimeMs = Date.now() - startTime;
    const statusCode = res.status;

    const expected = site.expectedStatus || 200;
    const isOk = statusCode === expected || (statusCode >= 200 && statusCode < 400 && expected === 200);
    const status = isOk ? (responseTimeMs > 1500 ? 'degraded' : 'up') : 'down';
    const error = isOk ? null : `HTTP status ${statusCode} (expected ${expected})`;

    return {
      timestamp: new Date().toISOString(),
      statusCode,
      responseTimeMs,
      status,
      error
    };
  } catch (err: any) {
    clearTimeout(timer);
    const responseTimeMs = Date.now() - startTime;
    const errorMsg = err.name === 'AbortError' ? `Timeout (${timeout}ms)` : (err.message || 'Network error');

    return {
      timestamp: new Date().toISOString(),
      statusCode: 0,
      responseTimeMs,
      status: 'down',
      error: errorMsg
    };
  }
}

// Generate rich initial seed data for history bars if status file is missing or empty
function generateSeedStatus(config: any[]) {
  const now = Date.now();
  const sites = config.filter(c => c.enabled).map(site => {
    const history = [];
    // Generate 40 historical check points spanning the last 24 hours
    for (let i = 40; i >= 0; i--) {
      const timestamp = new Date(now - i * 36 * 60 * 1000).toISOString();
      const isRandomFluke = Math.random() < 0.03;
      const responseTimeMs = Math.floor(45 + Math.random() * 180 + (isRandomFluke ? 600 : 0));
      const statusCode = site.expectedStatus || 200;
      const status = isRandomFluke ? 'degraded' : 'up';

      history.push({
        timestamp,
        statusCode,
        responseTimeMs,
        status,
        error: isRandomFluke ? 'High latency spike detected' : null
      });
    }

    const current = history[history.length - 1];
    const total = history.length;
    const upCount = history.filter(h => h.status === 'up' || h.status === 'degraded').length;
    const uptime24h = Math.round((upCount / total) * 1000) / 10;
    const avgResponseTimeMs = Math.round(history.reduce((acc, h) => acc + h.responseTimeMs, 0) / total);

    return {
      id: site.id,
      name: site.name,
      url: site.url,
      category: site.category || 'General',
      enabled: site.enabled,
      expectedStatus: site.expectedStatus || 200,
      current,
      uptime24h,
      uptime7d: Math.min(100, Math.round((uptime24h + 0.2) * 10) / 10),
      uptime30d: Math.min(100, Math.round((uptime24h + 0.1) * 10) / 10),
      avgResponseTimeMs,
      history
    };
  });

  const totalUp = sites.filter(s => s.current.status === 'up').length;
  const totalDegraded = sites.filter(s => s.current.status === 'degraded').length;
  const totalDown = sites.filter(s => s.current.status === 'down').length;
  const avgLatencyMs = Math.round(sites.reduce((acc, s) => acc + s.avgResponseTimeMs, 0) / sites.length);

  const statusData = {
    lastUpdated: new Date().toISOString(),
    summary: {
      lastUpdated: new Date().toISOString(),
      overallStatus: totalDown > 0 ? (totalDown >= sites.length / 2 ? 'outage' : 'degraded') : (totalDegraded > 0 ? 'degraded' : 'operational'),
      total: sites.length,
      upCount: totalUp,
      downCount: totalDown,
      degradedCount: totalDegraded,
      avgLatencyMs
    },
    sites,
    incidents: [
      {
        id: 'inc-1',
        siteId: 'site-2',
        siteName: 'GitHub API',
        url: 'https://api.github.com',
        startTime: new Date(now - 4 * 3600 * 1000).toISOString(),
        endTime: new Date(now - 3.8 * 3600 * 1000).toISOString(),
        durationMs: 12 * 60 * 1000,
        statusCode: 503,
        error: 'Upstream HTTP 503 Service Unavailable',
        status: 'resolved'
      }
    ]
  };

  ensureDirs();
  fs.writeFileSync(STATUS_PATH, JSON.stringify(statusData, null, 2), 'utf-8');
  return statusData;
}

// Execute check for all configured URLs
async function runChecks() {
  ensureDirs();
  const config = loadConfig();
  
  let existingData: any = null;
  if (fs.existsSync(STATUS_PATH)) {
    try {
      existingData = JSON.parse(fs.readFileSync(STATUS_PATH, 'utf-8'));
    } catch (e) {
      console.error('Error reading existing status:', e);
    }
  }

  if (!existingData || !existingData.sites || existingData.sites.length === 0) {
    existingData = generateSeedStatus(config);
  }

  const existingSitesMap = new Map<string, any>((existingData.sites || []).map((s: any) => [s.id, s]));
  const updatedSites: any[] = [];
  let totalUp = 0;
  let totalDown = 0;
  let totalDegraded = 0;
  let totalLatency = 0;
  let validCount = 0;

  for (const siteConfig of config) {
    if (!siteConfig.enabled) continue;

    const checkResult = await checkUrl(siteConfig);
    const prevSite = existingSitesMap.get(siteConfig.id);
    let history: any[] = prevSite && prevSite.history ? [...prevSite.history] : [];

    history.push(checkResult);
    if (history.length > 90) history = history.slice(history.length - 90);

    const successful = history.filter((h: any) => h.status === 'up' || h.status === 'degraded').length;
    const uptime24h = Math.round((successful / history.length) * 1000) / 10;
    const validLatencies = history.filter((h: any) => h.responseTimeMs > 0).map((h: any) => h.responseTimeMs);
    const avgResponseTimeMs = validLatencies.length > 0 
      ? Math.round(validLatencies.reduce((a: number, b: number) => a + b, 0) / validLatencies.length) 
      : 0;

    if (checkResult.status === 'up') totalUp++;
    else if (checkResult.status === 'degraded') totalDegraded++;
    else totalDown++;

    if (checkResult.responseTimeMs > 0) {
      totalLatency += checkResult.responseTimeMs;
      validCount++;
    }

    updatedSites.push({
      id: siteConfig.id,
      name: siteConfig.name,
      url: siteConfig.url,
      category: siteConfig.category || 'General',
      enabled: siteConfig.enabled,
      expectedStatus: siteConfig.expectedStatus || 200,
      current: checkResult,
      uptime24h,
      uptime7d: uptime24h,
      uptime30d: uptime24h,
      avgResponseTimeMs,
      history
    });
  }

  const overallStatus = totalDown > 0 ? (totalDown >= updatedSites.length / 2 ? 'outage' : 'degraded') : (totalDegraded > 0 ? 'degraded' : 'operational');
  const avgLatencyMs = validCount > 0 ? Math.round(totalLatency / validCount) : 0;

  const newStatusData = {
    lastUpdated: new Date().toISOString(),
    summary: {
      lastUpdated: new Date().toISOString(),
      overallStatus,
      total: updatedSites.length,
      upCount: totalUp,
      downCount: totalDown,
      degradedCount: totalDegraded,
      avgLatencyMs
    },
    sites: updatedSites,
    incidents: existingData.incidents || []
  };

  fs.writeFileSync(STATUS_PATH, JSON.stringify(newStatusData, null, 2), 'utf-8');
  return newStatusData;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Get URLs configuration
  app.get('/api/config', (req, res) => {
    try {
      const config = loadConfig();
      res.json(config);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API Route: Save URLs configuration
  app.post('/api/config', async (req, res) => {
    try {
      const newConfig = req.body;
      if (!Array.isArray(newConfig)) {
        return res.status(400).json({ error: 'Config must be an array of MonitoredUrl items' });
      }
      ensureDirs();
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(newConfig, null, 2), 'utf-8');
      
      // Immediately run checks for updated config
      const updatedStatus = await runChecks();
      res.json({ message: 'Configuration saved and checks executed', config: newConfig, status: updatedStatus });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API Route: Get current status data (file read or generated)
  app.get('/api/status', (req, res) => {
    try {
      ensureDirs();
      if (fs.existsSync(STATUS_PATH)) {
        const data = JSON.parse(fs.readFileSync(STATUS_PATH, 'utf-8'));
        return res.json(data);
      }
      const config = loadConfig();
      const seed = generateSeedStatus(config);
      return res.json(seed);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API Route: Trigger immediate check now
  app.post('/api/check-now', async (req, res) => {
    try {
      const newStatus = await runChecks();
      res.json(newStatus);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API Route: Reset historical test data
  app.post('/api/reset-data', (req, res) => {
    try {
      const config = loadConfig();
      const seed = generateSeedStatus(config);
      res.json(seed);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Background ticker running every 60 seconds
  setInterval(() => {
    runChecks().catch(err => console.error('Background check error:', err));
  }, 60000);

  // Run an initial check upon boot
  runChecks().catch(err => console.error('Boot check error:', err));

  // Vite development middleware vs Static Production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
