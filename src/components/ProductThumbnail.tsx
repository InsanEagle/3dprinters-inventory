"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";

type ProductThumbnailProps = {
  imageUrl: string | null;
  name: string;
  size?: "small" | "medium" | "large";
  className?: string;
};

const sizeClasses: Record<NonNullable<ProductThumbnailProps["size"]>, string> =
  {
    small: "h-14 w-14 rounded-lg text-lg",
    medium: "h-20 w-20 rounded-xl text-2xl",
    large:
      "h-24 w-24 rounded-xl text-3xl max-[360px]:h-20 max-[360px]:w-20 max-[360px]:text-2xl"
  };

function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "?";
}

export function ProductThumbnail({
  imageUrl,
  name,
  size = "small",
  className
}: ProductThumbnailProps) {
  const [failed, setFailed] = useState(false);
  const safeImageUrl = imageUrl?.trim() || "";

  useEffect(() => {
    setFailed(false);
  }, [safeImageUrl]);

  const wrapperClassName = clsx(
    "flex shrink-0 items-center justify-center overflow-hidden bg-slate-100 font-bold text-slate-400",
    sizeClasses[size],
    className
  );

  if (!safeImageUrl || failed) {
    return (
      <div aria-hidden="true" className={wrapperClassName}>
        {getInitial(name)}
      </div>
    );
  }

  return (
    <div className={wrapperClassName}>
      {/* eslint-disable-next-line @next/next/no-img-element -- Product photos may be local paths or external URLs configured by staff. */}
      <img
        alt={`Фото товара ${name}`}
        className="h-full w-full object-cover"
        loading="lazy"
        src={safeImageUrl}
        onError={() => setFailed(true)}
      />
    </div>
  );
}
