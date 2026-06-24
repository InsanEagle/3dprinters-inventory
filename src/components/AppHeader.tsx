import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";

type AppHeaderProps = {
  employee: {
    name: string;
    role: string;
  };
};

export function AppHeader({ employee }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
        <Link className="font-bold text-ink" href="/">
          FBO Inventory
        </Link>

        <nav className="hidden items-center gap-3 text-sm font-semibold text-slate-600 sm:flex">
          <Link href="/products">Товары</Link>
          <Link href="/movements">Журнал</Link>
        </nav>

        <div className="flex items-center gap-2">
          <div className="text-right leading-tight">
            <div className="text-sm font-semibold text-ink">{employee.name}</div>
            <div className="text-xs text-slate-500">{employee.role}</div>
          </div>

          <form action={logoutAction}>
            <button
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
              type="submit"
            >
              Выйти
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
