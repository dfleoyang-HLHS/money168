import { notFound } from "next/navigation";
import Link from "next/link";
import TimeSeriesChart from "@/components/charts/TimeSeriesChart";
import { getCycleFramework, getDisplayHistory } from "@/lib/data";

const validIds = ["ism", "cpi"];

export function generateStaticParams() {
  return validIds.map((id) => ({ id }));
}

export default function CycleIndicatorPage({
  params,
}: {
  params: { id: string };
}) {
  if (!validIds.includes(params.id)) notFound();

  const framework = getCycleFramework();
  const indicator = framework.keyIndicators.find((k) => k.id === params.id);
  if (!indicator) notFound();

  const history = getDisplayHistory(params.id);
  const refLine = params.id === "ism" ? 50 : undefined;
  const refLabel = params.id === "ism" ? "擴張/收縮線 (50)" : undefined;

  const levelInterp = indicator.interpretation?.level;
  const momentumInterp = indicator.interpretation?.momentum;

  return (
    <div className="space-y-6">
      <nav className="text-sm text-slate-400">
        <Link href="/cycle" className="hover:text-white">
          週期框架
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-200">{indicator.name.zh}</span>
      </nav>

      <header>
        <span className="badge bg-accent/20 text-accent-muted">關鍵指標</span>
        <h1 className="mt-2 text-3xl font-bold">{indicator.name.zh}</h1>
        <p className="mt-1 text-slate-400">{indicator.name.en}</p>
        <p className="mt-3 text-sm text-slate-300">
          角色：{indicator.role === "growth_momentum" ? "成長動能觀察" : "通膨與政策觀察"}
        </p>
      </header>

      <section className="card">
        <h2 className="mb-4 text-lg font-semibold">數據曲線</h2>
        <TimeSeriesChart
          data={history}
          unit={params.id === "cpi" ? "%" : "index"}
          defaultRange={params.id === "ism" ? "3Y" : "5Y"}
          referenceLine={refLine}
          referenceLabel={refLabel}
          color={params.id === "ism" ? "#34d399" : "#a78bfa"}
        />
        <Link
          href={`/indicators/${params.id}`}
          className="mt-4 inline-block text-sm text-accent-muted hover:underline"
        >
          在指標總覽中查看 →
        </Link>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {levelInterp && (
          <section className="card">
            <h3 className="font-semibold">水準解讀</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              {Object.entries(levelInterp).map(([key, val]) => (
                <li key={key}>
                  <span className="text-slate-500">{key}: </span>
                  {val.zh}
                </li>
              ))}
            </ul>
          </section>
        )}
        {momentumInterp && (
          <section className="card">
            <h3 className="font-semibold">動能解讀（二階變化）</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              {Object.entries(momentumInterp).map(([key, val]) => (
                <li key={key}>
                  <span className="text-slate-500">{key}: </span>
                  {val.zh}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {indicator.thresholds && (
        <section className="card">
          <h3 className="font-semibold">參考閾值</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(indicator.thresholds).map(([key, val]) => (
              <span key={key} className="badge bg-surface text-slate-300">
                {key}: {val}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
