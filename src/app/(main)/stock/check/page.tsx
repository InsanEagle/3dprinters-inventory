import { CheckStockPanel } from "@/components/CheckStockPanel";
import {
  getAllProductsWithStock,
  getRecentProductsWithStock
} from "@/lib/stock";

export default async function CheckStockPage() {
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
        <CheckStockPanel products={products} recentProducts={recentProducts} />
      </div>
    </div>
  );
}
