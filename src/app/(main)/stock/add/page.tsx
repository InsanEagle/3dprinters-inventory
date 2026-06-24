import { StockMovementForm } from "@/components/StockMovementForm";
import { addStockAction } from "@/app/actions/stock";
import {
  getAllProductsWithStock,
  getRecentProductsWithStock
} from "@/lib/stock";

export default async function AddStockPage() {
  const [products, recentProducts] = await Promise.all([
    getAllProductsWithStock(),
    getRecentProductsWithStock()
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink">Добавить готовый товар</h1>
        <p className="mt-1 text-sm text-slate-600">
          Приход записывается в журнал и увеличивает расчетный остаток.
        </p>
      </div>

      <div className="panel p-4">
        <StockMovementForm
          action={addStockAction}
          mode="add"
          products={products}
          recentProducts={recentProducts}
        />
      </div>
    </div>
  );
}
