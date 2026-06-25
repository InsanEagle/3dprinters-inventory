"use server";

import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireEmployee } from "@/lib/auth";
import {
  getProductReturnPath,
  parseProductReturnTarget
} from "@/lib/product-return";
import { prisma } from "@/lib/prisma";

function cleanText(value: FormDataEntryValue | null) {
  return String(value || "").trim();
}

function parseBarcodes(value: string) {
  return [
    ...new Set(
      value
        .split(/[\s,;]+/)
        .map((barcode) => barcode.trim())
        .filter(Boolean)
    )
  ];
}

function parseBoolean(value: FormDataEntryValue | null) {
  return value === "1" || value === "on" || value === "true";
}

function revalidateProductViews() {
  revalidatePath("/products");
  revalidatePath("/");
  revalidatePath("/stock/add");
  revalidatePath("/stock/remove");
  revalidatePath("/stock/check");
  revalidatePath("/stock/correction");
}

export async function createProductAction(
  _previousState: { status?: string; message?: string },
  formData: FormData
) {
  await requireEmployee();

  const name = cleanText(formData.get("name"));
  const internalSku = cleanText(formData.get("internalSku"));
  const ozonOfferId = cleanText(formData.get("ozonOfferId"));
  const category = cleanText(formData.get("category"));
  const imageUrl = cleanText(formData.get("imageUrl"));
  const searchAliases = cleanText(formData.get("searchAliases"));
  const isFavorite = parseBoolean(formData.get("isFavorite"));
  const returnTo =
    parseProductReturnTarget(cleanText(formData.get("returnTo"))) ||
    "products";
  const barcodes = parseBarcodes(
    [cleanText(formData.get("barcode")), cleanText(formData.get("barcodes"))]
      .filter(Boolean)
      .join("\n")
  );

  if (!name || !internalSku || !category) {
    return {
      status: "error",
      message: "Название, internal SKU и категория обязательны."
    };
  }

  const existingBarcode =
    barcodes.length > 0
      ? await prisma.barcode.findFirst({
          where: {
            value: {
              in: barcodes
            }
          },
          select: {
            value: true
          }
        })
      : null;

  if (existingBarcode) {
    return {
      status: "error",
      message: `Штрихкод ${existingBarcode.value} уже привязан к другому товару.`
    };
  }

  let productId = "";

  try {
    const product = await prisma.product.create({
      data: {
        name,
        internalSku,
        ozonOfferId: ozonOfferId || null,
        category,
        imageUrl: imageUrl || null,
        searchAliases,
        isFavorite,
        barcodes: {
          create: barcodes.map((value) => ({
            value
          }))
        }
      }
    });
    productId = product.id;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        status: "error",
        message: "Товар, SKU, offer ID или штрихкод уже есть в базе."
      };
    }

    throw error;
  }

  revalidateProductViews();
  redirect(getProductReturnPath(returnTo, productId));
}

export async function bindBarcodeToProductAction(
  _previousState: { status?: string; message?: string },
  formData: FormData
) {
  await requireEmployee();

  const barcode = cleanText(formData.get("barcode"));
  const productId = cleanText(formData.get("productId"));
  const returnTo =
    parseProductReturnTarget(cleanText(formData.get("returnTo"))) ||
    "products";

  if (!barcode || !productId) {
    return {
      status: "error",
      message: "Укажите штрихкод и выберите товар."
    };
  }

  const [product, existingBarcode] = await Promise.all([
    prisma.product.findUnique({
      where: {
        id: productId
      },
      select: {
        id: true
      }
    }),
    prisma.barcode.findUnique({
      where: {
        value: barcode
      },
      select: {
        productId: true
      }
    })
  ]);

  if (!product) {
    return {
      status: "error",
      message: "Товар не найден."
    };
  }

  if (existingBarcode) {
    if (existingBarcode.productId === productId) {
      revalidateProductViews();
      redirect(getProductReturnPath(returnTo, productId));
    }

    return {
      status: "error",
      message: `Штрихкод ${barcode} уже привязан к другому товару.`
    };
  }

  try {
    await prisma.barcode.create({
      data: {
        value: barcode,
        productId
      }
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        status: "error",
        message: `Штрихкод ${barcode} уже привязан к другому товару.`
      };
    }

    throw error;
  }

  revalidateProductViews();
  redirect(getProductReturnPath(returnTo, productId));
}

export async function toggleFavoriteProductAction(formData: FormData) {
  await requireEmployee();

  const productId = cleanText(formData.get("productId"));
  const isFavorite = parseBoolean(formData.get("isFavorite"));

  if (!productId) {
    return;
  }

  await prisma.product.update({
    where: {
      id: productId
    },
    data: {
      isFavorite
    }
  });

  revalidateProductViews();
}
