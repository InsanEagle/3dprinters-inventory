import Link from "next/link";
import { BigActionButton } from "@/components/BigActionButton";
import { getInventorySummary } from "@/lib/stock";

export default async function HomePage() {
  const summary = await getInventorySummary();

  return (
    <div className="space-y-5">
      <section className="rounded-lg bg-white p-5 shadow-sm">
        <div className="text-sm font-semibold uppercase tracking-wide text-accent">
          Склад готовых FBO-товаров
        </div>
        <h1 className="mt-2 text-2xl font-bold text-ink">
          Что делаем сейчас?
        </h1>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-slate-100 p-3">
            <div className="text-xs text-slate-500">Товаров</div>
            <div className="mt-1 text-2xl font-bold text-ink">
              {summary.productsCount}
            </div>
          </div>
          <div className="rounded-lg bg-slate-100 p-3">
            <div className="text-xs text-slate-500">Штук на складе</div>
            <div className="mt-1 text-2xl font-bold text-ink">
              {summary.totalUnits}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <BigActionButton
          description="Записать приход после печати и упаковки"
          href="/stock/add"
          marker="+"
          title="Добавить готовый товар"
          tone="green"
        />
        <BigActionButton
          description="Поставка, FBS, брак, доработка или другое"
          href="/stock/remove"
          marker="−"
          title="Взять товар"
          tone="blue"
        />
        <BigActionButton
          description="Быстро найти товар и увидеть расчетный остаток"
          href="/stock/check"
          marker="?"
          title="Проверить остаток"
          tone="slate"
        />
        <BigActionButton
          description="Исправить учет через отдельную запись журнала"
          href="/stock/correction"
          marker="="
          title="Коррекция"
          tone="amber"
        />
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Link className="secondary-button" href="/products">
          Товары
        </Link>
        <Link className="secondary-button" href="/movements">
          Журнал
        </Link>
      </section>
    </div>
  );
}
