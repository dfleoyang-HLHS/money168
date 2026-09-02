import CyclePhaseBar from "@/components/cycle/CyclePhaseBar";
import AssessmentPanel from "@/components/cycle/AssessmentPanel";
import CrossMatrix from "@/components/cycle/CrossMatrix";
import PhaseCard from "@/components/cycle/PhaseCard";
import HistoryTimeline from "@/components/cycle/HistoryTimeline";
import Link from "next/link";
import {
  getCycleFramework,
  getCycleAssessment,
  getHistoricalCycles,
} from "@/lib/data";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-static";

export default function CycleOverviewPage() {
  const framework = getCycleFramework();
  const assessment = getCycleAssessment();
  const history = getHistoricalCycles();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold">週期框架</h1>
        <p className="mt-2 text-slate-400">
          基於 Peter Oppenheimer《進場的訊號》· 四階段股票週期模型
        </p>
      </header>

      <CyclePhaseBar
        framework={framework}
        currentPhase={assessment.estimatedPhase.id}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <AssessmentPanel assessment={assessment} />
        <CrossMatrix
          framework={framework}
          activeCell={assessment.crossMatrix?.cell}
        />
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">關鍵指標</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {framework.keyIndicators.map((ind) => (
            <Link key={ind.id} href={`/cycle/indicators/${ind.id}`} className="group">
              <article className="card transition hover:border-accent/50">
                <h3 className="font-medium group-hover:text-white">{ind.name.zh}</h3>
                <p className="mt-1 text-sm text-slate-400">{ind.name.en}</p>
                <p className="mt-2 text-xs text-slate-500">
                  角色：{ind.role === "growth_momentum" ? "成長動能" : "通膨/政策"}
                </p>
                <span className="mt-3 inline-block text-sm text-accent-muted group-hover:underline">
                  查看詳情 →
                </span>
              </article>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">四階段速覽</h2>
          <Link href="/cycle/phases" className="text-sm text-accent-muted hover:underline">
            查看完整圖鑑 →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {framework.phases.map((phase) => (
            <PhaseCard
              key={phase.id}
              phase={phase}
              colors={framework.ui.phaseColors}
              compact
            />
          ))}
        </div>
      </section>

      <HistoryTimeline cycles={history.cycles} phaseColors={framework.ui.phaseColors} />

      <section className="card">
        <h2 className="text-lg font-semibold">框架原則</h2>
        <ul className="mt-4 space-y-2">
          {framework.cycleModel.principles.map((p) => (
            <li key={p.id} className="flex gap-2 text-sm text-slate-300">
              <span className="text-accent">•</span>
              {p.zh}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-slate-500">
          評估更新：{formatDateTime(assessment.updatedAt)}
        </p>
      </section>
    </div>
  );
}
