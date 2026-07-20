"use client";

import { HeroUIProvider } from "@heroui/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <HeroUIProvider>
      <div className="min-h-full bg-[#F4F4F5] text-zinc-900">{children}</div>
    </HeroUIProvider>
  );
}
