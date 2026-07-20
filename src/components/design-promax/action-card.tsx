"use client";

import type { CardProps } from "@heroui/react";
import React from "react";
import { Card, CardBody, cn } from "@heroui/react";
import { Icon } from "@iconify/react";

export type ActionCardProps = CardProps & {
  icon: string;
  title: string;
  description: string;
  color?: "primary" | "default";
};

const ActionCard = React.forwardRef<HTMLDivElement, ActionCardProps>(
  ({ color = "primary", title, icon, description, className, ...props }, ref) => {
    return (
      <Card
        ref={ref}
        className={cn(
          "border-small border-default-200 bg-white shadow-sm",
          className,
        )}
        shadow="none"
        {...props}
      >
        <CardBody className="flex h-full flex-row items-start gap-3 p-4">
          <div
            className={cn(
              "flex items-center justify-center rounded-medium border p-2",
              color === "primary"
                ? "border-primary-100 bg-primary-50"
                : "border-default-100 bg-default-50",
            )}
          >
            <Icon
              className={color === "primary" ? "text-primary" : "text-default-500"}
              icon={icon}
              width={24}
            />
          </div>
          <div className="flex min-w-0 flex-col text-left">
            <p className="text-medium font-medium text-foreground">{title}</p>
            <p className="mt-1 text-small text-default-500">{description}</p>
          </div>
        </CardBody>
      </Card>
    );
  },
);

ActionCard.displayName = "ActionCard";

export default ActionCard;
