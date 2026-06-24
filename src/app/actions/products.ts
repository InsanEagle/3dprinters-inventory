"use server";

import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireEmployee } from "@/lib/auth";
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
  const barcodes = parseBarcodes(cleanText(formData.get("barcodes")));

  if (!name || !internalSku || !category) {
    return {
      status: "error",
      message: "Название, internal SKU и категория обязательны."
    };
  }

  try {
    await prisma.product.create({
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
  redirect("/products");
}
