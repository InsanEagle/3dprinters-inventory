"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";

type ProductThumbnailProps = {
  imageUrl: string | null;
  name: string;
  className?: string;
};

function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "?";
}

export function ProductThumbnail({
  imageUrl,
  name,
  className
}: ProductThumbnailProps) {
  const [failed, setFailed] = useState(false);
  const safeImageUrl = imageUrl?.trim() || "";

  useEffect(() => {
    setFailed(false);
  }, [safeImageUrl]);

  const wrapperClassName = clsx(
    "flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 text-lg font-bold text-slate-400",
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
