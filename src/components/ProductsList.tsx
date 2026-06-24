"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ProductForPicker } from "@/lib/product-types";

type ProductsListProps = {
  products: ProductForPicker[];
};

function normalize(value: string) {
  return value.toLowerCase().replaceAll("ё", "е").trim();
}

function matches(product: ProductForPicker, query: string) {
  const tokens = normalize(query).split(/\s+/).filter(Boolean);
  const text = normalize(
    [
      product.name,
      product.internalSku,
      product.ozonOfferId,
      product.category,
      product.searchAliases,
      ...product.barcodes.map((barcode) => barcode.value)
    ]
      .filter(Boolean)
      .join(" ")
  );

  return tokens.every((token) => text.includes(token));
}

export function ProductsList({ products }: ProductsListProps) {
  const [query, setQuery] = useState("");
  const filteredProducts = useMemo(
    () =>
      query.trim()
        ? products.filter((product) => matches(product, query))
        : products,
    [products, query]
  );

  return (
    <div className="space-y-4">
      <input
        className="field"
        inputMode="search"
        placeholder="Поиск по названию, SKU, offer ID, штрихкоду, категории"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />

      <div className="grid gap-3">
        {filteredProducts.map((product) => (
          <div className="panel p-4" key={product.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-ink">{product.name}</div>
                <div className="mt-1 text-sm text-slate-500">
                  {product.internalSku}
                  {product.ozonOfferId ? ` · ${product.ozonOfferId}` : ""}
                </div>
              </div>
              <div className="rounded-lg bg-slate-100 px-3 py-2 text-right">
                <div className="text-xs text-slate-500">Остаток</div>
                <div className="text-lg font-bold text-ink">
                  {product.stock}
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
              <span className="rounded-full bg-slate-100 px-2 py-1">
                {product.category}
              </span>
              {product.barcodes.slice(0, 3).map((barcode) => (
                <span
                  className="rounded-full bg-slate-100 px-2 py-1"
                  key={barcode.value}
                >
                  {barcode.value}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
          Ничего не найдено.
        </div>
      ) : null}

      <Link className="secondary-button" href="/products/new">
        Добавить новый товар
      </Link>
    </div>
  );
}
