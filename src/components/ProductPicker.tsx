"use client";

import Link from "next/link";
import clsx from "clsx";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ProductForPicker } from "@/lib/product-types";
import {
  getNewProductHref,
  type ProductReturnTarget
} from "@/lib/product-return";

type ScannerControls = {
  stop?: () => void;
};

type ProductPickerProps = {
  products: ProductForPicker[];
  recentProducts?: ProductForPicker[];
  name?: string;
  label?: string;
  placeholder?: string;
  initialProductId?: string;
  showStock?: boolean;
  createProductReturnTo?: ProductReturnTarget;
  onChange?: (product: ProductForPicker | null) => void;
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

export function ProductPicker({
  products,
  recentProducts = [],
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

  const visibleProducts = useMemo(() => {
    const source = query.trim()
      ? products.filter((product) => matchesProduct(product, query))
      : recentProducts.length > 0
        ? recentProducts
        : products.slice(0, 8);

    return source.slice(0, 30);
  }, [products, query, recentProducts]);

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

      <div className="flex items-center justify-between gap-3">
        <label className="label" htmlFor={`${name}-query`}>
          {label}
        </label>
        <button
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-accent"
          type="button"
          onClick={() => {
            setScanError("");
            setScannerOpen(true);
          }}
        >
          Сканировать
        </button>
      </div>

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

      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {query.trim() ? "Результаты" : "Последние товары"}
        </div>

        {visibleProducts.length === 0 ? (
          <div className="space-y-3 rounded-lg border border-dashed border-slate-300 bg-white p-4">
            <div>
              <div className="font-semibold text-ink">Товар не найден</div>
              <p className="mt-1 text-sm text-slate-500">
                {unknownScannedBarcode
                  ? `Сохранить barcode ${unknownScannedBarcode} в новой карточке товара.`
                  : "Можно сразу создать минимальную карточку и вернуться к этой операции."}
              </p>
            </div>
            <Link
              className="primary-button"
              href={getNewProductHref(createProductReturnTo, {
                barcode: unknownScannedBarcode,
                name: unknownScannedBarcode ? undefined : query
              })}
            >
              Создать товар
            </Link>
          </div>
        ) : (
          <div className="max-h-80 space-y-2 overflow-auto pr-1">
            {visibleProducts.map((product) => (
              <button
                className={clsx(
                  "w-full rounded-lg border bg-white p-3 text-left transition active:scale-[0.99]",
                  selectedId === product.id
                    ? "border-accent ring-4 ring-blue-100"
                    : "border-slate-200"
                )}
                key={product.id}
                type="button"
                onClick={() => selectProduct(product)}
              >
                <div className="font-semibold text-ink">{product.name}</div>
                <div className="mt-1 text-sm text-slate-500">
                  {product.internalSku}
                  {product.ozonOfferId ? ` · ${product.ozonOfferId}` : ""} ·{" "}
                  {product.category}
                </div>
                {showStock ? (
                  <div className="mt-2 text-sm font-semibold text-slate-700">
                    Остаток: {product.stock} шт.
                  </div>
                ) : null}
              </button>
            ))}
          </div>
        )}
      </div>

      {unknownScannedBarcode && !selectedProduct && visibleProducts.length > 0 ? (
        <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div>
            <div className="font-semibold text-amber-950">
              Товар не найден
            </div>
            <p className="mt-1 text-sm text-amber-900">
              Сохранить barcode {unknownScannedBarcode} в новой карточке товара.
            </p>
          </div>
          <Link
            className="primary-button"
            href={getNewProductHref(createProductReturnTo, {
              barcode: unknownScannedBarcode
            })}
          >
            Создать товар
          </Link>
        </div>
      ) : null}
    </div>
  );
}
