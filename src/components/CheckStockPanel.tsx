"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { getProductMovementsAction } from "@/app/actions/stock";
import { getKindLabel, getReasonLabel } from "@/lib/reasons";
import type { ProductForPicker } from "@/lib/product-types";
import { ProductPicker } from "@/components/ProductPicker";

type ProductMovementPreview = {
  id: string;
  kind: string;
  quantityDelta: number;
  reason: string;
  comment: string | null;
  createdAt: string;
  employeeName: string | null;
};

type CheckStockPanelProps = {
  products: ProductForPicker[];
  recentProducts: ProductForPicker[];
  favoriteProducts: ProductForPicker[];
  initialProductId?: string;
};

function formatMovementDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatQuantity(value: number) {
  return `${value > 0 ? "+" : ""}${value} шт.`;
}

export function CheckStockPanel({
  products,
  recentProducts,
  favoriteProducts,
  initialProductId
}: CheckStockPanelProps) {
  const [selectedProduct, setSelectedProduct] =
    useState<ProductForPicker | null>(null);
  const [movements, setMovements] = useState<ProductMovementPreview[]>([]);
  const [movementsLoading, setMovementsLoading] = useState(false);
  const [movementsError, setMovementsError] = useState("");

  useEffect(() => {
    if (!selectedProduct) {
      setMovements([]);
      setMovementsError("");
      setMovementsLoading(false);
      return;
    }

    let stale = false;

    setMovements([]);
    setMovementsError("");
    setMovementsLoading(true);

    getProductMovementsAction(selectedProduct.id)
      .then((nextMovements) => {
        if (!stale) {
          setMovements(nextMovements);
        }
      })
      .catch(() => {
        if (!stale) {
          setMovementsError("Не удалось загрузить последние движения.");
        }
      })
      .finally(() => {
        if (!stale) {
          setMovementsLoading(false);
        }
      });

    return () => {
      stale = true;
    };
  }, [selectedProduct]);

  return (
    <div className="space-y-5">
      <ProductPicker
        createProductReturnTo="stock-check"
        favoriteProducts={favoriteProducts}
        initialProductId={initialProductId}
        name="checkProductId"
        onChange={setSelectedProduct}
        products={products}
        recentProducts={recentProducts}
      />

      {selectedProduct ? (
        <div className="rounded-lg bg-ink p-5 text-white shadow-soft">
          <div className="text-sm text-blue-100">Текущий расчетный остаток</div>
          <div className="mt-2 text-5xl font-bold">
            {selectedProduct.stock}
          </div>
          <div className="mt-1 text-blue-100">шт.</div>
          <div className="mt-4 text-sm text-blue-100">
            Остаток рассчитан как сумма всех записей журнала движений.
          </div>

          <Link
            className="mt-5 inline-flex rounded-lg bg-white px-4 py-3 font-semibold text-ink"
            href={`/stock/correction?productId=${selectedProduct.id}`}
          >
            Сделать коррекцию
          </Link>
        </div>
      ) : null}

      {selectedProduct ? (
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-bold text-ink">Последние движения</h2>
            <p className="mt-1 text-sm text-slate-500">
              По выбранному товару, сначала самые свежие.
            </p>
          </div>

          {movementsLoading ? (
            <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">
              Загружаем движения...
            </div>
          ) : null}

          {movementsError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
              {movementsError}
            </div>
          ) : null}

          {!movementsLoading && !movementsError && movements.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
              Движений по товару пока нет.
            </div>
          ) : null}

          {!movementsLoading && !movementsError && movements.length > 0 ? (
            <div className="space-y-2">
              {movements.map((movement) => (
                <article
                  className="rounded-lg border border-slate-200 bg-white p-3"
                  key={movement.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-ink">
                        {getKindLabel(movement.kind)}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {formatMovementDate(movement.createdAt)}
                        {movement.employeeName
                          ? ` · ${movement.employeeName}`
                          : ""}
                      </div>
                    </div>

                    <div
                      className={clsx(
                        "shrink-0 text-right text-lg font-bold",
                        movement.quantityDelta >= 0
                          ? "text-emerald-700"
                          : "text-red-700"
                      )}
                    >
                      {formatQuantity(movement.quantityDelta)}
                    </div>
                  </div>

                  <div className="mt-2 text-sm text-slate-600">
                    Причина: {getReasonLabel(movement.reason)}
                  </div>

                  {movement.comment ? (
                    <div className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                      {movement.comment}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
