import { getCycleFramework } from "@/lib/data";

export default function Footer() {
  const framework = getCycleFramework();
  return (
    <footer className="mt-auto border-t border-surface-border bg-surface py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs leading-relaxed text-slate-500">
          {framework.ui.disclaimer.zh}
        </p>
        <p className="mt-2 text-center text-xs text-slate-600">
          資料來源：FRED / ISM · 框架參考：《進場的訊號》Peter Oppenheimer
        </p>
      </div>
    </footer>
  );
}
