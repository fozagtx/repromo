"use client";

import React from "react";
import {Icon} from "@iconify/react";

function extractHostname(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    const withProtocol =
      trimmed.startsWith("http://") || trimmed.startsWith("https://")
        ? trimmed
        : `https://${trimmed.replace(/^\/+/, "")}`;
    const host = new URL(withProtocol).hostname.replace(/^www\./, "");
    if (!host || !host.includes(".")) return null;
    return host;
  } catch {
    return null;
  }
}

export function faviconUrl(input: string, size = 64): string | null {
  const host = extractHostname(input);
  if (!host) return null;
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=${size}`;
}

type SiteLogoProps = {
  url: string;
  size?: number;
  className?: string;
};

export default function SiteLogo({url, size = 20, className}: SiteLogoProps) {
  const src = faviconUrl(url, Math.max(size * 2, 64));
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <Icon
        className={className ?? "text-default-500"}
        icon="solar:link-linear"
        width={size}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt=""
      className={className ?? "shrink-0 rounded-sm object-contain"}
      height={size}
      src={src}
      width={size}
      onError={() => setFailed(true)}
    />
  );
}
