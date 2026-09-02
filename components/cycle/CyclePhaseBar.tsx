import type { CycleFramework } from "@/lib/types";
import { phaseNameZh } from "@/lib/format";

interface CyclePhaseBarProps {
  framework: CycleFramework;
  currentPhase?: string;
}

export default function CyclePhaseBar({ framework, currentPhase }: CyclePhaseBarProps) {
  const sequence = framework.cycleModel.sequence;
  const colors = framework.ui.phaseColors;

  return (
    <div className="card">
      <h2 className="mb-4 text-lg font-semibold">四階段循環</h2>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {sequence.map((phaseId, i) => {
          const isActive = phaseId === currentPhase;
          const color = colors[phaseId] || "#3b82f6";
          return (
            <div key={phaseId} className="flex flex-1 items-center gap-2">
              <div
                className={`flex flex-1 flex-col items-center rounded-lg border p-3 transition ${
                  isActive
                    ? "border-2 shadow-lg"
                    : "border-surface-border bg-surface opacity-70"
                }`}
                style={isActive ? { borderColor: color, boxShadow: `0 0 20px ${color}33` } : {}}
              >
                <div
                  className="mb-1 h-2 w-2 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <div className="text-sm font-medium" style={isActive ? { color } : {}}>
                  {phaseNameZh(phaseId)}
                </div>
                <div className="text-xs text-slate-500">
                  {framework.phases.find((p) => p.id === phaseId)?.duration.avgMonths} 月
                </div>
              </div>
              {i < sequence.length - 1 && (
                <div className="hidden text-slate-600 sm:block">→</div>
              )}
            </div>
          );
        })}
        <div className="hidden text-slate-600 sm:block">↻</div>
      </div>
    </div>
  );
}
