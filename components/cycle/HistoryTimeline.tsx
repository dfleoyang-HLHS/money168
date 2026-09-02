import type { HistoricalCycle } from "@/lib/types";
import { formatPercent, phaseNameZh } from "@/lib/format";

interface HistoryTimelineProps {
  cycles: HistoricalCycle[];
  phaseColors: Record<string, string>;
}

export default function HistoryTimeline({ cycles, phaseColors }: HistoryTimelineProps) {
  return (
    <div className="card">
      <h2 className="mb-4 text-lg font-semibold">歷史週期回放</h2>
      <div className="space-y-6">
        {cycles.map((cycle) => (
          <div key={cycle.id}>
            <h3 className="font-medium text-slate-200">{cycle.name}</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {cycle.phases.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className="rounded-lg border border-surface-border px-3 py-2 text-sm"
                    style={{ borderLeftColor: phaseColors[p.phase], borderLeftWidth: 3 }}
                  >
                    <div className="font-medium" style={{ color: phaseColors[p.phase] }}>
                      {phaseNameZh(p.phase)}
                    </div>
                    <div className="text-xs text-slate-500">
                      {p.start} → {p.end || "進行中"}
                    </div>
                    <div
                      className={`text-xs tabular-nums ${
                        p.sp500Return >= 0 ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      S&P {formatPercent(p.sp500Return)}
                    </div>
                  </div>
                  {i < cycle.phases.length - 1 && (
                    <span className="text-slate-600">→</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
