"use server";

import { MovementKind, MovementReason, type Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireEmployee } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentStock } from "@/lib/stock";

type StockActionState = {
  status?: "success" | "error" | "warning";
  message?: string;
  correctionUrl?: string;
};

function parsePositiveInt(value: FormDataEntryValue | null) {
  const numberValue = Number(String(value || "").trim());

  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    return null;
  }

  return numberValue;
}

function parseNonNegativeInt(value: FormDataEntryValue | null) {
  const numberValue = Number(String(value || "").trim());

  if (!Number.isInteger(numberValue) || numberValue < 0) {
    return null;
  }

  return numberValue;
}

function cleanComment(value: FormDataEntryValue | null) {
  const comment = String(value || "").trim();
  return comment || null;
}

function refreshInventoryPages() {
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/stock/add");
  revalidatePath("/stock/remove");
  revalidatePath("/stock/check");
  revalidatePath("/stock/correction");
  revalidatePath("/movements");
}

const removeReasons = new Set<MovementReason>([
  MovementReason.OZON_SUPPLY,
  MovementReason.FBS,
  MovementReason.YANDEX,
  MovementReason.AVITO,
  MovementReason.CDEK,
  MovementReason.DEFECT,
  MovementReason.REWORK,
  MovementReason.OTHER
]);

type AtomicRemoveStockResult =
  | {
      status: "removed";
      productName: string;
    }
  | {
      status: "insufficient";
      stock: number;
    }
  | {
      status: "missing";
    };

type LockedProductRow = {
  name: string;
};

async function lockProductForStockChange(
  tx: Prisma.TransactionClient,
  productId: string
) {
  const rows = await tx.$queryRaw<LockedProductRow[]>`
    UPDATE "Product"
    SET "updated_at" = "updated_at"
    WHERE "id" = ${productId}
    RETURNING "name"
  `;

  return rows[0] ?? null;
}

async function removeStockAtomically({
  productId,
  employeeId,
  quantity,
  reason,
  comment,
  reference
}: {
  productId: string;
  employeeId: string;
  quantity: number;
  reason: MovementReason;
  comment: string | null;
  reference: string | null;
}): Promise<AtomicRemoveStockResult> {
  return prisma.$transaction(async (tx) => {
    // SQLite serializes writers. This no-op update starts a write transaction
    // before the stock check, so concurrent removals for the same product queue.
    const product = await lockProductForStockChange(tx, productId);

    if (!product) {
      return {
        status: "missing"
      };
    }

    const stockResult = await tx.stockMovement.aggregate({
      where: {
        productId
      },
      _sum: {
        quantityDelta: true
      }
    });
    const stock = stockResult._sum.quantityDelta ?? 0;

    if (stock < quantity) {
      return {
        status: "insufficient",
        stock
      };
    }

    const supply =
      reason === MovementReason.OZON_SUPPLY
        ? await tx.supply.create({
            data: {
              productId,
              destination: "Ozon FBO",
              reference,
              comment
            }
          })
        : null;

    await tx.stockMovement.create({
      data: {
        productId,
        employeeId,
        supplyId: supply?.id,
        kind: MovementKind.REMOVE,
        quantityDelta: -quantity,
        reason,
        comment
      }
    });

    return {
      status: "removed",
      productName: product.name
    };
  });
}

export async function addStockAction(
  _previousState: StockActionState,
  formData: FormData
): Promise<StockActionState> {
  const employee = await requireEmployee();
  const productId = String(formData.get("productId") || "");
  const quantity = parsePositiveInt(formData.get("quantity"));

  if (!productId || !quantity) {
    return {
      status: "error",
      message: "Выберите товар и укажите количество больше нуля."
    };
  }

  await prisma.stockMovement.create({
    data: {
      productId,
      employeeId: employee.id,
      kind: MovementKind.ADD,
      quantityDelta: quantity,
      reason: MovementReason.READY_PRODUCT,
      comment: cleanComment(formData.get("comment"))
    }
  });

  refreshInventoryPages();

  return {
    status: "success",
    message: `Готовый товар добавлен: +${quantity} шт.`
  };
}

export async function removeStockAction(
  _previousState: StockActionState,
  formData: FormData
): Promise<StockActionState> {
  const employee = await requireEmployee();
  const productId = String(formData.get("productId") || "");
  const quantity = parsePositiveInt(formData.get("quantity"));
  const reasonValue = String(formData.get("reason") || "");
  const reason = reasonValue as MovementReason;

  if (!productId || !quantity || !removeReasons.has(reason)) {
    return {
      status: "error",
      message: "Выберите товар, количество и причину расхода."
    };
  }

  const comment = cleanComment(formData.get("comment"));
  const reference = cleanComment(formData.get("reference"));

  const result = await removeStockAtomically({
    productId,
    employeeId: employee.id,
    quantity,
    reason,
    comment,
    reference
  });

  if (result.status === "missing") {
    return {
      status: "error",
      message: "Товар не найден."
    };
  }

  if (result.status === "insufficient") {
    return {
      status: "warning",
      message: `Недостаточно товара. Сейчас доступно ${result.stock} шт., списать нужно ${quantity} шт.`,
      correctionUrl: `/stock/correction?productId=${encodeURIComponent(productId)}`
    };
  }

  refreshInventoryPages();

  return {
    status: "success",
    message: `${result.productName}: списано ${quantity} шт.`
  };
}

export async function correctionStockAction(
  _previousState: StockActionState,
  formData: FormData
): Promise<StockActionState> {
  const employee = await requireEmployee();
  const productId = String(formData.get("productId") || "");
  const actualQuantity = parseNonNegativeInt(formData.get("actualQuantity"));

  if (!productId || actualQuantity === null) {
    return {
      status: "error",
      message: "Выберите товар и укажите фактический остаток."
    };
  }

  const [stock, product] = await Promise.all([
    getCurrentStock(productId),
    prisma.product.findUnique({
      where: {
        id: productId
      },
      select: {
        name: true
      }
    })
  ]);

  if (!product) {
    return {
      status: "error",
      message: "Товар не найден."
    };
  }

  const delta = actualQuantity - stock;
  const comment = cleanComment(formData.get("comment"));
  const auditComment = [
    `Коррекция: было ${stock} шт., стало ${actualQuantity} шт.`,
    comment
  ]
    .filter(Boolean)
    .join(" ");

  await prisma.stockMovement.create({
    data: {
      productId,
      employeeId: employee.id,
      kind: MovementKind.CORRECTION,
      quantityDelta: delta,
      reason: MovementReason.INVENTORY_CORRECTION,
      comment: auditComment
    }
  });

  refreshInventoryPages();

  return {
    status: "success",
    message:
      delta === 0
        ? `${product.name}: остаток подтвержден без изменения.`
        : `${product.name}: добавлена коррекция ${delta > 0 ? "+" : ""}${delta} шт.`
  };
}
