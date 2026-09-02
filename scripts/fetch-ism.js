#!/usr/bin/env node
/**
 * Fetch ISM Manufacturing PMI from multiple sources and merge into data/series/ism.json
 *
 * Sources (priority order for merge):
 *  1. Trading Economics API (TRADING_ECONOMICS_API_KEY) — full history
 *  2. DBnomics API (free, ISM official provider) — recent monthly updates
 *  3. Bellwether open dataset (GitHub) — historical 1948→present baseline
 *  4. FRED NAPM (FRED_API_KEY) — legacy historical supplement
 *  5. Existing local ism.json — preserved on failure
 */
const fs = require("fs");
const path = require("path");
const https = require("https");

const ROOT = path.resolve(__dirname, "..");
const OUT_PATH = path.join(ROOT, "data", "series", "ism.json");

const BELLWETHER_HISTORICAL =
  "https://raw.githubusercontent.com/RealMaxPower/bellwether/main/data/pmi-historical.json";
const BELLWETHER_WAYBACK =
  "https://raw.githubusercontent.com/RealMaxPower/bellwether/main/data/pmi-wayback.json";
const DBNOMICS_URL = "https://api.db.nomics.world/v22/series/ISM/pmi?observations=1&limit=1";

const PMI_MIN = 25;
const PMI_MAX = 75;

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function writeJson(p, d) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(d, null, 2) + "\n");
}

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      { headers: { "User-Agent": "Money168-DataBot/1.0", Accept: "application/json" } },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          httpsGet(res.headers.location).then(resolve).catch(reject);
          return;
        }
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => {
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode} for ${url}`));
            return;
          }
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on("error", reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error(`Timeout: ${url}`));
    });
  });
}

function isValidPmi(value) {
  return typeof value === "number" && !Number.isNaN(value) && value >= PMI_MIN && value <= PMI_MAX;
}

function monthKey(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr.slice(0, 7);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function toFirstOfMonth(dateStr) {
  const key = monthKey(dateStr);
  return `${key}-01`;
}

function mergePoints(map, points, source, priority) {
  for (const pt of points) {
    if (!pt.date || !isValidPmi(pt.value)) continue;
    const key = monthKey(pt.date);
    const existing = map.get(key);
    if (!existing || priority >= existing.priority) {
      map.set(key, {
        date: toFirstOfMonth(pt.date),
        value: Math.round(pt.value * 10) / 10,
        source,
        priority,
      });
    }
  }
}

async function fetchBellwether(url, label) {
  try {
    const data = await httpsGet(url);
    const observations = data.observations || [];
    const points = observations
      .filter((o) => o.date && o.value != null)
      .map((o) => ({ date: o.date, value: parseFloat(o.value) }));
    console.log(`  [ok] bellwether/${label}: ${points.length} points`);
    return points;
  } catch (err) {
    console.error(`  [err] bellwether/${label}: ${err.message}`);
    return [];
  }
}

async function fetchDbnomics() {
  try {
    const data = await httpsGet(DBNOMICS_URL);
    const series = data.series?.docs?.[0];
    if (!series?.period?.length) throw new Error("empty DBnomics series");

    const points = series.period
      .map((period, i) => ({
        date: `${period}-01`,
        value: parseFloat(series.value[i]),
      }))
      .filter((p) => isValidPmi(p.value));

    console.log(`  [ok] dbnomics: ${points.length} valid points (of ${series.period.length})`);
    return points;
  } catch (err) {
    console.error(`  [err] dbnomics: ${err.message}`);
    return [];
  }
}

async function fetchTradingEconomics(apiKey) {
  if (!apiKey) return [];
  const url = `https://api.tradingeconomics.com/historical/ticker/NAPMPMI?c=${encodeURIComponent(apiKey)}&f=json`;
  try {
    const data = await httpsGet(url);
    const rows = Array.isArray(data) ? data : data.data || [];
    const points = rows
      .filter((r) => r.DateTime || r.Date)
      .map((r) => ({
        date: (r.DateTime || r.Date).slice(0, 10),
        value: parseFloat(r.Value ?? r.Close ?? r.value),
      }))
      .filter((p) => isValidPmi(p.value));
    console.log(`  [ok] tradingeconomics: ${points.length} points`);
    return points;
  } catch (err) {
    console.error(`  [err] tradingeconomics: ${err.message}`);
    return [];
  }
}

async function fetchFredNapm(apiKey) {
  if (!apiKey) return [];
  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=NAPM&api_key=${apiKey}&file_type=json&sort_order=asc&observation_start=1948-01-01`;
  try {
    const data = await httpsGet(url);
    const points = (data.observations || [])
      .filter((o) => o.value !== ".")
      .map((o) => ({ date: o.date, value: parseFloat(o.value) }))
      .filter((p) => isValidPmi(p.value));
    console.log(`  [ok] fred/NAPM: ${points.length} points`);
    return points;
  } catch (err) {
    console.error(`  [err] fred/NAPM: ${err.message}`);
    return [];
  }
}

function loadExisting() {
  if (!fs.existsSync(OUT_PATH)) return [];
  try {
    const doc = readJson(OUT_PATH);
    return (doc.history || doc.data || []).map((d) => ({
      date: d.date,
      value: d.value,
    }));
  } catch {
    return [];
  }
}

function buildDocument(history, sourcesUsed) {
  const sorted = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));
  const latest = sorted[sorted.length - 1];
  const v1m = sorted.length >= 2 ? sorted[sorted.length - 2].value : null;
  const v3m = sorted.length >= 4 ? sorted[sorted.length - 4].value : null;

  return {
    id: "ism",
    updatedAt: new Date().toISOString(),
    source: "ISM via DBnomics + Bellwether historical",
    sourceProvider: "Institute for Supply Management",
    sourceUrls: [
      "https://www.ismworld.org",
      "https://db.nomics.world/ISM/pmi",
      "https://github.com/RealMaxPower/bellwether",
    ],
    unit: "index",
    frequency: "monthly",
    latest: {
      date: latest.date,
      value: latest.value,
      momentum1m: v1m != null ? Math.round((latest.value - v1m) * 10) / 10 : null,
      momentum3m: v3m != null ? Math.round((latest.value - v3m) * 10) / 10 : null,
    },
    history: sorted,
    meta: {
      sourcesUsed,
      pointCount: sorted.length,
      range: sorted.length
        ? { from: sorted[0].date, to: latest.date }
        : null,
      note: "PMI > 50 = expansion, < 50 = contraction. 50 is neutral.",
    },
  };
}

async function fetchIsm() {
  console.log("Fetching ISM Manufacturing PMI...");
  const map = new Map();
  const sourcesUsed = [];

  const teKey = process.env.TRADING_ECONOMICS_API_KEY || "";
  const fredKey = process.env.FRED_API_KEY || "";

  // Priority 1: Trading Economics (highest priority when available)
  const tePoints = await fetchTradingEconomics(teKey);
  if (tePoints.length) {
    mergePoints(map, tePoints, "TradingEconomics", 100);
    sourcesUsed.push("tradingeconomics");
  }

  // Priority 2: DBnomics (free, ISM official on DBnomics)
  const dbPoints = await fetchDbnomics();
  if (dbPoints.length) {
    mergePoints(map, dbPoints, "DBnomics", 80);
    sourcesUsed.push("dbnomics");
  }

  // Priority 3: Bellwether historical baseline
  const [histPoints, waybackPoints] = await Promise.all([
    fetchBellwether(BELLWETHER_HISTORICAL, "historical"),
    fetchBellwether(BELLWETHER_WAYBACK, "wayback"),
  ]);
  if (histPoints.length) {
    mergePoints(map, histPoints, "Bellwether/historical", 50);
    sourcesUsed.push("bellwether-historical");
  }
  if (waybackPoints.length) {
    mergePoints(map, waybackPoints, "Bellwether/wayback", 60);
    sourcesUsed.push("bellwether-wayback");
  }

  // Priority 4: FRED NAPM legacy
  const fredPoints = await fetchFredNapm(fredKey);
  if (fredPoints.length) {
    mergePoints(map, fredPoints, "FRED/NAPM", 40);
    sourcesUsed.push("fred-napm");
  }

  // Do not merge stale local sample data — only real remote sources
  if (map.size === 0) {
    const existing = loadExisting();
    if (existing.length) {
      mergePoints(map, existing, "local-fallback", 5);
      sourcesUsed.push("local-fallback");
    }
  }

  if (map.size === 0) {
    throw new Error("No ISM data could be fetched from any source");
  }

  const history = Array.from(map.values())
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(({ date, value }) => ({ date, value }));

  const doc = buildDocument(history, [...new Set(sourcesUsed)]);
  writeJson(OUT_PATH, doc);
  console.log(
    `  [done] ism.json: ${history.length} points, latest=${doc.latest.value} (${doc.latest.date})`
  );
  return doc;
}

if (require.main === module) {
  fetchIsm().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = { fetchIsm };
