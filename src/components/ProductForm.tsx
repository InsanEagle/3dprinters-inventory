"use client";

import { useActionState } from "react";
import { createProductAction } from "@/app/actions/products";
import { SubmitButton } from "@/components/SubmitButton";

export function ProductForm() {
  const [state, formAction] = useActionState(createProductAction, {
    status: "",
    message: ""
  });

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <label className="label" htmlFor="name">
          Название
        </label>
        <input className="field" id="name" name="name" required type="text" />
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
        <label className="label" htmlFor="barcodes">
          Штрихкоды
        </label>
        <textarea
          className="field min-h-24 resize-y"
          id="barcodes"
          name="barcodes"
          placeholder="Каждый штрихкод с новой строки или через запятую"
        />
      </div>

      <div className="space-y-2">
        <label className="label" htmlFor="searchAliases">
          Поисковые алиасы
        </label>
        <textarea
          className="field min-h-24 resize-y"
          id="searchAliases"
          name="searchAliases"
          placeholder="Синонимы, короткие названия, слова сотрудников"
        />
      </div>

      {state.message ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
          {state.message}
        </div>
      ) : null}

      <SubmitButton>Создать товар</SubmitButton>
    </form>
  );
}
