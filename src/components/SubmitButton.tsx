"use client";

import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  children: React.ReactNode;
};

export function SubmitButton({ children }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button className="primary-button" type="submit" disabled={pending}>
      {pending ? "Сохраняем..." : children}
    </button>
  );
}
