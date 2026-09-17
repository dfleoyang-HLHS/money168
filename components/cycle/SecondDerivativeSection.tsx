import Link from "next/link";
import type { CycleAssessment } from "@/lib/types";
import {
  formatDerivativeValue,
  getDerivativeSnapshots,
  trendBadge,
  type DerivativeSnapshot,
} from "@/lib/derivative-metrics";

interface SecondDerivativeSectionProps {
  assessment: CycleAssessment;
  variant?: "overview" | "detail";
  indicatorId?: "ism" | "cpi";
}

function MetricRow({
  label,
  value,
  unit,
  trend,
}: {
  label: string;
  value: number | null;
  unit: string;
  trend: DerivativeSnapshot["momentum"]["direction"];
}) {
  const badge = trendBadge(trend);
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-surface-border py-3 last:border-0">
      <div className="text-sm text-slate-400">{label}</div>
      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold tabular-nums text-slate-100">
          {formatDerivativeValue(value, unit)}
        </span>
        <span className={`badge text-xs ${badge.className}`}>{badge.label}</span>
      </div>
    </div>
  );
}

function DerivativeCard({ snapshot, showLink }: { snapshot: DerivativeSnapshot; showLink: boolean }) {
  return (
    <article className="card flex flex-col">
      <header>
        <h3 className="font-semibold text-slate-100">{snapshot.title.zh}</h3>
        <p className="text-xs text-slate-500">{snapshot.title.en}</p>
      </header>

      <div className="mt-4 rounded-lg bg-surface px-4 py-2">
        <div className="text-xs text-slate-500">{snapshot.level.label}</div>
        <div className="text-2xl font-bold tabular-nums">
          {formatDerivativeValue(snapshot.level.value, snapshot.level.unit)}
        </div>
      </div>

      <div className="mt-4">
        <MetricRow
          label={snapshot.momentum.label}
          value={snapshot.momentum.value}
          unit={snapshot.momentum.unit}
          trend={snapshot.momentum.direction}
        />
        <MetricRow
          label={snapshot.acceleration.label}
          value={snapshot.acceleration.value}
          unit={snapshot.acceleration.unit}
          trend={snapshot.acceleration.direction}
        />
      </div>

      <p className="mt-4 text-sm font-medium text-slate-200">{snapshot.summary.zh}</p>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{snapshot.detail.zh}</p>

      {showLink && (
        <Link
          href={`/cycle/indicators/${snapshot.id}`}
          className="mt-4 text-sm text-accent-muted hover:underline"
        >
          查看指標說明與曲線 →
        </Link>
      )}
    </article>
  );
}

export default function SecondDerivativeSection({
  assessment,
  variant = "overview",
  indicatorId,
}: SecondDerivativeSectionProps) {
  const snapshots = getDerivativeSnapshots(assessment).filter((s) =>
    indicatorId ? s.id === indicatorId : true
  );

  if (!snapshots.length) return null;

  const isDetail = variant === "detail";

  return (
    <section className={isDetail ? "space-y-4" : "space-y-4"}>
      {!isDetail && (
        <div>
          <h2 className="text-lg font-semibold">動能與二階變化</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">
            奧本海默框架強調：<strong className="font-medium text-slate-300">變化的速度</strong>
            比單一時點水準更重要。
            <span className="text-slate-500">
              {" "}
              「一階」是近月動能（ISM 為 1 個月 PMI 變化；CPI 為 3 個月年增率變化）；「二階」是動能本身的變化（加速度），用來辨識轉折是加強還是放緩。
            </span>
            下列數值與週期評估引擎 v2 計算一致。
          </p>
        </div>
      )}

      {isDetail && (
        <div className="card border-accent/20 bg-accent/5">
          <h2 className="text-lg font-semibold">即時動能與二階變化</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            一階動能反映「正在變好還是變差」；二階變化反映「變好/變差的速度是否在加快」。
            評估規則與交叉矩陣會使用這些衍生值（ISM 含加速度；CPI 以 3 個月通膨動能及其變化為主）。
          </p>
        </div>
      )}

      <div className={`grid gap-4 ${snapshots.length > 1 ? "md:grid-cols-2" : ""}`}>
        {snapshots.map((snapshot) => (
          <DerivativeCard key={snapshot.id} snapshot={snapshot} showLink={!isDetail} />
        ))}
      </div>

      {!isDetail && (
        <p className="text-xs text-slate-500">
          說明：二階變化為規則引擎參考指標，非投資建議。詳細觸發邏輯見上方「觸發規則」。
        </p>
      )}
    </section>
  );
}
