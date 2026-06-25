"use client";

import { useActionState } from "react";
import { bindBarcodeToProductAction } from "@/app/actions/products";
import type { ProductForPicker } from "@/lib/product-types";
import type { ProductReturnTarget } from "@/lib/product-return";
import { ProductPicker } from "@/components/ProductPicker";
import { SubmitButton } from "@/components/SubmitButton";

type BindBarcodeFormProps = {
  barcode: string;
  returnTo: ProductReturnTarget;
  products: ProductForPicker[];
  recentProducts: ProductForPicker[];
  favoriteProducts: ProductForPicker[];
};

export function BindBarcodeForm({
  barcode,
  returnTo,
  products,
  recentProducts,
  favoriteProducts
}: BindBarcodeFormProps) {
  const [state, formAction] = useActionState(bindBarcodeToProductAction, {
    status: "",
    message: ""
  });

  return (
    <form action={formAction} className="space-y-5">
      <input name="barcode" type="hidden" value={barcode} />
      <input name="returnTo" type="hidden" value={returnTo} />

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="text-sm font-semibold text-accent">Штрихкод</div>
        <div className="mt-1 break-all text-lg font-bold text-ink">
          {barcode}
        </div>
      </div>

      <ProductPicker
        createProductReturnTo={returnTo}
        favoriteProducts={favoriteProducts}
        products={products}
        recentProducts={recentProducts}
      />

      {state.message ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
          {state.message}
        </div>
      ) : null}

      <SubmitButton>Привязать штрихкод</SubmitButton>
    </form>
  );
}
