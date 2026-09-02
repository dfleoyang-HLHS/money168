#!/usr/bin/env node
/**
 * Generates realistic sample time series JSON files for the financial dashboard.
 * Run: node scripts/generate-sample-series.js
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "data", "series");

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function round(value, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/** Last day of month as YYYY-MM-DD */
function monthEnd(year, month) {
  const d = new Date(year, month, 0);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** First day of month as YYYY-MM-DD */
function monthStart(year, month) {
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

/** Generate month-end dates for `count` months ending at endYear/endMonth */
function monthEndDates(count, endYear, endMonth) {
  const dates = [];
  let y = endYear;
  let m = endMonth;
  for (let i = 0; i < count; i++) {
    dates.unshift(monthEnd(y, m));
    m -= 1;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
  }
  return dates;
}

/** Generate month-start dates for `count` months ending at endYear/endMonth */
function monthStartDates(count, endYear, endMonth) {
  const dates = [];
  let y = endYear;
  let m = endMonth;
  for (let i = 0; i < count; i++) {
    dates.unshift(monthStart(y, m));
    m -= 1;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
  }
  return dates;
}

function seededNoise(index, amplitude = 1) {
  const x = Math.sin(index * 2.399963229728653) * 0.7 + Math.cos(index * 1.618033988749895) * 0.3;
  return x * amplitude;
}

function buildSeries({
  id,
  source,
  unit,
  frequency,
  dates,
  values,
  latestExtras = {},
}) {
  const history = dates.map((date, i) => ({
    date,
    value: round(values[i], values[i] % 1 === 0 ? 0 : 2),
  }));

  const last = history[history.length - 1];
  const latest = { date: last.date, value: last.value, ...latestExtras };

  return {
    id,
    updatedAt: new Date().toISOString(),
    source,
    unit,
    frequency,
    latest,
    history,
  };
}

function generateUs10y() {
  const dates = monthEndDates(24, 2026, 8);
  const values = dates.map((_, i) => {
    const t = i / (dates.length - 1);
    const base = 1.5 + t * 2.8;
    const cycle = Math.sin(t * Math.PI * 1.2) * 0.6;
    return clamp(base + cycle + seededNoise(i, 0.25), 1.5, 5.0);
  });
  return buildSeries({
    id: "us10y",
    source: "FRED DGS10",
    unit: "%",
    frequency: "daily",
    dates,
    values,
  });
}

function generateVix() {
  const dates = monthEndDates(24, 2026, 8);
  const values = dates.map((_, i) => {
    const t = i / (dates.length - 1);
    const base = 22 - t * 4;
    const spike = Math.exp(-((i - 8) ** 2) / 12) * 8;
    return clamp(base + spike + seededNoise(i, 2.5), 12, 35);
  });
  return buildSeries({
    id: "vix",
    source: "FRED VIXCLS",
    unit: "index",
    frequency: "daily",
    dates,
    values,
  });
}

function generateSp500() {
  const dates = monthEndDates(24, 2026, 8);
  const start = 4000;
  const end = 5450;
  const values = dates.map((_, i) => {
    const t = i / (dates.length - 1);
    const trend = start + (end - start) * (t ** 0.85);
    const pullback = Math.sin(t * Math.PI * 2.5) * 120;
    return clamp(trend + pullback + seededNoise(i, 40), 4000, 5500);
  });

  const last = values[values.length - 1];
  const v6m = values[values.length - 7];
  const v12m = values[0];
  const peak = Math.max(...values.slice(-12));

  return buildSeries({
    id: "sp500",
    source: "FRED SP500",
    unit: "index",
    frequency: "daily",
    dates,
    values,
    latestExtras: {
      return6m: round(last / v6m - 1, 4),
      return12m: round(last / v12m - 1, 4),
      drawdownFromPeak: round(last / peak - 1, 4),
    },
  });
}

function generateCpi() {
  const dates = monthStartDates(60, 2026, 8);
  const start = 258;
  const end = 315.2;
  const values = dates.map((_, i) => {
    const t = i / (dates.length - 1);
    const level = start + (end - start) * t;
    const accel = Math.sin(t * Math.PI) * 8;
    return clamp(level + accel + seededNoise(i, 0.4), 250, 320);
  });

  const last = values[values.length - 1];
  const v12m = values[values.length - 13];
  const v15m = values[values.length - 16];
  const v3m = values[values.length - 4];
  const yoy = (last / v12m - 1) * 100;
  const yoy3mAgo = (v3m / v15m - 1) * 100;

  return buildSeries({
    id: "cpi",
    source: "FRED CPIAUCSL",
    unit: "index",
    frequency: "monthly",
    dates,
    values,
    latestExtras: {
      yoy: round(yoy, 2),
      momentum3m: round(yoy - yoy3mAgo, 2),
    },
  });
}

function generateIsm() {
  const dates = monthStartDates(60, 2026, 8);
  const values = dates.map((_, i) => {
    const t = i / (dates.length - 1);
    const cycle = 50 + Math.sin(t * Math.PI * 2) * 3.5;
    return clamp(cycle + seededNoise(i, 1.2), 45, 55);
  });
  return buildSeries({
    id: "ism",
    source: "ISM",
    unit: "index",
    frequency: "monthly",
    dates,
    values,
  });
}

function generateUnemployment() {
  const dates = monthStartDates(60, 2026, 8);
  const values = dates.map((_, i) => {
    const t = i / (dates.length - 1);
    const base = 6.0 - t * 2.2;
    const bump = Math.exp(-((i - 45) ** 2) / 30) * 0.8;
    return clamp(base + bump + seededNoise(i, 0.15), 3.5, 6.0);
  });
  return buildSeries({
    id: "unemployment",
    source: "FRED UNRATE",
    unit: "%",
    frequency: "monthly",
    dates,
    values,
  });
}

function generateSp500Pe() {
  const dates = monthStartDates(60, 2026, 8);
  const values = dates.map((_, i) => {
    const t = i / (dates.length - 1);
    const base = 18 + t * 5;
    const cycle = Math.sin(t * Math.PI * 1.5) * 2;
    return clamp(base + cycle + seededNoise(i, 0.4), 18, 25);
  });
  return buildSeries({
    id: "sp500_pe",
    source: "placeholder",
    unit: "ratio",
    frequency: "monthly",
    dates,
    values,
  });
}

function generateSp500Eps() {
  const dates = monthStartDates(60, 2026, 8);
  const start = 180;
  const end = 228;
  const values = dates.map((_, i) => {
    const t = i / (dates.length - 1);
    const level = start + (end - start) * (t ** 0.9);
    return clamp(level + seededNoise(i, 1.5), 180, 230);
  });

  const last = values[values.length - 1];
  const v12m = values[values.length - 13];
  const growthYoy = (last / v12m - 1) * 100;

  return buildSeries({
    id: "sp500_eps",
    source: "placeholder",
    unit: "USD",
    frequency: "monthly",
    dates,
    values,
    latestExtras: {
      growthYoy: round(growthYoy, 2),
    },
  });
}

function generateYieldCurve() {
  const dates = monthStartDates(60, 2026, 8);
  const values = dates.map((_, i) => {
    const t = i / (dates.length - 1);
    const inversion = Math.exp(-((i - 35) ** 2) / 80) * -1.2;
    const recovery = t * 1.4;
    return clamp(inversion + recovery + seededNoise(i, 0.15), -0.5, 2.0);
  });

  const last = values[values.length - 1];

  return buildSeries({
    id: "yield_curve",
    source: "FRED T10Y3M",
    unit: "%",
    frequency: "monthly",
    dates,
    values,
    latestExtras: {
      spread10y3m: round(last, 2),
    },
  });
}

const SERIES = [
  { name: "us10y.json", fn: generateUs10y },
  { name: "vix.json", fn: generateVix },
  { name: "sp500.json", fn: generateSp500 },
  { name: "cpi.json", fn: generateCpi },
  { name: "ism.json", fn: generateIsm },
  { name: "unemployment.json", fn: generateUnemployment },
  { name: "sp500_pe.json", fn: generateSp500Pe },
  { name: "sp500_eps.json", fn: generateSp500Eps },
  { name: "yield_curve.json", fn: generateYieldCurve },
];

function main() {
  const created = [];

  for (const { name, fn } of SERIES) {
    const filePath = path.join(OUTPUT_DIR, name);
    const data = fn();
    writeJson(filePath, data);
    created.push({
      file: `data/series/${name}`,
      id: data.id,
      points: data.history.length,
      latest: data.latest,
    });
    console.log(`Created ${name} (${data.history.length} points, latest: ${data.latest.value})`);
  }

  console.log(`\nDone. ${created.length} files written to ${OUTPUT_DIR}`);
  return created;
}

main();
