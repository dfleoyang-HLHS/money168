import type { CycleAssessment } from "./types";
import { getSeriesHistory } from "./data";

export type DerivativeTrend = "improving" | "fading" | "neutral" | "mixed";

export interface DerivativeSnapshot {
  id: "ism" | "cpi";
  title: { zh: string; en: string };
  level: { label: string; value: number | null; unit: string };
  momentum: {
    label: string;
    value: number | null;
    unit: string;
    direction: DerivativeTrend;
  };
  acceleration: {
    label: string;
    value: number | null;
    unit: string;
    direction: DerivativeTrend;
  };
  summary: { zh: string };
  detail: { zh: string };
}

function sortedHistory(history: Array<{ date: string; value: number }>) {
  return [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

function valueAt(history: Array<{ date: string; value: number }>, monthsAgo: number): number | null {
  const sorted = sortedHistory(history);
  const idx = sorted.length - 1 - monthsAgo;
  if (idx < 0) return null;
  return sorted[idx].value;
}

function trendFromDelta(
  value: number | null,
  positiveIsGood: boolean,
  epsilon = 0.05
): DerivativeTrend {
  if (value == null) return "neutral";
  if (Math.abs(value) < epsilon) return "neutral";
  const up = value > 0;
  if (positiveIsGood) return up ? "improving" : "fading";
  return up ? "fading" : "improving";
}

function formatSigned(value: number | null, decimals = 1): string {
  if (value == null) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}`;
}

function ismSummary(
  level: number | null,
  m1: number | null,
  accel: number | null
): { summary: string; detail: string } {
  if (level == null || m1 == null) {
    return {
      summary: "ISM 動能資料不足，無法解讀二階變化。",
      detail: "需至少連續數月的 PMI 序列才能計算動能與加速度。",
    };
  }

  const expanding = level >= 50;
  const levelText = expanding ? "擴張區（≥50）" : "收縮區（<50）";

  if (accel == null) {
    return {
      summary: `ISM 位於${levelText}，近月動能 ${formatSigned(m1)} 點。`,
      detail: "加速度需再多一期資料才能計算。",
    };
  }

  if (expanding && m1 < 0 && accel < 0) {
    return {
      summary: "水準仍在擴張，但近月動能轉弱且加速度為負，偏向成長向希望過渡。",
      detail:
        "這代表 PMI 雖高於 50，但短期趨勢向下，且下跌速度仍在加快（或改善速度在放慢）。週期評估 v2 會提高希望期權重。",
    };
  }
  if (expanding && m1 > 0 && accel > 0) {
    return {
      summary: "擴張中且動能加速向上，偏向成長期。",
      detail: "一階動能為正，且二階變化亦為正，代表景氣改善在加快。",
    };
  }
  if (!expanding && m1 > 0 && accel > 0) {
    return {
      summary: "仍處收縮區，但動能回升且加速度為正，典型希望期轉折。",
      detail: "書中強調「疲弱但開始改善」：絕對水準仍差，但二階變化轉正。",
    };
  }
  if (!expanding && m1 < 0 && accel < 0) {
    return {
      summary: "收縮且動能持續惡化，偏向絕望期風險。",
      detail: "一階與二階皆為負，代表景氣下滑仍在加速。",
    };
  }
  if (!expanding && m1 < 0 && accel > 0) {
    return {
      summary: "仍處收縮，但下跌速度放緩（二階轉正），可能接近底部。",
      detail: "動能仍為負，但加速度轉正，常見於希望期前夕。",
    };
  }

  return {
    summary: `ISM 位於${levelText}；近月動能 ${formatSigned(m1)}，加速度 ${formatSigned(accel)}。`,
    detail: "請結合週期評估觸發規則與 CPI 交叉矩陣綜合判斷，單一指標不足以擇時。",
  };
}

function cpiYoyAt(history: Array<{ date: string; value: number }>, monthsAgoLatest: number): number | null {
  const latest = valueAt(history, monthsAgoLatest);
  const y12 = valueAt(history, monthsAgoLatest + 12);
  if (latest == null || y12 == null) return null;
  return (latest / y12 - 1) * 100;
}

function cpiMomentum3mAt(history: Array<{ date: string; value: number }>, monthsAgoLatest: number): number | null {
  const yoyNow = cpiYoyAt(history, monthsAgoLatest);
  const yoy3m = cpiYoyAt(history, monthsAgoLatest + 3);
  if (yoyNow == null || yoy3m == null) return null;
  return yoyNow - yoy3m;
}

function cpiSummary(yoy: number | null, m3: number | null, accel: number | null): { summary: string; detail: string } {
  if (yoy == null || m3 == null) {
    return {
      summary: "CPI 動能資料不足，無法完整解讀通膨趨勢。",
      detail: "需足夠長的 CPI 序列以計算年增率及其變化。",
    };
  }

  if (accel == null) {
    return {
      summary: `CPI 年增 ${yoy.toFixed(1)}%，近 3 個月年增率變化 ${formatSigned(m3, 2)} 百分點。`,
      detail: "通膨「加速度」需再多一期資料；正值代表通膨趨勢在加快，負值代表回落趨勢在加深。",
    };
  }

  if (m3 < -0.2 && accel < 0) {
    return {
      summary: "通膨回落趨勢延續且仍在加深，有利政策轉向預期。",
      detail: "一階（3 個月年增率變化）為負，二階亦為負，代表 disinflation 在加速。",
    };
  }
  if (m3 < 0 && accel > 0) {
    return {
      summary: "通膨仍高於前期趨勢，但回落速度開始放緩。",
      detail: "一階為負但二階轉正：通膨壓力仍在緩和，但緩和幅度可能趨平。",
    };
  }
  if (m3 > 0.3 && accel > 0) {
    return {
      summary: "通膨趨勢再加速，提高緊縮與波動風險。",
      detail: "年增率變化轉正且加速度為正，需警惕樂觀/絕望兩端的政策風險。",
    };
  }

  return {
    summary: `CPI 年增 ${yoy.toFixed(1)}%；3 個月動能 ${formatSigned(m3, 2)} pp，加速度 ${formatSigned(accel, 2)} pp。`,
    detail: "週期引擎以 3 個月年增率變化為通膨動能；二階變化用於判斷回落或再加速是否在加強。",
  };
}

export function buildIsmDerivativeSnapshot(
  metrics: CycleAssessment["metricsUsed"]
): DerivativeSnapshot | null {
  const level = metrics["ism.latest.value"] as number | null | undefined;
  const m1 = metrics.ism_momentum_1m as number | null | undefined;
  const accel = metrics.ism_acceleration as number | null | undefined;
  if (level == null && m1 == null) return null;

  const lv = level ?? null;
  const mom = m1 ?? null;
  const acc = accel ?? null;
  const { summary, detail } = ismSummary(lv, mom, acc);

  return {
    id: "ism",
    title: { zh: "ISM 製造業 PMI", en: "ISM Manufacturing PMI" },
    level: { label: "最新水準", value: lv, unit: "index" },
    momentum: {
      label: "一階：近 1 個月變化",
      value: mom,
      unit: "點",
      direction: trendFromDelta(mom, true),
    },
    acceleration: {
      label: "二階：動能加速度",
      value: acc,
      unit: "點",
      direction: trendFromDelta(acc, true),
    },
    summary: { zh: summary },
    detail: { zh: detail },
  };
}

export function buildCpiDerivativeSnapshot(
  metrics: CycleAssessment["metricsUsed"]
): DerivativeSnapshot | null {
  const yoy = metrics.cpi_yoy as number | null | undefined;
  const m3 = metrics.cpi_momentum_3m as number | null | undefined;
  if (yoy == null && m3 == null) return null;

  const history = getSeriesHistory("cpi");
  const accFromMetrics = metrics.cpi_acceleration as number | null | undefined;
  const m3Prev = history.length ? cpiMomentum3mAt(history, 1) : null;
  const acc =
    accFromMetrics != null
      ? accFromMetrics
      : m3 != null && m3Prev != null
        ? m3 - m3Prev
        : null;

  const { summary, detail } = cpiSummary(yoy ?? null, m3 ?? null, acc);

  return {
    id: "cpi",
    title: { zh: "CPI 年增率", en: "CPI YoY" },
    level: { label: "年增率", value: yoy ?? null, unit: "%" },
    momentum: {
      label: "一階：3 個月年增率變化",
      value: m3 ?? null,
      unit: "百分點",
      direction: trendFromDelta(m3 ?? null, false),
    },
    acceleration: {
      label: "二階：通膨動能加速度",
      value: acc,
      unit: "百分點",
      direction: trendFromDelta(acc ?? null, false),
    },
    summary: { zh: summary },
    detail: { zh: detail },
  };
}

export function getDerivativeSnapshots(assessment: CycleAssessment): DerivativeSnapshot[] {
  const items: DerivativeSnapshot[] = [];
  const ism = buildIsmDerivativeSnapshot(assessment.metricsUsed);
  const cpi = buildCpiDerivativeSnapshot(assessment.metricsUsed);
  if (ism) items.push(ism);
  if (cpi) items.push(cpi);
  return items;
}

export function trendBadge(trend: DerivativeTrend): { label: string; className: string } {
  switch (trend) {
    case "improving":
      return { label: "動能偏多", className: "text-emerald-400 bg-emerald-400/10" };
    case "fading":
      return { label: "動能偏空", className: "text-amber-400 bg-amber-400/10" };
    case "mixed":
      return { label: "方向分歧", className: "text-blue-400 bg-blue-400/10" };
    default:
      return { label: "中性", className: "text-slate-400 bg-slate-500/10" };
  }
}

export function formatDerivativeValue(value: number | null, unit: string): string {
  if (value == null) return "—";
  if (unit === "%") return `${value.toFixed(2)}%`;
  if (unit === "百分點") return `${formatSigned(value, 2)} pp`;
  if (unit === "點") return `${formatSigned(value, 1)} 點`;
  if (unit === "index") return value.toFixed(1);
  return String(value);
}
