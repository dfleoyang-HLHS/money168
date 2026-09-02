#!/usr/bin/env node
/**
 * Fetch market data from FRED API and update data/series/*.json
 * Requires FRED_API_KEY env var (free at https://fred.stlouisfed.org/docs/api/api_key.html)
 * Falls back to existing data when API key is missing.
 */
const fs = require("fs");
const path = require("path");
const https = require("https");

const ROOT = path.resolve(__dirname, "..");
const DATA = path.join(ROOT, "data");
const SERIES_DIR = path.join(DATA, "series");

const FRED_SERIES = {
  us10y: { id: "DGS10", unit: "%", frequency: "daily" },
  vix: { id: "VIXCLS", unit: "index", frequency: "daily" },
  sp500: { id: "SP500", unit: "index", frequency: "daily" },
  cpi: { id: "CPIAUCSL", unit: "index", frequency: "monthly", yoy: true },
  unemployment: { id: "UNRATE", unit: "%", frequency: "monthly" },
  yield_curve: { id: "T10Y3M", unit: "%", frequency: "daily", field: "spread10y3m" },
};

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function writeJson(p, d) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(d, null, 2) + "\n");
}

function fetchFred(seriesId, apiKey) {
  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=asc&observation_start=2019-01-01`;
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => {
          try {
            const json = JSON.parse(body);
            if (json.error_message) reject(new Error(json.error_message));
            else resolve(json.observations || []);
          } catch (e) {
            reject(e);
          }
        });
      })
      .on("error", reject);
  });
}

function toHistory(observations) {
  return observations
    .filter((o) => o.value !== ".")
    .map((o) => ({ date: o.date, value: parseFloat(o.value) }));
}

function enrichCpi(history) {
  const latest = history[history.length - 1];
  const yoyIdx = history.length - 13;
  const yoy =
    yoyIdx >= 0
      ? ((latest.value / history[yoyIdx].value - 1) * 100)
      : null;
  const mom3 =
    history.length >= 4 && yoy != null
      ? yoy -
        (history.length >= 16
          ? (history[history.length - 4].value / history[history.length - 16].value - 1) * 100
          : yoy)
      : null;
  return {
    ...latest,
    yoy: yoy != null ? Math.round(yoy * 100) / 100 : undefined,
    momentum3m: mom3 != null ? Math.round(mom3 * 100) / 100 : undefined,
  };
}

function enrichSp500(history) {
  const latest = history[history.length - 1];
  const v6 = history.length >= 7 ? history[history.length - 7].value : null;
  const v12 = history.length >= 13 ? history[history.length - 13].value : null;
  const peak = Math.max(...history.slice(-24).map((d) => d.value));
  return {
    date: latest.date,
    value: latest.value,
    return6m: v6 ? latest.value / v6 - 1 : undefined,
    return12m: v12 ? latest.value / v12 - 1 : undefined,
    drawdownFromPeak: peak ? latest.value / peak - 1 : undefined,
  };
}

async function updateSeries(key, config, apiKey) {
  const outPath = path.join(SERIES_DIR, `${key}.json`);
  let existing = null;
  if (fs.existsSync(outPath)) {
    try {
      existing = readJson(outPath);
    } catch {
      /* ignore */
    }
  }

  if (!apiKey) {
    console.log(`  [skip] ${key}: no FRED_API_KEY, keeping existing data`);
    return existing;
  }

  try {
    const observations = await fetchFred(config.id, apiKey);
    const history = toHistory(observations);
    if (!history.length) throw new Error("empty history");

    let latest = {
      date: history[history.length - 1].date,
      value: history[history.length - 1].value,
    };

    if (config.yoy) latest = enrichCpi(history);
    if (key === "sp500") latest = enrichSp500(history);
    if (config.field === "spread10y3m") latest = { date: latest.date, value: latest.value, spread10y3m: latest.value };

    const doc = {
      id: key,
      updatedAt: new Date().toISOString(),
      source: "FRED",
      sourceSeriesId: config.id,
      unit: config.unit,
      frequency: config.frequency,
      latest,
      history,
    };

    writeJson(outPath, doc);
    console.log(`  [ok] ${key}: ${history.length} points, latest=${latest.value}`);
    return doc;
  } catch (err) {
    console.error(`  [err] ${key}: ${err.message}`);
    return existing;
  }
}

async function main() {
  const apiKey = process.env.FRED_API_KEY || "";
  console.log("Fetching FRED data...");
  if (!apiKey) console.log("Warning: FRED_API_KEY not set. Using existing sample data.");

  const status = {};
  for (const [key, config] of Object.entries(FRED_SERIES)) {
    const result = await updateSeries(key, config, apiKey);
    status[key] = {
      updatedAt: result?.updatedAt || new Date().toISOString(),
      status: result ? "ok" : "skipped",
    };
    await new Promise((r) => setTimeout(r, 300));
  }

  // Fetch ISM Manufacturing PMI from DBnomics + Bellwether + optional TE/FRED
  console.log("Fetching ISM PMI...");
  const { fetchIsm } = require("./fetch-ism.js");
  let ismResult = null;
  try {
    ismResult = await fetchIsm();
    status.ism = { updatedAt: ismResult.updatedAt, status: "ok" };
  } catch (err) {
    console.error(`  [err] ism: ${err.message}`);
    const ismPath = path.join(SERIES_DIR, "ism.json");
    if (fs.existsSync(ismPath)) {
      const ism = readJson(ismPath);
      status.ism = { updatedAt: ism.updatedAt, status: "stale" };
    }
  }

  // Auxiliary series derived or preserved
  for (const aux of ["sp500_pe", "sp500_eps"]) {
    const p = path.join(SERIES_DIR, `${aux}.json`);
    if (fs.existsSync(p)) {
      const doc = readJson(p);
      status[aux] = { updatedAt: doc.updatedAt, status: "ok" };
    }
  }

  writeJson(path.join(DATA, "meta/last-updated.json"), {
    globalUpdatedAt: new Date().toISOString(),
    series: status,
  });

  console.log("Running cycle assessment...");
  const { assess } = require("./calculate-cycle-assessment.js");
  assess();

  console.log("Building dashboard summary...");
  require("./build-dashboard-summary.js");

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
