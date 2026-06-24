import { StockMovementForm } from "@/components/StockMovementForm";
import { removeStockAction } from "@/app/actions/stock";
import { removeReasonOptions } from "@/lib/reasons";
import {
  getAllProductsWithStock,
  getRecentProductsWithStock
} from "@/lib/stock";

type RemoveStockPageProps = {
  searchParams?: Promise<{
    productId?: string;
  }>;
};

export default async function RemoveStockPage({
  searchParams
}: RemoveStockPageProps) {
  const params = await searchParams;
  const [products, recentProducts] = await Promise.all([
    getAllProductsWithStock(),
    getRecentProductsWithStock()
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink">Взять товар</h1>
        <p className="mt-1 text-sm text-slate-600">
          Списание в минус заблокировано. При нехватке приложение предложит
          открыть коррекцию.
        </p>
      </div>

      <div className="panel p-4">
        <StockMovementForm
          action={removeStockAction}
          initialProductId={params?.productId}
          mode="remove"
          products={products}
          reasonOptions={removeReasonOptions}
          recentProducts={recentProducts}
        />
      </div>
    </div>
  );
}
