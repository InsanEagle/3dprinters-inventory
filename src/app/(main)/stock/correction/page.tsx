import { StockMovementForm } from "@/components/StockMovementForm";
import { correctionStockAction } from "@/app/actions/stock";
import {
  getAllProductsWithStock,
  getRecentProductsWithStock
} from "@/lib/stock";

type CorrectionPageProps = {
  searchParams?: Promise<{
    productId?: string;
  }>;
};

export default async function CorrectionStockPage({
  searchParams
}: CorrectionPageProps) {
  const params = await searchParams;
  const [products, recentProducts] = await Promise.all([
    getAllProductsWithStock(),
    getRecentProductsWithStock()
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink">Коррекция</h1>
        <p className="mt-1 text-sm text-slate-600">
          Остаток не редактируется напрямую: приложение добавит движение на
          разницу между расчетным и фактическим количеством.
        </p>
      </div>

      <div className="panel p-4">
        <StockMovementForm
          action={correctionStockAction}
          initialProductId={params?.productId}
          mode="correction"
          products={products}
          recentProducts={recentProducts}
        />
      </div>
    </div>
  );
}
