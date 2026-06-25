import Link from "next/link";
import { StockMovementForm } from "@/components/StockMovementForm";
import { correctionStockAction } from "@/app/actions/stock";
import {
  getAllProductsWithStock,
  getFavoriteProductsWithStock,
  getRecentProductsWithStock
} from "@/lib/stock";

export const dynamic = "force-dynamic";

type CorrectionPageProps = {
  searchParams?: Promise<{
    productId?: string;
  }>;
};

export default async function CorrectionStockPage({
  searchParams
}: CorrectionPageProps) {
  const params = await searchParams;
  const [products, recentProducts, favoriteProducts] = await Promise.all([
    getAllProductsWithStock(),
    getRecentProductsWithStock(),
    getFavoriteProductsWithStock()
  ]);

  return (
    <div className="space-y-5">
      <div>
        <Link
          className="mb-3 inline-flex rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-accent active:scale-[0.99]"
          href="/"
        >
          ← На главную
        </Link>
        <h1 className="text-2xl font-bold text-ink">Коррекция</h1>
        <p className="mt-1 text-sm text-slate-600">
          Остаток не редактируется напрямую: приложение добавит движение на
          разницу между расчетным и фактическим количеством.
        </p>
      </div>

      <div className="panel p-4">
        <StockMovementForm
          action={correctionStockAction}
          favoriteProducts={favoriteProducts}
          initialProductId={params?.productId}
          mode="correction"
          products={products}
          recentProducts={recentProducts}
        />
      </div>
    </div>
  );
}
