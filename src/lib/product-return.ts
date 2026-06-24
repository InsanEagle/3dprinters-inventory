export const productReturnTargets = [
  "products",
  "stock-add",
  "stock-remove",
  "stock-check",
  "stock-correction"
] as const;

export type ProductReturnTarget = (typeof productReturnTargets)[number];

export function parseProductReturnTarget(
  value: string
): ProductReturnTarget | null {
  return productReturnTargets.includes(value as ProductReturnTarget)
    ? (value as ProductReturnTarget)
    : null;
}

export function getNewProductHref(
  returnTo: ProductReturnTarget,
  values: {
    name?: string;
    barcode?: string;
  } = {}
) {
  const params = new URLSearchParams({
    returnTo
  });

  if (values.name?.trim()) {
    params.set("name", values.name.trim());
  }

  if (values.barcode?.trim()) {
    params.set("barcode", values.barcode.trim());
  }

  return `/products/new?${params.toString()}`;
}

export function getProductReturnPath(
  returnTo: ProductReturnTarget,
  productId: string
) {
  const encodedProductId = encodeURIComponent(productId);

  switch (returnTo) {
    case "stock-add":
      return `/stock/add?productId=${encodedProductId}`;
    case "stock-remove":
      return `/stock/remove?productId=${encodedProductId}`;
    case "stock-check":
      return `/stock/check?productId=${encodedProductId}`;
    case "stock-correction":
      return `/stock/correction?productId=${encodedProductId}`;
    case "products":
    default:
      return "/products";
  }
}
