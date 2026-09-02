import type { CycleAssessment } from "@/lib/types";
import { confidenceLabel, phaseNameZh, signalColor, signalLabel } from "@/lib/format";

interface AssessmentPanelProps {
  assessment: CycleAssessment;
}

const phaseColors: Record<string, string> = {
  despair: "text-phase-despair border-phase-despair",
  hope: "text-phase-hope border-phase-hope",
  growth: "text-phase-growth border-phase-growth",
  optimism: "text-phase-optimism border-phase-optimism",
};

const barColors: Record<string, string> = {
  despair: "#8B0000",
  hope: "#2E8B57",
  growth: "#1E90FF",
  optimism: "#DAA520",
};

export default function AssessmentPanel({ assessment }: AssessmentPanelProps) {
  const maxScore = Math.max(...Object.values(assessment.scores));

  return (
    <div className="card space-y-6">
      <div>
        <h2 className="text-lg font-semibold">週期位置評估</h2>
        <p className="mt-1 text-sm text-slate-400">
          規則引擎 {assessment.ruleSetId.replace("oppenheimer_cycle_", "v")} · 更新於 {new Date(assessment.updatedAt).toLocaleString("zh-TW")}
        </p>
      </div>

      <div className="rounded-lg border border-surface-border bg-surface p-4">
        <div className="text-sm text-slate-400">目前估計</div>
        <div className="mt-1 text-2xl font-bold">{assessment.estimatedPhase.label.zh}</div>
        <div className="mt-2 flex gap-2">
          <span
            className={`badge border ${phaseColors[assessment.estimatedPhase.id] || ""}`}
          >
            {phaseNameZh(assessment.estimatedPhase.id)}
          </span>
          <span className="badge bg-slate-700 text-slate-300">
            信心度：{confidenceLabel(assessment.estimatedPhase.confidence)}
          </span>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium text-slate-300">階段評分</h3>
        <div className="space-y-2">
          {(["despair", "hope", "growth", "optimism"] as const).map((phase) => {
            const score = assessment.scores[phase] || 0;
            const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
            return (
              <div key={phase} className="flex items-center gap-3">
                <div className="w-12 text-sm text-slate-400">{phaseNameZh(phase)}</div>
                <div className="flex-1">
                  <div className="h-2 overflow-hidden rounded-full bg-surface">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: barColors[phase] }}
                    />
                  </div>
                </div>
                <div className="w-8 text-right text-sm tabular-nums text-slate-300">{score}</div>
              </div>
            );
          })}
        </div>
      </div>

      {assessment.matchedRules.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-medium text-slate-300">觸發規則</h3>
          <ul className="space-y-2">
            {assessment.matchedRules.map((rule) => (
              <li
                key={rule.id}
                className="rounded-lg border border-surface-border bg-surface p-3 text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className={`badge ${signalColor(rule.signal)}`}>
                    {signalLabel(rule.signal)}
                  </span>
                  <span className="font-mono text-xs text-slate-500">{rule.id}</span>
                </div>
                <p className="mt-2 text-slate-300">{rule.interpretation.zh}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-slate-500">{assessment.disclaimer.zh}</p>
    </div>
  );
}
