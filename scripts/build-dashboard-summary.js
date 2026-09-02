#!/usr/bin/env node
/**
 * Build dashboard/summary.json from series data
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DATA = path.join(ROOT, "data");

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function writeJson(p, d) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(d, null, 2) + "\n");
}

function getHistory(doc) {
  return doc.history || doc.data || [];
}

function sparkline(history, n = 8) {
  const sorted = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));
  return sorted.slice(-n).map((d) => d.value);
}

function changeOver(history, monthsAgo) {
  const sorted = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));
  if (sorted.length < 2) return null;
  const latest = sorted[sorted.length - 1].value;
  const idx = sorted.length - 1 - monthsAgo;
  if (idx < 0) return null;
  const prev = sorted[idx].value;
  if (prev === 0) return null;
  return (latest - prev) / Math.abs(prev);
}

function trendFromChanges(c1m) {
  if (c1m == null) return "flat";
  if (c1m > 0.005) return "up";
  if (c1m < -0.005) return "down";
  return "flat";
}

function main() {
  const meta = readJson(path.join(DATA, "meta/indicators.json"));
  let assessment = null;
  try {
    assessment = readJson(path.join(DATA, "cycle/current-assessment.json"));
  } catch {
    /* optional */
  }

  const indicators = meta.indicators.map((ind) => {
    const rel = ind.dataFile.replace("data/", "");
    const series = readJson(path.join(DATA, rel));
    const history = getHistory(series);
    const latest = series.latest || history[history.length - 1];
    const c1m = changeOver(history, 1);
    const c1w = changeOver(history, 0);
    const c1d = null;

    let displayValue = latest?.value ?? 0;
    if (ind.id === "cpi" && latest?.yoy != null) displayValue = latest.yoy;

    return {
      id: ind.id,
      name: ind.name,
      category: ind.category,
      latest: {
        value: displayValue,
        unit: ind.unit,
        asOf: latest?.date || new Date().toISOString().slice(0, 10),
      },
      change: { "1d": c1d, "1w": c1w, "1m": c1m },
      trend: trendFromChanges(c1m),
      sparkline: sparkline(history),
    };
  });

  const summary = {
    updatedAt: new Date().toISOString(),
    indicators,
    cycle: assessment
      ? {
          estimatedPhase: assessment.estimatedPhase.id,
          phaseLabel: assessment.estimatedPhase.label.zh,
          confidence: assessment.estimatedPhase.confidence,
        }
      : undefined,
  };

  writeJson(path.join(DATA, "dashboard/summary.json"), summary);
  console.log("Dashboard summary written.");
}

main();
