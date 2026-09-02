import type { CycleFramework } from "@/lib/types";
import { phaseNameZh } from "@/lib/format";

interface CrossMatrixProps {
  framework: CycleFramework;
  activeCell?: string;
}

const cellKeys = [
  "ism_rising__cpi_falling",
  "ism_rising__cpi_rising",
  "ism_falling__cpi_falling",
  "ism_falling__cpi_rising",
];

const rowLabels = ["ISM 回升", "ISM 下滑"];
const colLabels = ["CPI 回落", "CPI 升溫"];

export default function CrossMatrix({ framework, activeCell }: CrossMatrixProps) {
  const cells = framework.crossSignalMatrix.cells;

  return (
    <div className="card">
      <h2 className="mb-2 text-lg font-semibold">ISM × CPI 交叉矩陣</h2>
      <p className="mb-4 text-sm text-slate-400">
        兩大關鍵指標的組合解讀（參考《進場的訊號》）
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse text-sm">
          <thead>
            <tr>
              <th className="p-2" />
              {colLabels.map((label) => (
                <th key={label} className="p-2 text-center text-slate-400">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowLabels.map((rowLabel, ri) => (
              <tr key={rowLabel}>
                <td className="p-2 text-slate-400">{rowLabel}</td>
                {colLabels.map((_, ci) => {
                  const key = cellKeys[ri * 2 + ci];
                  const cell = cells[key];
                  const isActive = key === activeCell;
                  return (
                    <td key={key} className="p-2">
                      <div
                        className={`rounded-lg border p-3 ${
                          isActive
                            ? "border-accent bg-accent/10"
                            : "border-surface-border bg-surface"
                        }`}
                      >
                        <div className="font-medium">{cell?.label.zh}</div>
                        <div className="mt-1 text-xs text-slate-400">{cell?.note.zh}</div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {cell?.favoredPhases.map((p) => (
                            <span
                              key={p}
                              className="badge bg-surface-raised text-xs text-slate-300"
                            >
                              {phaseNameZh(p)}
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
