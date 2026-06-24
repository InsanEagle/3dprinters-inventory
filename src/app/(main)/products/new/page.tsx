import { ProductForm } from "@/components/ProductForm";
import { parseProductReturnTarget } from "@/lib/product-return";

type NewProductPageProps = {
  searchParams?: Promise<{
    barcode?: string;
    name?: string;
    returnTo?: string;
  }>;
};

export default async function NewProductPage({
  searchParams
}: NewProductPageProps) {
  const params = await searchParams;
  const returnTo = parseProductReturnTarget(params?.returnTo || "") || "products";

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink">Новый товар</h1>
        <p className="mt-1 text-sm text-slate-600">
          Заполните минимум: название, internal SKU и категорию. Остаток
          появится после первого прихода или коррекции.
        </p>
      </div>

      <div className="panel p-4">
        <ProductForm
          initialBarcode={params?.barcode || ""}
          initialName={params?.name || ""}
          returnTo={returnTo}
        />
      </div>
    </div>
  );
}
