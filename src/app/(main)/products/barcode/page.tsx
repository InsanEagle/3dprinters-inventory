import Link from "next/link";
import { BindBarcodeForm } from "@/components/BindBarcodeForm";
import { parseProductReturnTarget } from "@/lib/product-return";
import {
  getAllProductsWithStock,
  getFavoriteProductsWithStock,
  getRecentProductsWithStock
} from "@/lib/stock";

type BarcodePageProps = {
  searchParams?: Promise<{
    barcode?: string;
    returnTo?: string;
  }>;
};

export default async function BindBarcodePage({
  searchParams
}: BarcodePageProps) {
  const params = await searchParams;
  const barcode = (params?.barcode || "").trim();
  const returnTo = parseProductReturnTarget(params?.returnTo || "") || "products";
  const [products, recentProducts, favoriteProducts] = await Promise.all([
    getAllProductsWithStock(),
    getRecentProductsWithStock(),
    getFavoriteProductsWithStock()
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink">
          Привязать штрихкод
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Найдите существующий товар и сохраните этот код в его карточке.
        </p>
      </div>

      {barcode ? (
        <div className="panel p-4">
          <BindBarcodeForm
            barcode={barcode}
            favoriteProducts={favoriteProducts}
            products={products}
            recentProducts={recentProducts}
            returnTo={returnTo}
          />
        </div>
      ) : (
        <div className="space-y-3 rounded-lg border border-dashed border-slate-300 bg-white p-4">
          <div>
            <div className="font-semibold text-ink">Штрихкод не указан</div>
            <p className="mt-1 text-sm text-slate-500">
              Вернитесь к поиску товара и введите или отсканируйте код еще раз.
            </p>
          </div>
          <Link className="secondary-button" href="/products">
            К товарам
          </Link>
        </div>
      )}
    </div>
  );
}
