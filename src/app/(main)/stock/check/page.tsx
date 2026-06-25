import { CheckStockPanel } from "@/components/CheckStockPanel";
import {
  getAllProductsWithStock,
  getFavoriteProductsWithStock,
  getRecentProductsWithStock
} from "@/lib/stock";

export const dynamic = "force-dynamic";

type CheckStockPageProps = {
  searchParams?: Promise<{
    productId?: string;
  }>;
};

export default async function CheckStockPage({
  searchParams
}: CheckStockPageProps) {
  const params = await searchParams;
  const [products, recentProducts, favoriteProducts] = await Promise.all([
    getAllProductsWithStock(),
    getRecentProductsWithStock(),
    getFavoriteProductsWithStock()
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
          favoriteProducts={favoriteProducts}
          initialProductId={params?.productId}
          products={products}
          recentProducts={recentProducts}
        />
      </div>
    </div>
  );
}
