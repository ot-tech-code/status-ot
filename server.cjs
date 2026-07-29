var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
var import_url = require("url");
var import_vite = require("vite");
var import_meta = {};
var __filename = (0, import_url.fileURLToPath)(import_meta.url);
var __dirname = import_path.default.dirname(__filename);
var ROOT_DIR = process.cwd();
var CONFIG_PATH = import_path.default.join(ROOT_DIR, "data", "urls.json");
var STATUS_PATH = import_path.default.join(ROOT_DIR, "public", "data", "status.json");
function ensureDirs() {
  const dataDir = import_path.default.dirname(CONFIG_PATH);
  const publicDataDir = import_path.default.dirname(STATUS_PATH);
  if (!import_fs.default.existsSync(dataDir)) import_fs.default.mkdirSync(dataDir, { recursive: true });
  if (!import_fs.default.existsSync(publicDataDir)) import_fs.default.mkdirSync(publicDataDir, { recursive: true });
}
function loadConfig() {
  ensureDirs();
  if (import_fs.default.existsSync(CONFIG_PATH)) {
    try {
      return JSON.parse(import_fs.default.readFileSync(CONFIG_PATH, "utf-8"));
    } catch (e) {
      console.error("Error loading config:", e);
    }
  }
  const defaultConfig = [
    {
      id: "site-1",
      name: "Google Search",
      url: "https://www.google.com",
      method: "GET",
      expectedStatus: 200,
      timeout: 5e3,
      category: "Search & Web",
      enabled: true,
      description: "Global web search engine endpoint"
    },
    {
      id: "site-2",
      name: "GitHub API",
      url: "https://api.github.com",
      method: "GET",
      expectedStatus: 200,
      timeout: 5e3,
      category: "Developer Tools",
      enabled: true,
      description: "GitHub REST API endpoint"
    },
    {
      id: "site-3",
      name: "Cloudflare DNS",
      url: "https://1.1.1.1",
      method: "GET",
      expectedStatus: 200,
      timeout: 5e3,
      category: "Infrastructure",
      enabled: true,
      description: "Cloudflare public DNS portal"
    },
    {
      id: "site-4",
      name: "Wikipedia Org",
      url: "https://www.wikipedia.org",
      method: "GET",
      expectedStatus: 200,
      timeout: 5e3,
      category: "Knowledge Base",
      enabled: true,
      description: "Wikipedia main entry portal"
    },
    {
      id: "site-5",
      name: "HTTPBin 200 Test",
      url: "https://httpbin.org/status/200",
      method: "GET",
      expectedStatus: 200,
      timeout: 5e3,
      category: "API Microservices",
      enabled: true,
      description: "Simulated endpoint returning 200 OK"
    }
  ];
  import_fs.default.writeFileSync(CONFIG_PATH, JSON.stringify(defaultConfig, null, 2), "utf-8");
  return defaultConfig;
}
async function checkUrl(site) {
  const timeout = site.timeout || 5e3;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  const startTime = Date.now();
  try {
    const res = await fetch(site.url, {
      method: site.method || "GET",
      headers: {
        "User-Agent": "StatusMonitorBot/1.0 (+https://github.com)"
      },
      signal: controller.signal
    });
    clearTimeout(timer);
    const responseTimeMs = Date.now() - startTime;
    const statusCode = res.status;
    const expected = site.expectedStatus || 200;
    const isOk = statusCode === expected || statusCode >= 200 && statusCode < 400 && expected === 200;
    const status = isOk ? responseTimeMs > 1500 ? "degraded" : "up" : "down";
    const error = isOk ? null : `HTTP status ${statusCode} (expected ${expected})`;
    return {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      statusCode,
      responseTimeMs,
      status,
      error
    };
  } catch (err) {
    clearTimeout(timer);
    const responseTimeMs = Date.now() - startTime;
    const errorMsg = err.name === "AbortError" ? `Timeout (${timeout}ms)` : err.message || "Network error";
    return {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      statusCode: 0,
      responseTimeMs,
      status: "down",
      error: errorMsg
    };
  }
}
function generateSeedStatus(config) {
  const now = Date.now();
  const sites = config.filter((c) => c.enabled).map((site) => {
    const history = [];
    for (let i = 40; i >= 0; i--) {
      const timestamp = new Date(now - i * 36 * 60 * 1e3).toISOString();
      const isRandomFluke = Math.random() < 0.03;
      const responseTimeMs = Math.floor(45 + Math.random() * 180 + (isRandomFluke ? 600 : 0));
      const statusCode = site.expectedStatus || 200;
      const status = isRandomFluke ? "degraded" : "up";
      history.push({
        timestamp,
        statusCode,
        responseTimeMs,
        status,
        error: isRandomFluke ? "High latency spike detected" : null
      });
    }
    const current = history[history.length - 1];
    const total = history.length;
    const upCount = history.filter((h) => h.status === "up" || h.status === "degraded").length;
    const uptime24h = Math.round(upCount / total * 1e3) / 10;
    const avgResponseTimeMs = Math.round(history.reduce((acc, h) => acc + h.responseTimeMs, 0) / total);
    return {
      id: site.id,
      name: site.name,
      url: site.url,
      category: site.category || "General",
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
  const totalUp = sites.filter((s) => s.current.status === "up").length;
  const totalDegraded = sites.filter((s) => s.current.status === "degraded").length;
  const totalDown = sites.filter((s) => s.current.status === "down").length;
  const avgLatencyMs = Math.round(sites.reduce((acc, s) => acc + s.avgResponseTimeMs, 0) / sites.length);
  const statusData = {
    lastUpdated: (/* @__PURE__ */ new Date()).toISOString(),
    summary: {
      lastUpdated: (/* @__PURE__ */ new Date()).toISOString(),
      overallStatus: totalDown > 0 ? totalDown >= sites.length / 2 ? "outage" : "degraded" : totalDegraded > 0 ? "degraded" : "operational",
      total: sites.length,
      upCount: totalUp,
      downCount: totalDown,
      degradedCount: totalDegraded,
      avgLatencyMs
    },
    sites,
    incidents: [
      {
        id: "inc-1",
        siteId: "site-2",
        siteName: "GitHub API",
        url: "https://api.github.com",
        startTime: new Date(now - 4 * 3600 * 1e3).toISOString(),
        endTime: new Date(now - 3.8 * 3600 * 1e3).toISOString(),
        durationMs: 12 * 60 * 1e3,
        statusCode: 503,
        error: "Upstream HTTP 503 Service Unavailable",
        status: "resolved"
      }
    ]
  };
  ensureDirs();
  import_fs.default.writeFileSync(STATUS_PATH, JSON.stringify(statusData, null, 2), "utf-8");
  return statusData;
}
async function runChecks() {
  ensureDirs();
  const config = loadConfig();
  let existingData = null;
  if (import_fs.default.existsSync(STATUS_PATH)) {
    try {
      existingData = JSON.parse(import_fs.default.readFileSync(STATUS_PATH, "utf-8"));
    } catch (e) {
      console.error("Error reading existing status:", e);
    }
  }
  if (!existingData || !existingData.sites || existingData.sites.length === 0) {
    existingData = generateSeedStatus(config);
  }
  const existingSitesMap = new Map((existingData.sites || []).map((s) => [s.id, s]));
  const updatedSites = [];
  let totalUp = 0;
  let totalDown = 0;
  let totalDegraded = 0;
  let totalLatency = 0;
  let validCount = 0;
  for (const siteConfig of config) {
    if (!siteConfig.enabled) continue;
    const checkResult = await checkUrl(siteConfig);
    const prevSite = existingSitesMap.get(siteConfig.id);
    let history = prevSite && prevSite.history ? [...prevSite.history] : [];
    history.push(checkResult);
    if (history.length > 90) history = history.slice(history.length - 90);
    const successful = history.filter((h) => h.status === "up" || h.status === "degraded").length;
    const uptime24h = Math.round(successful / history.length * 1e3) / 10;
    const validLatencies = history.filter((h) => h.responseTimeMs > 0).map((h) => h.responseTimeMs);
    const avgResponseTimeMs = validLatencies.length > 0 ? Math.round(validLatencies.reduce((a, b) => a + b, 0) / validLatencies.length) : 0;
    if (checkResult.status === "up") totalUp++;
    else if (checkResult.status === "degraded") totalDegraded++;
    else totalDown++;
    if (checkResult.responseTimeMs > 0) {
      totalLatency += checkResult.responseTimeMs;
      validCount++;
    }
    updatedSites.push({
      id: siteConfig.id,
      name: siteConfig.name,
      url: siteConfig.url,
      category: siteConfig.category || "General",
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
  const overallStatus = totalDown > 0 ? totalDown >= updatedSites.length / 2 ? "outage" : "degraded" : totalDegraded > 0 ? "degraded" : "operational";
  const avgLatencyMs = validCount > 0 ? Math.round(totalLatency / validCount) : 0;
  const newStatusData = {
    lastUpdated: (/* @__PURE__ */ new Date()).toISOString(),
    summary: {
      lastUpdated: (/* @__PURE__ */ new Date()).toISOString(),
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
  import_fs.default.writeFileSync(STATUS_PATH, JSON.stringify(newStatusData, null, 2), "utf-8");
  return newStatusData;
}
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json());
  app.get("/api/config", (req, res) => {
    try {
      const config = loadConfig();
      res.json(config);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/config", async (req, res) => {
    try {
      const newConfig = req.body;
      if (!Array.isArray(newConfig)) {
        return res.status(400).json({ error: "Config must be an array of MonitoredUrl items" });
      }
      ensureDirs();
      import_fs.default.writeFileSync(CONFIG_PATH, JSON.stringify(newConfig, null, 2), "utf-8");
      const updatedStatus = await runChecks();
      res.json({ message: "Configuration saved and checks executed", config: newConfig, status: updatedStatus });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/status", (req, res) => {
    try {
      ensureDirs();
      if (import_fs.default.existsSync(STATUS_PATH)) {
        const data = JSON.parse(import_fs.default.readFileSync(STATUS_PATH, "utf-8"));
        return res.json(data);
      }
      const config = loadConfig();
      const seed = generateSeedStatus(config);
      return res.json(seed);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/check-now", async (req, res) => {
    try {
      const newStatus = await runChecks();
      res.json(newStatus);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/reset-data", (req, res) => {
    try {
      const config = loadConfig();
      const seed = generateSeedStatus(config);
      res.json(seed);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  setInterval(() => {
    runChecks().catch((err) => console.error("Background check error:", err));
  }, 6e4);
  runChecks().catch((err) => console.error("Boot check error:", err));
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
