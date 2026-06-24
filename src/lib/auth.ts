import "server-only";

import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireServerEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "fbo_inventory_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;
const AUTH_SECRET = requireServerEnv("AUTH_SECRET");
const PIN_HASH_SECRET = requireServerEnv("PIN_HASH_SECRET");

export function hashPin(pin: string) {
  return crypto.createHmac("sha256", PIN_HASH_SECRET).update(pin).digest("hex");
}

function signSession(employeeId: string, expiresAt: number) {
  return crypto
    .createHmac("sha256", AUTH_SECRET)
    .update(`${employeeId}.${expiresAt}`)
    .digest("hex");
}

function isValidSignature(actual: string, expected: string) {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);

  return (
    actualBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

export async function setEmployeeSession(employeeId: string) {
  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
  const signature = signSession(employeeId, expiresAt);
  const cookieStore = await cookies();

  cookieStore.set({
    name: SESSION_COOKIE,
    value: `${employeeId}.${expiresAt}.${signature}`,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS
  });
}

export async function clearEmployeeSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentEmployee() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const [employeeId, expiresRaw, signature] = token.split(".");
  const expiresAt = Number(expiresRaw);

  if (!employeeId || !Number.isFinite(expiresAt) || expiresAt < Date.now()) {
    return null;
  }

  const expectedSignature = signSession(employeeId, expiresAt);

  if (!signature || !isValidSignature(signature, expectedSignature)) {
    return null;
  }

  return prisma.employee.findFirst({
    where: {
      id: employeeId,
      isActive: true
    },
    select: {
      id: true,
      name: true,
      role: true
    }
  });
}

export async function requireEmployee() {
  const employee = await getCurrentEmployee();

  if (!employee) {
    redirect("/login");
  }

  return employee;
}
