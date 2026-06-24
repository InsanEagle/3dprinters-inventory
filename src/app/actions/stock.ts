"use server";

import { MovementKind, MovementReason } from "@prisma/client";
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

  if (stock < quantity) {
    return {
      status: "warning",
      message: `Недостаточно товара. Сейчас доступно ${stock} шт., списать нужно ${quantity} шт.`,
      correctionUrl: `/stock/correction?productId=${encodeURIComponent(productId)}`
    };
  }

  const comment = cleanComment(formData.get("comment"));
  const reference = cleanComment(formData.get("reference"));

  const supply =
    reason === MovementReason.OZON_SUPPLY
      ? await prisma.supply.create({
          data: {
            productId,
            destination: "Ozon FBO",
            reference,
            comment
          }
        })
      : null;

  await prisma.stockMovement.create({
    data: {
      productId,
      employeeId: employee.id,
      supplyId: supply?.id,
      kind: MovementKind.REMOVE,
      quantityDelta: -quantity,
      reason,
      comment
    }
  });

  refreshInventoryPages();

  return {
    status: "success",
    message: `${product.name}: списано ${quantity} шт.`
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
