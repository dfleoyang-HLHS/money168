import Link from "next/link";
import type { PhaseFramework } from "@/lib/types";
import { formatPercent, returnTypeLabel } from "@/lib/format";

interface PhaseCardProps {
  phase: PhaseFramework;
  colors: Record<string, string>;
  compact?: boolean;
}

export default function PhaseCard({ phase, colors, compact = false }: PhaseCardProps) {
  const color = colors[phase.id] || "#3b82f6";
  const ret = phase.returns.avgRealReturn;
  const retLabel =
    phase.returns.returnType === "annualized_real"
      ? formatPercent(ret)
      : formatPercent(ret);

  if (compact) {
    return (
      <Link href={`/cycle/phases/${phase.id}`} className="group block">
        <article
          className="card h-full transition hover:shadow-lg"
          style={{ borderTopColor: color, borderTopWidth: 3 }}
        >
          <h3 className="font-semibold" style={{ color }}>
            {phase.name.zh}
          </h3>
          <p className="mt-1 text-xs text-slate-500">{phase.name.en}</p>
          <div className="mt-3 text-2xl font-bold tabular-nums">{retLabel}</div>
          <div className="text-xs text-slate-500">
            平均 {phase.duration.avgMonths} 個月
          </div>
        </article>
      </Link>
    );
  }

  return (
    <article className="card" style={{ borderLeftColor: color, borderLeftWidth: 4 }}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-semibold" style={{ color }}>
            {phase.name.zh}
          </h3>
          <p className="text-sm text-slate-500">{phase.name.en}</p>
        </div>
        <span className="badge bg-surface text-slate-400">
          第 {phase.order} 階段
        </span>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-slate-300">{phase.summary.zh}</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <MetricBox label="平均持續" value={`${phase.duration.avgMonths} 月`} />
        <MetricBox label="平均報酬" value={retLabel} highlight={ret > 0} negative={ret < 0} />
        <MetricBox label="報酬類型" value={returnTypeLabel(phase.returns.returnType)} small />
        <MetricBox label="盈餘成長" value={phase.earnings.growthLevel} small />
        <MetricBox label="風險溢酬" value={phase.valuation.riskPremium} small />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg bg-surface p-3 text-sm">
          <div className="text-xs text-slate-500">估值行為</div>
          <div className="mt-1 text-slate-300">{phase.valuation.peBehavior}</div>
        </div>
        <div className="rounded-lg bg-surface p-3 text-sm">
          <div className="text-xs text-slate-500">投資人心理</div>
          <div className="mt-1 text-slate-300">{phase.investorPsychology.zh}</div>
        </div>
      </div>
    </article>
  );
}

function MetricBox({
  label,
  value,
  highlight,
  negative,
  small,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  negative?: boolean;
  small?: boolean;
}) {
  return (
    <div className="rounded-lg bg-surface p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div
        className={`mt-1 font-semibold ${small ? "text-sm" : "text-lg"} ${
          negative ? "text-red-400" : highlight ? "text-emerald-400" : "text-slate-200"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
