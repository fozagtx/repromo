"use client";

import { Card } from "@heroui/react";
import { Icon } from "@iconify/react";
import { cn } from "@heroui/react";

type ActionCardProps = {
  icon: string;
  title: string;
  description: string;
  className?: string;
  onPress?: () => void;
};

export function ActionCard({
  icon,
  title,
  description,
  className,
  onPress,
}: ActionCardProps) {
  return (
    <Card
      className={cn(
        "border border-white/10 bg-white/[0.03] shadow-none",
        onPress && "cursor-pointer transition hover:border-white/20 hover:bg-white/[0.05]",
        className,
      )}
      onClick={onPress}
    >
      <Card.Content className="flex h-full flex-row items-start gap-3 p-4">
        <div className="flex items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-2">
          <Icon className="text-emerald-300" icon={icon} width={22} />
        </div>
        <div className="flex min-w-0 flex-col gap-1 text-left">
          <p className="text-[15px] font-medium text-white">{title}</p>
          <p className="text-sm leading-relaxed text-white/45">{description}</p>
        </div>
      </Card.Content>
    </Card>
  );
}
