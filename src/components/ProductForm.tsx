"use client";

import { useActionState } from "react";
import { createProductAction } from "@/app/actions/products";
import type { ProductReturnTarget } from "@/lib/product-return";
import { SubmitButton } from "@/components/SubmitButton";

type ProductFormProps = {
  initialName?: string;
  initialBarcode?: string;
  returnTo: ProductReturnTarget;
};

export function ProductForm({
  initialName = "",
  initialBarcode = "",
  returnTo
}: ProductFormProps) {
  const [state, formAction] = useActionState(createProductAction, {
    status: "",
    message: ""
  });

  return (
    <form action={formAction} className="space-y-5">
      <input name="returnTo" type="hidden" value={returnTo} />

      <div className="space-y-2">
        <label className="label" htmlFor="name">
          Название
        </label>
        <input
          className="field"
          defaultValue={initialName}
          id="name"
          name="name"
          required
          type="text"
        />
      </div>

      <div className="space-y-2">
        <label className="label" htmlFor="internalSku">
          Internal SKU
        </label>
        <input
          className="field"
          id="internalSku"
          name="internalSku"
          required
          type="text"
        />
      </div>

      <div className="space-y-2">
        <label className="label" htmlFor="category">
          Категория
        </label>
        <input
          className="field"
          id="category"
          name="category"
          required
          type="text"
        />
      </div>

      <div className="space-y-2">
        <label className="label" htmlFor="barcode">
          Barcode
        </label>
        <input
          className="field"
          defaultValue={initialBarcode}
          id="barcode"
          name="barcode"
          placeholder="Необязательно"
          type="text"
        />
      </div>

      <label className="flex min-h-12 items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-base font-semibold text-ink">
        <input
          className="h-5 w-5 accent-blue-600"
          name="isFavorite"
          type="checkbox"
        />
        Ходовой товар
      </label>

      <details className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <summary className="cursor-pointer text-sm font-semibold text-slate-700">
          Фото, Ozon offer ID и алиасы
        </summary>

        <div className="mt-3 space-y-4">
          <div className="space-y-2">
            <label className="label" htmlFor="imageUrl">
              Фото товара / ссылка на фото
            </label>
            <input
              className="field"
              id="imageUrl"
              name="imageUrl"
              placeholder="Необязательно"
              type="text"
            />
          </div>

          <div className="space-y-2">
            <label className="label" htmlFor="ozonOfferId">
              Ozon offer ID
            </label>
            <input
              className="field"
              id="ozonOfferId"
              name="ozonOfferId"
              placeholder="Необязательно"
              type="text"
            />
          </div>

          <div className="space-y-2">
            <label className="label" htmlFor="searchAliases">
              Поисковые алиасы
            </label>
            <input
              className="field"
              id="searchAliases"
              name="searchAliases"
              placeholder="Синонимы, короткие названия"
              type="text"
            />
          </div>
        </div>
      </details>

      {state.message ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
          {state.message}
        </div>
      ) : null}

      <SubmitButton>Создать товар</SubmitButton>
    </form>
  );
}
