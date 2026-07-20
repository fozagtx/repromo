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
  const looksLikeGithub = value.toLowerCase().includes("github.com");

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
          <Icon
            className="text-default-400"
            icon={looksLikeGithub ? "mdi:github" : "solar:global-linear"}
            width={22}
          />
        }
        endContent={
          <Button
            className="bg-zinc-900 font-medium text-white data-[hover=true]:bg-zinc-800"
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
            {isLoading ? "Working" : "Make video"}
          </Button>
        }
        value={value}
        onValueChange={onValueChange}
        placeholder="yoursite.com or github.com/you/app"
        isDisabled={isDisabled || isLoading}
      />
    </form>
  );
}
