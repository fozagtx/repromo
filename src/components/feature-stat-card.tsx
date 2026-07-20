"use client";

import { Card } from "@heroui/react";
import { Icon } from "@iconify/react";

type FeatureStatCardProps = {
  num: string;
  label: string;
  value: string;
  description: string;
  icon: string;
};

export function FeatureStatCard({
  num,
  label,
  value,
  description,
  icon,
}: FeatureStatCardProps) {
  return (
    <Card className="border border-white/10 bg-white/[0.03] shadow-none">
      <Card.Content className="flex h-full flex-col gap-4 p-5 text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] p-2">
            <Icon className="text-white" icon={icon} width={22} />
          </div>
          <span className="text-xs tracking-[0.2em] text-white/30">{num}</span>
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/40">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-white">
            {value}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-white/45">
            {description}
          </p>
        </div>
      </Card.Content>
    </Card>
  );
}
