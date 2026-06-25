import { redirect } from "next/navigation";
import { getCurrentEmployee } from "@/lib/auth";
import { LoginForm } from "@/app/login/LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const employee = await getCurrentEmployee();

  if (employee) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4 py-8">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        <div className="mb-6">
          <div className="text-sm font-semibold uppercase tracking-wide text-accent">
            FBO Inventory
          </div>
          <h1 className="mt-2 text-2xl font-bold text-ink">
            Вход по PIN-коду
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Быстрый доступ для сотрудников производства без платных сервисов.
          </p>
        </div>

        <LoginForm />
      </div>
    </main>
  );
}
