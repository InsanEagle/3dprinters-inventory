import { CheckStockPanel } from "@/components/CheckStockPanel";
import {
  getAllProductsWithStock,
  getRecentProductsWithStock
} from "@/lib/stock";

type CheckStockPageProps = {
  searchParams?: Promise<{
    productId?: string;
  }>;
};

export default async function CheckStockPage({
  searchParams
}: CheckStockPageProps) {
  const params = await searchParams;
  const [products, recentProducts] = await Promise.all([
    getAllProductsWithStock(),
    getRecentProductsWithStock()
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink">Проверить остаток</h1>
        <p className="mt-1 text-sm text-slate-600">
          Найдите товар вручную или ускорьтесь сканированием штрихкода.
        </p>
      </div>

      <div className="panel p-4">
        <CheckStockPanel
          initialProductId={params?.productId}
          products={products}
          recentProducts={recentProducts}
        />
      </div>
    </div>
  );
}
