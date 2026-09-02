export function formatNumber(value: number, decimals = 2): string {
  return value.toLocaleString("zh-TW", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatPercent(value: number, decimals = 2): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${(value * 100).toFixed(decimals)}%`;
}

export function formatPercentPoints(value: number, decimals = 2): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("zh-TW", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function trendLabel(trend: "up" | "down" | "flat"): string {
  if (trend === "up") return "偏多";
  if (trend === "down") return "偏空";
  return "中性";
}

export function trendColor(trend: "up" | "down" | "flat"): string {
  if (trend === "up") return "text-emerald-400";
  if (trend === "down") return "text-red-400";
  return "text-slate-400";
}

export function phaseNameZh(phaseId: string): string {
  const map: Record<string, string> = {
    despair: "絕望",
    hope: "希望",
    growth: "成長",
    optimism: "樂觀",
  };
  return map[phaseId] || phaseId;
}

export function confidenceLabel(confidence: string): string {
  const map: Record<string, string> = {
    high: "高",
    medium: "中",
    low: "低",
  };
  return map[confidence] || confidence;
}

export function signalLabel(signal: string): string {
  const map: Record<string, string> = {
    bullish: "偏多",
    bearish: "偏空",
    caution: "警戒",
    transition: "轉折",
    neutral: "中性",
  };
  return map[signal] || signal;
}

export function signalColor(signal: string): string {
  const map: Record<string, string> = {
    bullish: "text-emerald-400 bg-emerald-400/10",
    bearish: "text-red-400 bg-red-400/10",
    caution: "text-amber-400 bg-amber-400/10",
    transition: "text-blue-400 bg-blue-400/10",
    neutral: "text-slate-400 bg-slate-400/10",
  };
  return map[signal] || "text-slate-400 bg-slate-400/10";
}

export function categoryLabel(category: string): string {
  const map: Record<string, string> = {
    macro_rates: "宏觀利率",
    risk_sentiment: "風險情緒",
    equity: "股市",
    inflation: "通膨",
    manufacturing: "製造業",
    labor: "勞動市場",
  };
  return map[category] || category;
}

export function returnTypeLabel(returnType: string): string {
  const map: Record<string, string> = {
    annualized_real: "年化實質報酬",
    phase_cumulative_real: "階段累計實質報酬",
  };
  return map[returnType] || returnType;
}
