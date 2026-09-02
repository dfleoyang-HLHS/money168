import PhaseCard from "@/components/cycle/PhaseCard";
import { getCycleFramework } from "@/lib/data";
import Link from "next/link";

export const dynamic = "force-static";

export default function PhasesIndexPage() {
  const framework = getCycleFramework();

  return (
    <div className="space-y-8">
      <nav className="text-sm text-slate-400">
        <Link href="/cycle" className="hover:text-white">
          週期框架
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-200">四階段圖鑑</span>
      </nav>

      <header>
        <h1 className="text-3xl font-bold">四階段圖鑑</h1>
        <p className="mt-2 text-slate-400">
          絕望 · 希望 · 成長 · 樂觀 — 各階段歷史統計與特徵
        </p>
      </header>

      <section className="card overflow-x-auto">
        <h2 className="mb-4 text-lg font-semibold">核心維度對照表</h2>
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-surface-border text-left text-slate-400">
              <th className="p-2">維度</th>
              {framework.phases.map((p) => (
                <th key={p.id} className="p-2" style={{ color: framework.ui.phaseColors[p.id] }}>
                  {p.name.zh}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {framework.comparisonMatrix.dimensions.map((dim) => (
              <tr key={dim.id} className="border-b border-surface-border/50">
                <td className="p-2 text-slate-400">{dim.label.zh}</td>
                {framework.phases.map((p) => (
                  <td key={p.id} className="p-2 text-slate-200">
                    {String(dim.values[p.id])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="space-y-6">
        {framework.phases.map((phase) => (
          <div key={phase.id}>
            <PhaseCard phase={phase} colors={framework.ui.phaseColors} />
            <Link
              href={`/cycle/phases/${phase.id}`}
              className="mt-2 inline-block text-sm text-accent-muted hover:underline"
            >
              查看 {phase.name.zh} 期完整詳情 →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
