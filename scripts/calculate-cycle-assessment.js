#!/usr/bin/env node
/**
 * Oppenheimer cycle assessment engine (v2 — ISM second derivative)
 *
 * Reads:
 *   - data/cycle/assessment-rules.v2.json
 *   - data/series/*.json
 *
 * Writes:
 *   - data/cycle/current-assessment.json
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
const RULES_PATH = path.join(DATA_DIR, "cycle", "assessment-rules.v2.json");
const OUTPUT_PATH = path.join(DATA_DIR, "cycle", "current-assessment.json");

const PHASES = ["despair", "hope", "growth", "optimism"];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
}

function getHistoryValue(history, monthsAgo, field = "value") {
  if (!Array.isArray(history) || history.length === 0) return null;
  const sorted = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));
  const idx = sorted.length - 1 - monthsAgo;
  if (idx < 0) return null;
  return sorted[idx][field];
}

function latestFromSeries(seriesDoc) {
  if (!seriesDoc) return null;
  if (seriesDoc.latest?.value != null) return seriesDoc.latest.value;
  const history = seriesDoc.history || seriesDoc.data || [];
  if (!history.length) return null;
  const sorted = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));
  return sorted[sorted.length - 1].value;
}

function percentileRank(value, values) {
  const sorted = [...values].filter((v) => v != null).sort((a, b) => a - b);
  if (!sorted.length || value == null) return null;
  const below = sorted.filter((v) => v <= value).length;
  return (below / sorted.length) * 100;
}

function loadSeries(relativePath) {
  const fullPath = path.join(DATA_DIR, relativePath);
  if (!fs.existsSync(fullPath)) return null;
  return readJson(fullPath);
}

function buildMetrics() {
  const ism = loadSeries("series/ism.json");
  const cpi = loadSeries("series/cpi.json");
  const sp500 = loadSeries("series/sp500.json");
  const sp500Pe = loadSeries("series/sp500_pe.json");
  const sp500Eps = loadSeries("series/sp500_eps.json");
  const unemployment = loadSeries("series/unemployment.json");
  const yieldCurve = loadSeries("series/yield_curve.json");

  const metrics = {};

  if (ism) {
    const history = ism.history || ism.data || [];
    const latest = latestFromSeries(ism);
    const v1m = getHistoryValue(history, 1);
    const v2m = getHistoryValue(history, 2);
    const v3m = getHistoryValue(history, 3);
    metrics["ism.latest.value"] = latest;
    metrics.ism_momentum_1m = latest != null && v1m != null ? latest - v1m : null;
    metrics.ism_momentum_1m_prev = v1m != null && v2m != null ? v1m - v2m : null;
    metrics.ism_momentum_3m = latest != null && v3m != null ? latest - v3m : null;
    metrics.ism_acceleration =
      metrics.ism_momentum_1m != null && metrics.ism_momentum_1m_prev != null
        ? metrics.ism_momentum_1m - metrics.ism_momentum_1m_prev
        : null;
  }

  if (cpi) {
    const history = cpi.history || cpi.data || [];
    const latest = latestFromSeries(cpi);
    const v12m = getHistoryValue(history, 12);
    const yoyNow = latest != null && v12m != null ? (latest / v12m - 1) * 100 : cpi.latest?.yoy ?? null;
    const yoy3mAgoBase = getHistoryValue(history, 15);
    const yoy3mAgoLatest = getHistoryValue(history, 3);
    const yoy3mAgo =
      yoy3mAgoLatest != null && yoy3mAgoBase != null
        ? (yoy3mAgoLatest / yoy3mAgoBase - 1) * 100
        : null;
    metrics.cpi_yoy = yoyNow;
    metrics.cpi_momentum_3m =
      yoyNow != null && yoy3mAgo != null ? yoyNow - yoy3mAgo : cpi.latest?.momentum3m ?? null;
  }

  if (sp500Pe) {
    const history = sp500Pe.history || sp500Pe.data || [];
    const latest = latestFromSeries(sp500Pe);
    const values = history.map((d) => d.value).slice(-120);
    metrics.pe_percentile_10y = percentileRank(latest, values);
  }

  if (sp500Eps) {
    const history = sp500Eps.history || sp500Eps.data || [];
    const latest = latestFromSeries(sp500Eps);
    const v12m = getHistoryValue(history, 12);
    const v18m = getHistoryValue(history, 18);
    metrics.eps_growth_yoy =
      latest != null && v12m != null ? (latest / v12m - 1) * 100 : sp500Eps.latest?.growthYoy ?? null;
    const yoy6mAgo =
      v12m != null && v18m != null ? (v12m / v18m - 1) * 100 : null;
    if (metrics.eps_growth_yoy != null && yoy6mAgo != null) {
      const diff = metrics.eps_growth_yoy - yoy6mAgo;
      metrics.eps_growth_trend = diff > 0.5 ? 1 : diff < -0.5 ? -1 : 0;
    } else {
      metrics.eps_growth_trend = sp500Eps.latest?.growthTrend ?? null;
    }
  }

  if (sp500) {
    const history = sp500.history || sp500.data || [];
    const latest = latestFromSeries(sp500);
    const v6m = getHistoryValue(history, 6);
    const v12m = getHistoryValue(history, 12);
    metrics.return_6m = latest != null && v6m != null ? latest / v6m - 1 : sp500.latest?.return6m ?? null;
    metrics.return_12m = latest != null && v12m != null ? latest / v12m - 1 : sp500.latest?.return12m ?? null;
    const recent = history.slice(-24).map((d) => d.value);
    const peak = recent.length ? Math.max(...recent) : null;
    metrics.drawdown_from_peak =
      latest != null && peak != null ? latest / peak - 1 : sp500.latest?.drawdownFromPeak ?? null;
  }

  if (unemployment) {
    const history = unemployment.history || unemployment.data || [];
    const latest = latestFromSeries(unemployment);
    const v3m = getHistoryValue(history, 3);
    metrics.unemployment_level = latest;
    metrics.unemployment_rising_from_low =
      latest != null && v3m != null ? latest < 4.5 && latest - v3m > 0.2 : false;
  }

  if (yieldCurve) {
    const latest = yieldCurve.latest?.spread10y3m ?? latestFromSeries(yieldCurve);
    metrics.spread_10y_3m = latest;
    metrics.curve_inverted = latest != null ? latest < 0 : false;
  }

  return metrics;
}

function getMetricValue(metric, metrics) {
  if (metric in metrics) return metrics[metric];
  return null;
}

function compare(value, op, target) {
  if (value == null) return false;
  switch (op) {
    case "gt":
      return value > target;
    case "gte":
      return value >= target;
    case "lt":
      return value < target;
    case "lte":
      return value <= target;
    case "eq":
      return value === target;
    default:
      return false;
  }
}

function evaluateCondition(condition, metrics) {
  if (condition.all) {
    return condition.all.every((c) => evaluateLeaf(c, metrics));
  }
  return evaluateLeaf(condition, metrics);
}

function evaluateLeaf(condition, metrics) {
  const value = getMetricValue(condition.metric, metrics);
  if (condition.gt != null) return compare(value, "gt", condition.gt);
  if (condition.gte != null) return compare(value, "gte", condition.gte);
  if (condition.lt != null) return compare(value, "lt", condition.lt);
  if (condition.lte != null) return compare(value, "lte", condition.lte);
  if (condition.eq != null) return compare(value, "eq", condition.eq);
  return false;
}

function applyScores(scores, totals) {
  for (const [phase, points] of Object.entries(scores)) {
    totals[phase] = (totals[phase] || 0) + points;
  }
}

function assess() {
  const rulesDoc = readJson(RULES_PATH);
  const metrics = buildMetrics();
  const scores = Object.fromEntries(PHASES.map((p) => [p, 0]));
  const matchedRules = [];

  const sortedRules = [...rulesDoc.scoring.rules].sort((a, b) => b.priority - a.priority);
  for (const rule of sortedRules) {
    if (evaluateCondition(rule.when, metrics)) {
      applyScores(rule.scores, scores);
      matchedRules.push({
        id: rule.id,
        signal: rule.signal,
        interpretation: rule.interpretation
      });
    }
  }

  const cross = rulesDoc.crossMatrixBonus;
  const ismRising = metrics.ism_momentum_1m != null && metrics.ism_momentum_1m > 0;
  const cpiFalling = metrics.cpi_momentum_3m != null && metrics.cpi_momentum_3m < 0;
  const crossKey = `${ismRising ? "ism_rising" : "ism_falling"}__${cpiFalling ? "cpi_falling" : "cpi_rising"}`;
  const crossBonus = cross.lookup[crossKey];
  if (crossBonus) applyScores(crossBonus, scores);

  const ranked = PHASES.map((phase) => ({ phase, score: scores[phase] })).sort(
    (a, b) => b.score - a.score
  );
  const top = ranked[0];
  const second = ranked[1];
  const scoreGap = top.score - second.score;

  let confidence = "low";
  if (scoreGap >= 20 && matchedRules.length >= 4) confidence = "high";
  else if (scoreGap >= 10 && matchedRules.length >= 2) confidence = "medium";

  const hasOnlyCore =
    metrics["ism.latest.value"] != null &&
    metrics.cpi_yoy != null &&
    metrics.pe_percentile_10y == null &&
    metrics.eps_growth_yoy == null;
  if (hasOnlyCore && confidence === "high") confidence = "medium";

  const phaseOrder = { despair: 1, hope: 2, growth: 3, optimism: 4 };
  const adjacent =
    Math.abs(phaseOrder[top.phase] - phaseOrder[second.phase]) === 1 &&
    second.score >= top.score * 0.85;

  const framework = fs.existsSync(path.join(DATA_DIR, "cycle", "framework.json"))
    ? readJson(path.join(DATA_DIR, "cycle", "framework.json"))
    : null;
  const phaseName = (id) =>
    framework?.phases?.find((p) => p.id === id)?.name?.zh || id;

  const label = adjacent
    ? `${phaseName(top.phase)} → ${phaseName(second.phase)} 過渡期`
    : phaseName(top.phase);

  const output = {
    updatedAt: new Date().toISOString(),
    ruleSetId: rulesDoc.ruleSetId,
    estimatedPhase: {
      id: top.phase,
      confidence,
      label: { zh: label, en: `${top.phase}${adjacent ? ` → ${second.phase}` : ""}` }
    },
    secondaryPhases: ranked
      .slice(1)
      .filter((r) => r.score >= top.score * 0.85)
      .map((r) => r.phase),
    scores,
    scoreGap,
    matchedRules,
    metricsUsed: metrics,
    crossMatrix: {
      cell: crossKey,
      bonusApplied: crossBonus || null
    },
    dataAvailability: {
      ism: metrics["ism.latest.value"] != null,
      cpi: metrics.cpi_yoy != null,
      valuation: metrics.pe_percentile_10y != null,
      earnings: metrics.eps_growth_yoy != null,
      market: metrics.return_12m != null
    },
    disclaimer: rulesDoc.exampleOutput.disclaimer
  };

  writeJson(OUTPUT_PATH, output);
  console.log(`Assessment written to ${OUTPUT_PATH}`);
  console.log(`Estimated phase: ${top.phase} (${confidence})`);
  return output;
}

if (require.main === module) {
  assess();
}

module.exports = { assess, buildMetrics, evaluateCondition };
