import Link from "next/link";
import { ProductsList } from "@/components/ProductsList";
import { getAllProductsWithStock } from "@/lib/stock";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const products = await getAllProductsWithStock();

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Товары</h1>
          <p className="mt-1 text-sm text-slate-600">
            Остатки показаны расчетно, из журнала движений.
          </p>
        </div>
        <Link
          className="rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-white"
          href="/products/new"
        >
          Новый
        </Link>
      </div>

      <ProductsList products={products} />
    </div>
  );
}
