"use client";

import Link from "next/link";
import { useActionState } from "react";
import clsx from "clsx";
import type { ProductForPicker } from "@/lib/product-types";
import type { ProductReturnTarget } from "@/lib/product-return";
import { ProductPicker } from "@/components/ProductPicker";
import { SubmitButton } from "@/components/SubmitButton";

type StockActionState = {
  status?: "success" | "error" | "warning";
  message?: string;
  correctionUrl?: string;
};

type ReasonOption = {
  value: string;
  label: string;
};

type StockMovementFormProps = {
  mode: "add" | "remove" | "correction";
  products: ProductForPicker[];
  recentProducts: ProductForPicker[];
  favoriteProducts: ProductForPicker[];
  action: (
    previousState: StockActionState,
    formData: FormData
  ) => Promise<StockActionState>;
  reasonOptions?: readonly ReasonOption[];
  initialProductId?: string;
};

const titles = {
  add: {
    quantityLabel: "Сколько готовых товаров добавить",
    button: "Добавить товар",
    comment: "Комментарий к приходу"
  },
  remove: {
    quantityLabel: "Сколько взять",
    button: "Списать товар",
    comment: "Комментарий к расходу"
  },
  correction: {
    quantityLabel: "Фактический остаток на полке",
    button: "Записать коррекцию",
    comment: "Комментарий к коррекции"
  }
};

const returnTargets: Record<StockMovementFormProps["mode"], ProductReturnTarget> =
  {
    add: "stock-add",
    remove: "stock-remove",
    correction: "stock-correction"
  };

export function StockMovementForm({
  mode,
  products,
  recentProducts,
  favoriteProducts,
  action,
  reasonOptions = [],
  initialProductId
}: StockMovementFormProps) {
  const [state, formAction] = useActionState(action, {});
  const copy = titles[mode];

  return (
    <form action={formAction} className="space-y-5">
      <ProductPicker
        createProductReturnTo={returnTargets[mode]}
        favoriteProducts={favoriteProducts}
        initialProductId={initialProductId}
        products={products}
        recentProducts={recentProducts}
      />

      <div className="space-y-2">
        <label
          className="label"
          htmlFor={mode === "correction" ? "actualQuantity" : "quantity"}
        >
          {copy.quantityLabel}
        </label>
        <input
          className="field"
          id={mode === "correction" ? "actualQuantity" : "quantity"}
          inputMode="numeric"
          min={mode === "correction" ? 0 : 1}
          name={mode === "correction" ? "actualQuantity" : "quantity"}
          placeholder="0"
          required
          type="number"
        />
      </div>

      {mode === "remove" ? (
        <div className="space-y-2">
          <label className="label" htmlFor="reason">
            Причина расхода
          </label>
          <select className="field" id="reason" name="reason" required>
            {reasonOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {mode === "remove" ? (
        <div className="space-y-2">
          <label className="label" htmlFor="reference">
            Номер поставки или заказа
          </label>
          <input
            className="field"
            id="reference"
            name="reference"
            placeholder="Необязательно"
            type="text"
          />
        </div>
      ) : null}

      <div className="space-y-2">
        <label className="label" htmlFor="comment">
          {copy.comment}
        </label>
        <textarea
          className="field min-h-24 resize-y"
          id="comment"
          name="comment"
          placeholder="Необязательно"
        />
      </div>

      {state.message ? (
        <div
          className={clsx(
            "rounded-lg border p-3 text-sm",
            state.status === "success" &&
              "border-emerald-200 bg-emerald-50 text-emerald-900",
            state.status === "warning" &&
              "border-amber-200 bg-amber-50 text-amber-900",
            state.status === "error" &&
              "border-red-200 bg-red-50 text-red-900"
          )}
        >
          <div>{state.message}</div>
          {state.correctionUrl ? (
            <Link
              className="mt-3 inline-flex font-semibold text-amber-950 underline"
              href={state.correctionUrl}
            >
              Открыть коррекцию
            </Link>
          ) : null}
        </div>
      ) : null}

      <SubmitButton>{copy.button}</SubmitButton>
    </form>
  );
}
