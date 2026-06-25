"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toggleFavoriteProductAction } from "@/app/actions/products";
import type { ProductForPicker } from "@/lib/product-types";
import { getNewProductHref } from "@/lib/product-return";
import { ProductThumbnail } from "@/components/ProductThumbnail";

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
            <div className="flex flex-col gap-3 min-[420px]:flex-row min-[420px]:items-start min-[420px]:justify-between">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <ProductThumbnail
                  imageUrl={product.imageUrl}
                  name={product.name}
                  size="medium"
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="break-words font-semibold text-ink">
                      {product.name}
                    </div>
                    {product.isFavorite ? (
                      <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-accent">
                        Ходовой
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {product.internalSku}
                    {product.ozonOfferId ? ` · ${product.ozonOfferId}` : ""}
                  </div>
                </div>
              </div>
              <div className="self-start rounded-lg bg-slate-100 px-3 py-2 text-right min-[420px]:self-auto">
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

            <form action={toggleFavoriteProductAction} className="mt-3">
              <input name="productId" type="hidden" value={product.id} />
              <input
                name="isFavorite"
                type="hidden"
                value={product.isFavorite ? "0" : "1"}
              />
              <button
                className={
                  product.isFavorite
                    ? "secondary-button w-full"
                    : "primary-button"
                }
                type="submit"
              >
                {product.isFavorite
                  ? "Убрать из ходовых"
                  : "Сделать ходовым"}
              </button>
            </form>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 ? (
        <div className="space-y-3 rounded-lg border border-dashed border-slate-300 bg-white p-4 text-center">
          <div>
            <div className="font-semibold text-ink">Товар не найден</div>
            <p className="mt-1 text-sm text-slate-500">
              Создайте минимальную карточку и вернитесь к списку.
            </p>
          </div>
          <Link
            className="primary-button"
            href={getNewProductHref("products", {
              name: query
            })}
          >
            Создать товар
          </Link>
        </div>
      ) : null}

      <Link
        className="secondary-button"
        href={getNewProductHref("products")}
      >
        Добавить новый товар
      </Link>
    </div>
  );
}
