import fs from "fs";
import path from "path";
import type {
  CycleAssessment,
  CycleFramework,
  DashboardSummary,
  HistoricalCycle,
  IndicatorMeta,
  SeriesDocument,
  TimeRange,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data");

function readJson<T>(relativePath: string): T {
  const fullPath = path.join(DATA_DIR, relativePath);
  const raw = fs.readFileSync(fullPath, "utf8");
  return JSON.parse(raw) as T;
}

export function getIndicatorsMeta(): { indicators: IndicatorMeta[] } {
  return readJson("meta/indicators.json");
}

export function getIndicatorMeta(id: string): IndicatorMeta | undefined {
  return getIndicatorsMeta().indicators.find((i) => i.id === id);
}

export function getDashboardSummary(): DashboardSummary {
  return readJson("dashboard/summary.json");
}

export function getLastUpdated(): {
  globalUpdatedAt: string;
  series: Record<string, { updatedAt: string; status: string }>;
} {
  return readJson("meta/last-updated.json");
}

export function getSeries(id: string): SeriesDocument | null {
  const meta = getIndicatorMeta(id);
  if (!meta) {
    const cycleFramework = getCycleFramework();
    const cycleIndicator = cycleFramework.keyIndicators.find((k) => k.id === id);
    if (cycleIndicator) {
      try {
        return readJson(cycleIndicator.dataFile.replace("data/", ""));
      } catch {
        return null;
      }
    }
    return null;
  }
  try {
    return readJson(meta.dataFile.replace("data/", ""));
  } catch {
    return null;
  }
}

export function getSeriesHistory(id: string): Array<{ date: string; value: number }> {
  const series = getSeries(id);
  if (!series) return [];
  return series.history || series.data || [];
}

export function filterByRange(
  data: Array<{ date: string; value: number }>,
  range: TimeRange
): Array<{ date: string; value: number }> {
  if (range === "MAX" || !data.length) return data;
  const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const latest = new Date(sorted[sorted.length - 1].date);
  const months: Record<TimeRange, number> = {
    "1M": 1,
    "3M": 3,
    "6M": 6,
    "1Y": 12,
    "3Y": 36,
    "5Y": 60,
    MAX: 9999,
  };
  const cutoff = new Date(latest);
  cutoff.setMonth(cutoff.getMonth() - months[range]);
  return sorted.filter((d) => new Date(d.date) >= cutoff);
}

export function getCycleFramework(): CycleFramework {
  return readJson("cycle/framework.json");
}

export function getCycleAssessment(): CycleAssessment {
  return readJson("cycle/current-assessment.json");
}

export function getHistoricalCycles(): { cycles: HistoricalCycle[] } {
  return readJson("cycle/history/us-cycles.json");
}

export function getPhaseById(phaseId: string) {
  return getCycleFramework().phases.find((p) => p.id === phaseId);
}

export function getAllIndicatorIds(): string[] {
  return getIndicatorsMeta().indicators.map((i) => i.id);
}

export function getDisplayHistory(
  id: string
): Array<{ date: string; value: number }> {
  const history = getSeriesHistory(id);
  if (id !== "cpi") return history;

  const sorted = [...history].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  return sorted
    .map((point, i) => {
      if (i < 12) return null;
      const yoy = (point.value / sorted[i - 12].value - 1) * 100;
      return { date: point.date, value: Math.round(yoy * 100) / 100 };
    })
    .filter((d): d is { date: string; value: number } => d != null);
}

export function groupIndicatorsByCategory(): Record<string, IndicatorMeta[]> {
  const indicators = getIndicatorsMeta().indicators;
  return indicators.reduce(
    (acc, ind) => {
      if (!acc[ind.category]) acc[ind.category] = [];
      acc[ind.category].push(ind);
      return acc;
    },
    {} as Record<string, IndicatorMeta[]>
  );
}
