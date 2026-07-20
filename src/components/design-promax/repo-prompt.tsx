"use client";

import React from "react";
import { Button } from "@heroui/react";
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
      className="flex w-full items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) onSubmit();
      }}
    >
      <PromptInput
        classNames={{
          inputWrapper: "pr-1.5",
          innerWrapper: "items-center gap-2",
        }}
        startContent={
          <Icon className="text-default-400" icon="mdi:github" width={22} />
        }
        endContent={
          <Button
            className="font-medium"
            color="primary"
            isDisabled={!canSubmit}
            isLoading={isLoading}
            radius="full"
            size="md"
            type="submit"
            startContent={
              !isLoading ? (
                <Icon icon="solar:videocamera-record-bold" width={18} />
              ) : undefined
            }
          >
            {isLoading ? "Working" : "Generate"}
          </Button>
        }
        value={value}
        onValueChange={onValueChange}
        placeholder="github.com/username/repository"
        isDisabled={isDisabled || isLoading}
      />
    </form>
  );
}
