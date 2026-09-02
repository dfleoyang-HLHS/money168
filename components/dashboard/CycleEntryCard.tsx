import Link from "next/link";
import type { CycleAssessment } from "@/lib/types";
import { confidenceLabel, phaseNameZh } from "@/lib/format";

interface CycleEntryCardProps {
  assessment: CycleAssessment;
}

const phaseColors: Record<string, string> = {
  despair: "bg-phase-despair",
  hope: "bg-phase-hope",
  growth: "bg-phase-growth",
  optimism: "bg-phase-optimism",
};

export default function CycleEntryCard({ assessment }: CycleEntryCardProps) {
  const phase = assessment.estimatedPhase.id;
  const ism = assessment.metricsUsed["ism.latest.value"];
  const cpi = assessment.metricsUsed.cpi_yoy;

  return (
    <Link href="/cycle" className="group block lg:col-span-2">
      <article className="card relative overflow-hidden border-accent/30 bg-gradient-to-br from-surface-raised to-surface transition hover:border-accent/60">
        <div className={`absolute left-0 top-0 h-1 w-full ${phaseColors[phase] || "bg-accent"}`} />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg">📊</span>
              <h3 className="text-sm font-medium text-slate-300 group-hover:text-white">
                週期框架
              </h3>
              <span className="badge bg-accent/20 text-accent-muted">Oppenheimer</span>
            </div>
            <p className="mt-2 text-xl font-semibold">
              目前估計：{assessment.estimatedPhase.label.zh}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              信心度：{confidenceLabel(assessment.estimatedPhase.confidence)} ·
              主階段：{phaseNameZh(phase)}
            </p>
          </div>
          <div className="flex gap-4">
            {ism != null && (
              <div className="rounded-lg bg-surface px-4 py-2 text-center">
                <div className="text-xs text-slate-500">ISM</div>
                <div className="text-lg font-semibold tabular-nums">{Number(ism).toFixed(1)}</div>
              </div>
            )}
            {cpi != null && (
              <div className="rounded-lg bg-surface px-4 py-2 text-center">
                <div className="text-xs text-slate-500">CPI YoY</div>
                <div className="text-lg font-semibold tabular-nums">{Number(cpi).toFixed(1)}%</div>
              </div>
            )}
          </div>
        </div>
        <div className="mt-4 text-sm text-accent-muted group-hover:underline">
          查看完整分析 →
        </div>
      </article>
    </Link>
  );
}
