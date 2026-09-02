import { notFound } from "next/navigation";
import Link from "next/link";
import { getCycleFramework, getPhaseById } from "@/lib/data";
import { formatPercent, phaseNameZh, returnTypeLabel } from "@/lib/format";

export function generateStaticParams() {
  const framework = getCycleFramework();
  return framework.cycleModel.sequence.map((id) => ({ phase: id }));
}

export default function PhaseDetailPage({
  params,
}: {
  params: { phase: string };
}) {
  const phase = getPhaseById(params.phase);
  if (!phase) notFound();

  const framework = getCycleFramework();
  const color = framework.ui.phaseColors[phase.id] || "#3b82f6";

  return (
    <div className="space-y-8">
      <nav className="text-sm text-slate-400">
        <Link href="/cycle" className="hover:text-white">
          週期框架
        </Link>
        <span className="mx-2">/</span>
        <Link href="/cycle/phases" className="hover:text-white">
          四階段圖鑑
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-200">{phase.name.zh}</span>
      </nav>

      <header>
        <div
          className="inline-block rounded-lg px-3 py-1 text-sm font-medium"
          style={{ backgroundColor: `${color}22`, color }}
        >
          第 {phase.order} 階段
        </div>
        <h1 className="mt-3 text-3xl font-bold" style={{ color }}>
          {phase.name.zh}
        </h1>
        <p className="mt-1 text-slate-400">{phase.name.en}</p>
        <p className="mt-4 max-w-2xl text-slate-300">{phase.summary.zh}</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="平均持續"
          value={`${phase.duration.avgMonths} 個月`}
        />
        <StatCard
          label="平均報酬"
          value={formatPercent(phase.returns.avgRealReturn)}
          sub={returnTypeLabel(phase.returns.returnType)}
          highlight={phase.returns.avgRealReturn > 0}
          negative={phase.returns.avgRealReturn < 0}
        />
        <StatCard label="報酬爆發力排名" value={`第 ${phase.returns.returnRank} 名`} />
        <StatCard label="盈餘成長" value={phase.earnings.growthLevel} />
        <StatCard label="盈餘趨勢" value={phase.earnings.growthTrend} />
        <StatCard label="估值行為" value={phase.valuation.peBehavior} />
        <StatCard label="風險溢酬" value={phase.valuation.riskPremium} />
        <StatCard label="報酬驅動" value={phase.returns.primaryDriver} />
        <StatCard
          label="預期未來效益"
          value={phase.valuation.forwardExpectation.zh}
          wide
        />
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold">報酬結構</h2>
        <p className="mt-2 text-sm text-slate-300">{phase.returns.peakReturnProfile.zh}</p>
        {phase.returns.drivers && (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-surface p-3 text-sm">
              <div className="text-slate-500">股價貢獻</div>
              <div>{phase.returns.drivers.priceContribution}</div>
            </div>
            <div className="rounded-lg bg-surface p-3 text-sm">
              <div className="text-slate-500">盈餘貢獻</div>
              <div>{phase.returns.drivers.earningsContribution}</div>
            </div>
            <div className="rounded-lg bg-surface p-3 text-sm">
              <div className="text-slate-500">股息貢獻</div>
              <div>{phase.returns.drivers.dividendContribution}</div>
            </div>
          </div>
        )}
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold">投資人心理</h2>
        <p className="mt-2 text-slate-300">{phase.investorPsychology.zh}</p>
      </section>

      {phase.ismProfile && phase.cpiProfile && (
        <section className="card">
          <h2 className="text-lg font-semibold">ISM / CPI 典型 profile</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-surface p-4">
              <h3 className="text-sm font-medium text-slate-400">ISM</h3>
              <p className="mt-2 text-sm text-slate-300">{phase.ismProfile.signal.zh}</p>
            </div>
            <div className="rounded-lg bg-surface p-4">
              <h3 className="text-sm font-medium text-slate-400">CPI</h3>
              <p className="mt-2 text-sm text-slate-300">{phase.cpiProfile.signal.zh}</p>
            </div>
          </div>
        </section>
      )}

      <section className="card">
        <h2 className="text-lg font-semibold">資產類別表現傾向</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {Object.entries(phase.assetClassTendencies).map(([asset, tendency]) => (
            <span key={asset} className="badge bg-surface text-slate-300">
              {asset}: {tendency}
            </span>
          ))}
        </div>
      </section>

      {phase.warningSigns.length > 0 && (
        <section className="card border-amber-500/30">
          <h2 className="text-lg font-semibold text-amber-400">警戒訊號</h2>
          <ul className="mt-3 space-y-2">
            {phase.warningSigns.map((w, i) => (
              <li key={i} className="text-sm text-slate-300">
                • {w.zh}
              </li>
            ))}
          </ul>
        </section>
      )}

      {phase.historicalExamples.length > 0 && (
        <section className="card">
          <h2 className="text-lg font-semibold">歷史實例</h2>
          <div className="mt-4 space-y-2">
            {phase.historicalExamples.map((ex) => (
              <div
                key={ex.label}
                className="flex items-center justify-between rounded-lg bg-surface px-4 py-3 text-sm"
              >
                <span>{ex.label}</span>
                <span className="text-slate-500">
                  {ex.start} → {ex.end || "進行中"}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="flex gap-4">
        {framework.cycleModel.sequence.map((id) => (
          <Link
            key={id}
            href={`/cycle/phases/${id}`}
            className={`text-sm ${
              id === phase.id ? "font-semibold text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            {phaseNameZh(id)}
          </Link>
        ))}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  highlight,
  negative,
  wide,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
  negative?: boolean;
  wide?: boolean;
}) {
  return (
    <div className={`card ${wide ? "sm:col-span-2 lg:col-span-3" : ""}`}>
      <div className="text-xs text-slate-500">{label}</div>
      <div
        className={`mt-1 font-semibold ${wide ? "text-base" : "text-xl"} ${
          negative ? "text-red-400" : highlight ? "text-emerald-400" : "text-slate-100"
        }`}
      >
        {value}
      </div>
      {sub && <div className="mt-1 text-xs text-slate-500">{sub}</div>}
    </div>
  );
}
