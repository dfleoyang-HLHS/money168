import IndicatorCard from "@/components/dashboard/IndicatorCard";
import CycleEntryCard from "@/components/dashboard/CycleEntryCard";
import {
  getDashboardSummary,
  getLastUpdated,
  groupIndicatorsByCategory,
  getCycleAssessment,
} from "@/lib/data";
import { categoryLabel, formatDateTime } from "@/lib/format";

export const dynamic = "force-static";

export default function DashboardPage() {
  const summary = getDashboardSummary();
  const lastUpdated = getLastUpdated();
  let assessment = null;
  try {
    assessment = getCycleAssessment();
  } catch {
    /* optional */
  }

  const grouped = groupIndicatorsByCategory();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">指標總覽</h1>
        <p className="mt-2 text-slate-400">
          第一層：重要財經指標快照 · 最後更新{" "}
          {formatDateTime(lastUpdated.globalUpdatedAt)}
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-4">
        {assessment && <CycleEntryCard assessment={assessment} />}
      </section>

      {Object.entries(grouped).map(([category, indicators]) => (
        <section key={category}>
          <h2 className="mb-4 text-lg font-semibold text-slate-200">
            {categoryLabel(category)}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {indicators.map((ind) => {
              const cardData = summary.indicators.find((s) => s.id === ind.id);
              if (!cardData) return null;
              return <IndicatorCard key={ind.id} indicator={cardData} />;
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
