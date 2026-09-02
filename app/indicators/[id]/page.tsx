import { notFound } from "next/navigation";
import Link from "next/link";
import TimeSeriesChart from "@/components/charts/TimeSeriesChart";
import {
  getIndicatorMeta,
  getDisplayHistory,
  getAllIndicatorIds,
} from "@/lib/data";
import { formatDateTime } from "@/lib/format";
import type { TimeRange } from "@/lib/types";

export function generateStaticParams() {
  return getAllIndicatorIds().map((id) => ({ id }));
}

export default function IndicatorDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const meta = getIndicatorMeta(params.id);
  if (!meta) notFound();

  const history = getDisplayHistory(params.id);
  const defaultRange = (meta.detailConfig?.defaultRange || "1Y") as TimeRange;

  const refLine = params.id === "ism" ? 50 : undefined;
  const refLabel = params.id === "ism" ? "擴張/收縮線 (50)" : undefined;

  const chartColor =
    params.id === "vix"
      ? "#f59e0b"
      : params.id === "cpi"
        ? "#a78bfa"
        : params.id === "ism"
          ? "#34d399"
          : "#3b82f6";

  return (
    <div className="space-y-6">
      <nav className="text-sm text-slate-400">
        <Link href="/" className="hover:text-white">
          指標總覽
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-200">{meta.name.zh}</span>
      </nav>

      <header>
        <h1 className="text-3xl font-bold">{meta.name.zh}</h1>
        <p className="mt-1 text-slate-400">{meta.name.en}</p>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
          {meta.description.zh}
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
          <span>來源：{meta.source}</span>
          {meta.sourceSeriesId && <span>系列：{meta.sourceSeriesId}</span>}
          <span>更新頻率：{meta.updateFrequency}</span>
        </div>
      </header>

      <section className="card">
        <h2 className="mb-4 text-lg font-semibold">數據曲線</h2>
        <TimeSeriesChart
          data={history}
          unit={meta.unit}
          defaultRange={defaultRange}
          referenceLine={refLine}
          referenceLabel={refLabel}
          color={chartColor}
        />
      </section>

      {(params.id === "cpi" || params.id === "ism") && (
        <section className="card border-accent/30">
          <h2 className="text-lg font-semibold">週期框架關聯</h2>
          <p className="mt-2 text-sm text-slate-300">
            此指標為奧本海默《進場的訊號》兩大關鍵觀察指標之一。
          </p>
          <Link
            href={`/cycle/indicators/${params.id}`}
            className="mt-3 inline-block text-sm text-accent-muted hover:underline"
          >
            查看週期框架中的 {meta.name.zh} 分析 →
          </Link>
        </section>
      )}
    </div>
  );
}
