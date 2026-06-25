"use client";

import Link from "next/link";
import clsx from "clsx";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ProductForPicker } from "@/lib/product-types";
import {
  getBindBarcodeHref,
  getNewProductHref,
  type ProductReturnTarget
} from "@/lib/product-return";

type ScannerControls = {
  stop?: () => void;
};

type ProductPickerProps = {
  products: ProductForPicker[];
  recentProducts?: ProductForPicker[];
  favoriteProducts?: ProductForPicker[];
  name?: string;
  label?: string;
  placeholder?: string;
  initialProductId?: string;
  showStock?: boolean;
  createProductReturnTo?: ProductReturnTarget;
  onChange?: (product: ProductForPicker | null) => void;
};

type ProductCardProps = {
  product: ProductForPicker;
  selected: boolean;
  showStock: boolean;
  onSelect: (product: ProductForPicker) => void;
};

type ProductSectionProps = {
  title: string;
  emptyText: string;
  products: ProductForPicker[];
  selectedId: string;
  showStock: boolean;
  onSelect: (product: ProductForPicker) => void;
};

type UnknownBarcodeActionsProps = {
  barcode: string;
  returnTo: ProductReturnTarget;
};

function normalize(value: string) {
  return value.toLowerCase().replaceAll("ё", "е").trim();
}

function searchableText(product: ProductForPicker) {
  return normalize(
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
}

function matchesProduct(product: ProductForPicker, query: string) {
  const tokens = normalize(query).split(/\s+/).filter(Boolean);

  if (tokens.length === 0) {
    return true;
  }

  const haystack = searchableText(product);
  return tokens.every((token) => haystack.includes(token));
}

function getTypedBarcodeCandidate(query: string) {
  const value = query.trim();

  if (!value || /\s/.test(value)) {
    return "";
  }

  return value;
}

function UnknownBarcodeActions({
  barcode,
  returnTo
}: UnknownBarcodeActionsProps) {
  return (
    <div className="grid gap-2">
      <Link
        className="primary-button"
        href={getNewProductHref(returnTo, {
          barcode
        })}
      >
        Создать новый товар с этим штрихкодом
      </Link>
      <Link
        className="secondary-button"
        href={getBindBarcodeHref(returnTo, barcode)}
      >
        Привязать штрихкод к существующему товару
      </Link>
    </div>
  );
}

function ProductCard({
  product,
  selected,
  showStock,
  onSelect
}: ProductCardProps) {
  return (
    <button
      className={clsx(
        "w-full rounded-lg border bg-white p-3 text-left transition active:scale-[0.99]",
        selected ? "border-accent ring-4 ring-blue-100" : "border-slate-200"
      )}
      type="button"
      onClick={() => onSelect(product)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold text-ink">{product.name}</div>
          <div className="mt-1 text-sm text-slate-500">
            {product.internalSku} · {product.category}
          </div>
          {showStock ? (
            <div className="mt-2 text-sm font-semibold text-slate-700">
              Остаток: {product.stock} шт.
            </div>
          ) : null}
        </div>

        <span className="shrink-0 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white">
          Выбрать
        </span>
      </div>
    </button>
  );
}

function ProductSection({
  title,
  emptyText,
  products,
  selectedId,
  showStock,
  onSelect
}: ProductSectionProps) {
  return (
    <section className="space-y-2">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </div>

      {products.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
          {emptyText}
        </div>
      ) : (
        <div className="space-y-2">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              onSelect={onSelect}
              product={product}
              selected={selectedId === product.id}
              showStock={showStock}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export function ProductPicker({
  products,
  recentProducts = [],
  favoriteProducts = [],
  name = "productId",
  label = "Товар",
  placeholder = "Название, SKU, offer ID, штрихкод или категория",
  initialProductId,
  showStock = true,
  createProductReturnTo = "products",
  onChange
}: ProductPickerProps) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(initialProductId || "");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanError, setScanError] = useState("");
  const [unknownScannedBarcode, setUnknownScannedBarcode] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<ScannerControls | null>(null);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedId) || null,
    [products, selectedId]
  );

  useEffect(() => {
    onChange?.(selectedProduct);
  }, [onChange, selectedProduct]);

  useEffect(() => {
    setSelectedId(initialProductId || "");
  }, [initialProductId]);

  const hasQuery = query.trim().length > 0;
  const unknownBarcodeCandidate =
    unknownScannedBarcode || getTypedBarcodeCandidate(query);

  const queryProducts = useMemo(
    () =>
      hasQuery
        ? products
            .filter((product) => matchesProduct(product, query))
            .slice(0, 30)
        : [],
    [hasQuery, products, query]
  );

  const selectProduct = useCallback((product: ProductForPicker) => {
    setSelectedId(product.id);
    setQuery(product.name);
    setUnknownScannedBarcode("");
  }, []);

  const handleScannedCode = useCallback((rawCode: string) => {
    const code = rawCode.trim();
    const exactProduct = products.find((product) => {
      const barcodeMatch = product.barcodes.some(
        (barcode) => barcode.value === code
      );
      return (
        barcodeMatch ||
        product.internalSku === code ||
        product.ozonOfferId === code
      );
    });

    setQuery(code);
    setScannerOpen(false);

    if (exactProduct) {
      selectProduct(exactProduct);
      setScanError("");
      return;
    }

    setUnknownScannedBarcode(code);
    setScanError(
      `Код ${code} считан, но точного совпадения нет. Проверьте список ниже.`
    );
  }, [products, selectProduct]);

  useEffect(() => {
    if (!scannerOpen) {
      return;
    }

    let mounted = true;
    const timer = window.setTimeout(async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Camera API is not available");
        }

        const zxing = await import("@zxing/browser");
        const reader = new zxing.BrowserMultiFormatReader();
        const video = videoRef.current;

        if (!video) {
          return;
        }

        const controls = await reader.decodeFromVideoDevice(
          undefined,
          video,
          (result) => {
            if (result) {
              controlsRef.current?.stop?.();
              handleScannedCode(result.getText());
            }
          }
        );

        if (mounted) {
          controlsRef.current = controls;
        }
      } catch {
        if (mounted) {
          setScanError(
            "Камера недоступна. Можно ввести штрихкод или найти товар вручную."
          );
          setScannerOpen(false);
        }
      }
    }, 80);

    return () => {
      mounted = false;
      window.clearTimeout(timer);
      controlsRef.current?.stop?.();
      controlsRef.current = null;
    };
  }, [handleScannedCode, scannerOpen]);

  return (
    <div className="space-y-3">
      <input name={name} type="hidden" value={selectedId} />

      <div className="space-y-2">
        <label className="label" htmlFor={`${name}-query`}>
          {label}
        </label>

        <div className="grid grid-cols-[1fr_auto] gap-2">
          <input
            className="field"
            id={`${name}-query`}
            inputMode="search"
            placeholder={placeholder}
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSelectedId("");
              setUnknownScannedBarcode("");
            }}
          />
          <button
            className="min-h-12 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-accent active:scale-[0.99]"
            type="button"
            onClick={() => {
              setScanError("");
              setScannerOpen(true);
            }}
          >
            Сканировать
          </button>
        </div>
      </div>

      {selectedProduct ? (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
          <div className="text-sm font-semibold text-accent">Выбрано</div>
          <div className="mt-1 font-semibold text-ink">
            {selectedProduct.name}
          </div>
          <div className="mt-1 text-sm text-slate-600">
            {selectedProduct.internalSku}
            {selectedProduct.ozonOfferId
              ? ` · ${selectedProduct.ozonOfferId}`
              : ""}
          </div>
          {showStock ? (
            <div className="mt-2 text-sm font-semibold text-slate-700">
              Остаток: {selectedProduct.stock} шт.
            </div>
          ) : null}
        </div>
      ) : null}

      {scannerOpen ? (
        <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-950 p-3 text-white">
          <video
            ref={videoRef}
            className="aspect-[4/3] w-full rounded-lg bg-black object-cover"
            muted
            playsInline
          />
          <button
            className="w-full rounded-lg bg-white px-4 py-3 text-sm font-semibold text-ink"
            type="button"
            onClick={() => setScannerOpen(false)}
          >
            Закрыть камеру
          </button>
        </div>
      ) : null}

      {scanError ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {scanError}
        </div>
      ) : null}

      {hasQuery ? (
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Результаты поиска
          </div>

          {queryProducts.length === 0 ? (
            <div className="space-y-3 rounded-lg border border-dashed border-slate-300 bg-white p-4">
              <div>
                <div className="font-semibold text-ink">Товар не найден</div>
                <p className="mt-1 text-sm text-slate-500">
                  {unknownBarcodeCandidate
                    ? `Код ${unknownBarcodeCandidate} можно сохранить в новой карточке или привязать к существующему товару.`
                    : "Можно сразу создать минимальную карточку и вернуться к этой операции."}
                </p>
              </div>
              {unknownBarcodeCandidate ? (
                <UnknownBarcodeActions
                  barcode={unknownBarcodeCandidate}
                  returnTo={createProductReturnTo}
                />
              ) : (
                <Link
                  className="primary-button"
                  href={getNewProductHref(createProductReturnTo, {
                    name: query
                  })}
                >
                  Создать товар
                </Link>
              )}
            </div>
          ) : (
            <div className="max-h-80 space-y-2 overflow-auto pr-1">
              {queryProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  onSelect={selectProduct}
                  product={product}
                  selected={selectedId === product.id}
                  showStock={showStock}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <ProductSection
            emptyText="Движений пока нет. Найдите товар через поиск."
            onSelect={selectProduct}
            products={recentProducts}
            selectedId={selectedId}
            showStock={showStock}
            title="Последние товары"
          />
          <ProductSection
            emptyText="Отметьте товары как ходовые в списке товаров."
            onSelect={selectProduct}
            products={favoriteProducts}
            selectedId={selectedId}
            showStock={showStock}
            title="Ходовые товары"
          />
        </div>
      )}

      {unknownScannedBarcode && !selectedProduct && queryProducts.length > 0 ? (
        <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div>
            <div className="font-semibold text-amber-950">
              Товар не найден
            </div>
            <p className="mt-1 text-sm text-amber-900">
              Код {unknownScannedBarcode} не совпал точно. Его можно сохранить в
              новой карточке или привязать к существующему товару.
            </p>
          </div>
          <UnknownBarcodeActions
            barcode={unknownScannedBarcode}
            returnTo={createProductReturnTo}
          />
        </div>
      ) : null}
    </div>
  );
}
