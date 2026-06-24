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

export async function createProductAction(
  _previousState: { status?: string; message?: string },
  formData: FormData
) {
  await requireEmployee();

  const name = cleanText(formData.get("name"));
  const internalSku = cleanText(formData.get("internalSku"));
  const ozonOfferId = cleanText(formData.get("ozonOfferId"));
  const category = cleanText(formData.get("category"));
  const searchAliases = cleanText(formData.get("searchAliases"));
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
        searchAliases,
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

  revalidatePath("/products");
  revalidatePath("/");
  revalidatePath("/stock/add");
  revalidatePath("/stock/remove");
  revalidatePath("/stock/check");
  revalidatePath("/stock/correction");
  redirect(getProductReturnPath(returnTo, productId));
}
