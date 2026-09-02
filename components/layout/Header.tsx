import Link from "next/link";

const navItems = [
  { href: "/", label: "指標總覽" },
  { href: "/cycle", label: "週期框架" },
  { href: "/cycle/phases", label: "四階段圖鑑" },
];

export default function Header() {
  return (
    <header className="border-b border-surface-border bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent font-bold text-white">
            M
          </div>
          <div>
            <div className="text-lg font-semibold tracking-tight">Money168</div>
            <div className="text-xs text-slate-400">財經趨勢觀察入口</div>
          </div>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-surface-raised hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
