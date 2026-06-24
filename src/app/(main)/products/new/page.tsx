import { ProductForm } from "@/components/ProductForm";

export default function NewProductPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink">Новый товар</h1>
        <p className="mt-1 text-sm text-slate-600">
          Заполните карточку товара. Остаток появится после первого прихода или
          коррекции.
        </p>
      </div>

      <div className="panel p-4">
        <ProductForm />
      </div>
    </div>
  );
}
