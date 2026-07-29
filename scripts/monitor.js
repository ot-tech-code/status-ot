import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// File paths
const CONFIG_PATH = path.join(ROOT_DIR, 'data', 'urls.json');
const OUTPUT_PATH = path.join(ROOT_DIR, 'public', 'data', 'status.json');
const PUBLIC_CONFIG_PATH = path.join(ROOT_DIR, 'public', 'data', 'urls.json');

// Ensure directories exist
function ensureDirs() {
  const publicDataDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(publicDataDir)) {
    fs.mkdirSync(publicDataDir, { recursive: true });
  }
}

// Load monitored URLs config
function loadConfig() {
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      const data = fs.readFileSync(CONFIG_PATH, 'utf-8');
      return JSON.parse(data);
    } catch (err) {
      console.error('Error reading config file:', err);
    }
  }
  return [
    {
      id: 'site-1',
      name: 'Google Main Search',
      url: 'https://www.google.com',
      method: 'GET',
      expectedStatus: 200,
      timeout: 5000,
      category: 'Search & Web Services',
      enabled: true
    }
  ];
}

// Load existing status output
function loadExistingStatus() {
  if (fs.existsSync(OUTPUT_PATH)) {
    try {
      const data = fs.readFileSync(OUTPUT_PATH, 'utf-8');
      return JSON.parse(data);
    } catch (err) {
      console.log('No existing status file or parse error, creating new status object.');
    }
  }
  return {
    lastUpdated: new Date().toISOString(),
    summary: {
      lastUpdated: new Date().toISOString(),
      overallStatus: 'operational',
      total: 0,
      upCount: 0,
      downCount: 0,
      degradedCount: 0,
      avgLatencyMs: 0
    },
    sites: [],
    incidents: []
  };
}

// Perform check for a single URL
async function checkUrl(site) {
  const timeout = site.timeout || 5000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  const startTime = Date.now();
  let statusCode = 0;
  let status = 'down';
  let error = null;

  try {
    const res = await fetch(site.url, {
      method: site.method || 'GET',
      headers: {
        'User-Agent': 'StatusMonitorBot/1.0 (+https://github.com)'
      },
      signal: controller.signal
    });
    clearTimeout(timer);
    const endTime = Date.now();
    const responseTimeMs = endTime - startTime;
    statusCode = res.status;

    const expected = site.expectedStatus || 200;
    if (statusCode === expected || (statusCode >= 200 && statusCode < 400 && expected === 200)) {
      status = responseTimeMs > 1500 ? 'degraded' : 'up';
    } else {
      status = 'down';
      error = `Received HTTP status code ${statusCode} (expected ${expected})`;
    }

    return {
      timestamp: new Date().toISOString(),
      statusCode,
      responseTimeMs,
      status,
      error
    };
  } catch (err) {
    clearTimeout(timer);
    const endTime = Date.now();
    const responseTimeMs = endTime - startTime;

    if (err.name === 'AbortError') {
      error = `Timeout after ${timeout}ms`;
    } else {
      error = err.message || 'Network request failed';
    }

    return {
      timestamp: new Date().toISOString(),
      statusCode: 0,
      responseTimeMs,
      status: 'down',
      error
    };
  }
}

// Calculate site statistics from history
function calculateStats(history) {
  if (!history || history.length === 0) {
    return { uptime24h: 100, uptime7d: 100, uptime30d: 100, avgResponseTimeMs: 0 };
  }

  const totalChecks = history.length;
  const successful = history.filter(h => h.status === 'up' || h.status === 'degraded').length;
  const uptime24h = Math.round((successful / totalChecks) * 1000) / 10;

  const validLatencies = history.filter(h => h.responseTimeMs > 0).map(h => h.responseTimeMs);
  const avgResponseTimeMs = validLatencies.length > 0 
    ? Math.round(validLatencies.reduce((a, b) => a + b, 0) / validLatencies.length) 
    : 0;

  return {
    uptime24h,
    uptime7d: uptime24h,
    uptime30d: uptime24h,
    avgResponseTimeMs
  };
}

async function run() {
  console.log(`[${new Date().toISOString()}] Starting website monitoring check...`);
  ensureDirs();

  const config = loadConfig();
  const existingData = loadExistingStatus();
  const existingSitesMap = new Map((existingData.sites || []).map(s => [s.id, s]));

  const updatedSites = [];
  let totalUp = 0;
  let totalDown = 0;
  let totalDegraded = 0;
  let totalLatency = 0;
  let validLatencyCount = 0;

  for (const item of config) {
    if (!item.enabled) continue;

    console.log(`Checking ${item.name} (${item.url})...`);
    const checkResult = await checkUrl(item);

    const prevSite = existingSitesMap.get(item.id);
    let history = prevSite && prevSite.history ? [...prevSite.history] : [];
    
    // Add new check result to history (keep max 90 checks)
    history.push(checkResult);
    if (history.length > 90) {
      history = history.slice(history.length - 90);
    }

    const stats = calculateStats(history);

    if (checkResult.status === 'up') totalUp++;
    else if (checkResult.status === 'degraded') totalDegraded++;
    else totalDown++;

    if (checkResult.responseTimeMs > 0) {
      totalLatency += checkResult.responseTimeMs;
      validLatencyCount++;
    }

    updatedSites.push({
      id: item.id,
      name: item.name,
      url: item.url,
      category: item.category || 'General',
      enabled: item.enabled,
      expectedStatus: item.expectedStatus || 200,
      current: checkResult,
      uptime24h: stats.uptime24h,
      uptime7d: stats.uptime7d,
      uptime30d: stats.uptime30d,
      avgResponseTimeMs: stats.avgResponseTimeMs,
      history
    });
  }

  const overallStatus = totalDown > 0 ? (totalDown >= updatedSites.length / 2 ? 'outage' : 'degraded') : (totalDegraded > 0 ? 'degraded' : 'operational');
  const avgLatencyMs = validLatencyCount > 0 ? Math.round(totalLatency / validLatencyCount) : 0;

  const output = {
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

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf-8');
  fs.writeFileSync(PUBLIC_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
  console.log(`[${new Date().toISOString()}] Check complete! Status written to ${OUTPUT_PATH} and ${PUBLIC_CONFIG_PATH}`);
}

run().catch(err => {
  console.error('Fatal error during monitoring:', err);
  process.exit(1);
});
