"use client";

import Link from "next/link";
import { useState } from "react";
import type { ProductForPicker } from "@/lib/product-types";
import { ProductPicker } from "@/components/ProductPicker";

type CheckStockPanelProps = {
  products: ProductForPicker[];
  recentProducts: ProductForPicker[];
};

export function CheckStockPanel({
  products,
  recentProducts
}: CheckStockPanelProps) {
  const [selectedProduct, setSelectedProduct] =
    useState<ProductForPicker | null>(null);

  return (
    <div className="space-y-5">
      <ProductPicker
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
    </div>
  );
}
