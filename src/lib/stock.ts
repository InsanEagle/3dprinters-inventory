import "server-only";

import type { Prisma } from "@prisma/client";
import type { ProductForPicker } from "@/lib/product-types";
import { prisma } from "@/lib/prisma";

type ProductRecord = Prisma.ProductGetPayload<{
  include: {
    barcodes: true;
  };
}>;

function toPickerProduct(product: ProductRecord, stock: number): ProductForPicker {
  return {
    id: product.id,
    name: product.name,
    internalSku: product.internalSku,
    ozonOfferId: product.ozonOfferId,
    category: product.category,
    imageUrl: product.imageUrl,
    searchAliases: product.searchAliases,
    isFavorite: product.isFavorite,
    stock,
    barcodes: product.barcodes.map((barcode) => ({
      value: barcode.value
    }))
  };
}

async function withStock(products: ProductRecord[]) {
  if (products.length === 0) {
    return [];
  }

  const totals = await prisma.stockMovement.groupBy({
    by: ["productId"],
    where: {
      productId: {
        in: products.map((product) => product.id)
      }
    },
    _sum: {
      quantityDelta: true
    }
  });

  const stockByProductId = new Map(
    totals.map((total) => [
      total.productId,
      total._sum.quantityDelta ?? 0
    ])
  );

  return products.map((product) =>
    toPickerProduct(product, stockByProductId.get(product.id) ?? 0)
  );
}

export async function getAllProductsWithStock() {
  const products = await prisma.product.findMany({
    where: {
      isActive: true
    },
    include: {
      barcodes: {
        orderBy: {
          createdAt: "asc"
        }
      }
    },
    orderBy: [
      {
        category: "asc"
      },
      {
        name: "asc"
      }
    ]
  });

  return withStock(products);
}

export async function getRecentProductsWithStock(limit = 12) {
  const movements = await prisma.stockMovement.findMany({
    take: 100,
    orderBy: {
      createdAt: "desc"
    },
    include: {
      product: {
        include: {
          barcodes: {
            orderBy: {
              createdAt: "asc"
            }
          }
        }
      }
    }
  });

  const uniqueProducts = new Map<string, ProductRecord>();

  for (const movement of movements) {
    if (movement.product.isActive && !uniqueProducts.has(movement.productId)) {
      uniqueProducts.set(movement.productId, movement.product);
    }

    if (uniqueProducts.size >= limit) {
      break;
    }
  }

  return withStock([...uniqueProducts.values()]);
}

export async function getFavoriteProductsWithStock(limit = 12) {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      isFavorite: true
    },
    include: {
      barcodes: {
        orderBy: {
          createdAt: "asc"
        }
      }
    },
    orderBy: [
      {
        category: "asc"
      },
      {
        name: "asc"
      }
    ],
    take: limit
  });

  return withStock(products);
}

export async function getCurrentStock(productId: string) {
  const result = await prisma.stockMovement.aggregate({
    where: {
      productId
    },
    _sum: {
      quantityDelta: true
    }
  });

  return result._sum.quantityDelta ?? 0;
}

export async function getInventorySummary() {
  const [productsCount, totals] = await Promise.all([
    prisma.product.count({
      where: {
        isActive: true
      }
    }),
    prisma.stockMovement.aggregate({
      _sum: {
        quantityDelta: true
      }
    })
  ]);

  return {
    productsCount,
    totalUnits: totals._sum.quantityDelta ?? 0
  };
}
