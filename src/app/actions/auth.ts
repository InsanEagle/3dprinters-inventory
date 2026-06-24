"use server";

import { redirect } from "next/navigation";
import { clearEmployeeSession, hashPin, setEmployeeSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function loginAction(
  _previousState: { status?: string; message?: string },
  formData: FormData
) {
  const pin = String(formData.get("pin") || "").trim();

  if (!/^\d{4,8}$/.test(pin)) {
    return {
      status: "error",
      message: "Введите PIN из 4-8 цифр."
    };
  }

  const employee = await prisma.employee.findFirst({
    where: {
      pinHash: hashPin(pin),
      isActive: true
    },
    select: {
      id: true
    }
  });

  if (!employee) {
    return {
      status: "error",
      message: "PIN не найден или сотрудник отключен."
    };
  }

  await setEmployeeSession(employee.id);
  redirect("/");
}

export async function logoutAction() {
  await clearEmployeeSession();
  redirect("/login");
}
