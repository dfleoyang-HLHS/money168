export interface DataPoint {
  date: string;
  value: number;
}

export interface SeriesDocument {
  id: string;
  updatedAt: string;
  source: string;
  unit: string;
  frequency: string;
  latest?: {
    date: string;
    value: number;
    yoy?: number;
    momentum3m?: number;
    growthYoy?: number;
    return6m?: number;
    return12m?: number;
    drawdownFromPeak?: number;
    spread10y3m?: number;
  };
  history?: DataPoint[];
  data?: DataPoint[];
}

export interface IndicatorMeta {
  id: string;
  name: { en: string; zh: string };
  category: string;
  categoryLabel: { en: string; zh: string };
  unit: string;
  source: string;
  sourceSeriesId?: string;
  dataFile: string;
  updateFrequency: string;
  description: { zh: string; en: string };
  detailConfig?: {
    defaultRange: string;
    chartType: string;
    overlays?: string[];
  };
}

export interface IndicatorSummary {
  id: string;
  name: { en: string; zh: string };
  category: string;
  latest: { value: number; unit: string; asOf: string };
  change: { "1d": number | null; "1w": number | null; "1m": number | null };
  trend: "up" | "down" | "flat";
  sparkline: number[];
}

export interface DashboardSummary {
  updatedAt: string;
  indicators: IndicatorSummary[];
  cycle?: {
    estimatedPhase: string;
    phaseLabel: string;
    confidence: string;
  };
}

export interface PhaseFramework {
  id: string;
  order: number;
  name: { en: string; zh: string };
  summary: { zh: string; en: string };
  duration: { avgMonths: number };
  returns: {
    avgRealReturn: number;
    returnType: string;
    returnRank: number;
    primaryDriver: string;
    peakReturnProfile: { zh: string; en: string };
    drivers?: {
      priceContribution: string;
      earningsContribution: string;
      dividendContribution: string;
    };
  };
  earnings: {
    growthLevel: string;
    growthTrend: string;
    epsBehavior: { zh: string; en: string };
  };
  valuation: {
    peBehavior: string;
    riskPremium: string;
    forwardExpectation: { zh: string; en: string };
  };
  investorPsychology: { zh: string; en: string };
  assetClassTendencies: Record<string, string>;
  warningSigns: Array<{ zh: string; en: string }>;
  historicalExamples: Array<{ label: string; market: string; start: string; end: string | null }>;
  ismProfile?: { signal: { zh: string; en: string } };
  cpiProfile?: { signal: { zh: string; en: string } };
}

export interface CycleFramework {
  version: string;
  cycleModel: {
    name: { en: string; zh: string };
    sequence: string[];
    principles: Array<{ id: string; zh: string; en: string }>;
  };
  phases: PhaseFramework[];
  comparisonMatrix: {
    dimensions: Array<{
      id: string;
      label: { zh: string; en: string };
      values: Record<string, number | string>;
      returnTypes?: Record<string, string>;
    }>;
  };
  keyIndicators: Array<{
    id: string;
    name: { en: string; zh: string };
    role: string;
    dataFile: string;
    thresholds: Record<string, number>;
    interpretation: Record<string, Record<string, { zh: string; en: string }>>;
  }>;
  crossSignalMatrix: {
    cells: Record<
      string,
      {
        label: { zh: string; en: string };
        favoredPhases: string[];
        bias: string;
        note: { zh: string; en: string };
      }
    >;
  };
  ui: {
    disclaimer: { zh: string; en: string };
    phaseColors: Record<string, string>;
  };
}

export interface CycleAssessment {
  updatedAt: string;
  ruleSetId: string;
  estimatedPhase: {
    id: string;
    confidence: string;
    label: { zh: string; en: string };
  };
  secondaryPhases: string[];
  scores: Record<string, number>;
  scoreGap: number;
  matchedRules: Array<{
    id: string;
    signal: string;
    interpretation: { zh: string; en: string };
  }>;
  metricsUsed: Record<string, number | boolean | null>;
  crossMatrix: {
    cell: string;
    bonusApplied: Record<string, number> | null;
  };
  dataAvailability: Record<string, boolean>;
  disclaimer: { zh: string; en: string };
}

export interface HistoricalCycle {
  id: string;
  name: string;
  phases: Array<{
    phase: string;
    start: string;
    end: string | null;
    sp500Return: number;
  }>;
}

export type TimeRange = "1M" | "3M" | "6M" | "1Y" | "3Y" | "5Y" | "MAX";
