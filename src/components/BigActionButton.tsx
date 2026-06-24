import Link from "next/link";
import clsx from "clsx";

type BigActionButtonProps = {
  href: string;
  title: string;
  description: string;
  marker: string;
  tone?: "blue" | "green" | "amber" | "slate";
};

const tones = {
  blue: "bg-blue-600 text-white",
  green: "bg-emerald-600 text-white",
  amber: "bg-amber-500 text-amber-950",
  slate: "bg-ink text-white"
};

export function BigActionButton({
  href,
  title,
  description,
  marker,
  tone = "blue"
}: BigActionButtonProps) {
  return (
    <Link
      className={clsx(
        "flex min-h-32 flex-col justify-between rounded-lg p-5 shadow-soft transition active:scale-[0.99]",
        tones[tone]
      )}
      href={href}
    >
      <span className="text-3xl font-bold">{marker}</span>
      <span>
        <span className="block text-xl font-bold leading-tight">{title}</span>
        <span className="mt-2 block text-sm opacity-85">{description}</span>
      </span>
    </Link>
  );
}
