"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth";
import { SubmitButton } from "@/components/SubmitButton";

type LoginFormProps = {
  showSeedHint?: boolean;
};

export function LoginForm({ showSeedHint = false }: LoginFormProps) {
  const [state, formAction] = useActionState(loginAction, {
    status: "",
    message: ""
  });

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <label className="label" htmlFor="pin">
          PIN сотрудника
        </label>
        <input
          autoComplete="one-time-code"
          autoFocus
          className="field text-center text-2xl font-bold tracking-[0.35em]"
          id="pin"
          inputMode="numeric"
          maxLength={8}
          name="pin"
          pattern="[0-9]*"
          placeholder="••••"
          required
          type="password"
        />
      </div>

      {state.message ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
          {state.message}
        </div>
      ) : null}

      <SubmitButton>Войти</SubmitButton>

      {showSeedHint ? (
        <div className="rounded-lg bg-slate-100 p-3 text-sm text-slate-600">
          Seed-доступы для проверки: Анна 1111, Борис 2222.
        </div>
      ) : null}
    </form>
  );
}
