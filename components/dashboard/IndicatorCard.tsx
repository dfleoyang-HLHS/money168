import Link from "next/link";
import Sparkline from "./Sparkline";
import type { IndicatorSummary } from "@/lib/types";
import { formatNumber, formatPercent, trendColor, trendLabel } from "@/lib/format";

interface IndicatorCardProps {
  indicator: IndicatorSummary;
}

export default function IndicatorCard({ indicator }: IndicatorCardProps) {
  const sparkColor =
    indicator.trend === "up" ? "#34d399" : indicator.trend === "down" ? "#f87171" : "#94a3b8";

  return (
    <Link href={`/indicators/${indicator.id}`} className="group block">
      <article className="card h-full transition hover:border-accent/50 hover:shadow-accent/5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-medium text-slate-300 group-hover:text-white">
              {indicator.name.zh}
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">{indicator.name.en}</p>
          </div>
          <Sparkline data={indicator.sparkline} color={sparkColor} />
        </div>

        <div className="mt-4 flex items-end justify-between">
          <div>
            <div className="text-2xl font-semibold tabular-nums">
              {formatNumber(indicator.latest.value)}
              <span className="ml-1 text-sm font-normal text-slate-400">
                {indicator.latest.unit}
              </span>
            </div>
            <div className="mt-1 text-xs text-slate-500">
              截至 {indicator.latest.asOf}
            </div>
          </div>
          <div className="text-right">
            {indicator.change["1m"] != null && (
              <div className={`text-sm font-medium tabular-nums ${trendColor(indicator.trend)}`}>
                {formatPercent(indicator.change["1m"])} / 月
              </div>
            )}
            <div className={`mt-1 text-xs ${trendColor(indicator.trend)}`}>
              {trendLabel(indicator.trend)}
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
