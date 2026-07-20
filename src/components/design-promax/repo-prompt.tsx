"use client";

import React from "react";
import { Button, Tooltip, cn } from "@heroui/react";
import { Icon } from "@iconify/react";
import PromptInput from "./prompt-input";

type RepoPromptProps = {
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
  isLoading?: boolean;
  isDisabled?: boolean;
};

export default function RepoPrompt({
  value,
  onValueChange,
  onSubmit,
  isLoading = false,
  isDisabled = false,
}: RepoPromptProps) {
  const canSubmit = Boolean(value.trim()) && !isLoading && !isDisabled;

  return (
    <form
      className="flex w-full items-start gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) onSubmit();
      }}
    >
      <PromptInput
        classNames={{
          innerWrapper: "items-center",
          input:
            "text-medium data-[has-start-content=true]:ps-0 data-[has-start-content=true]:pe-0",
          inputWrapper: "pr-1.5",
        }}
        startContent={
          <Icon className="text-default-500" icon="mdi:github" width={22} />
        }
        endContent={
          <Tooltip showArrow content="Generate promo video">
            <Button
              className="min-w-[110px] font-medium"
              color={canSubmit ? "primary" : "default"}
              isDisabled={!canSubmit}
              isLoading={isLoading}
              radius="full"
              size="sm"
              type="submit"
              variant={canSubmit ? "solid" : "flat"}
              startContent={
                !isLoading ? (
                  <Icon
                    className={cn(
                      "[&>path]:stroke-[2px]",
                      canSubmit ? "text-primary-foreground" : "text-default-500",
                    )}
                    icon="solar:stars-bold"
                    width={16}
                  />
                ) : undefined
              }
            >
              {isLoading ? "Generating" : "Generate"}
            </Button>
          </Tooltip>
        }
        value={value}
        onValueChange={onValueChange}
        placeholder="github.com/username/repository"
        isDisabled={isDisabled || isLoading}
      />
    </form>
  );
}
