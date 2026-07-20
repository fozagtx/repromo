"use client";

import React from "react";
import {Button, Tooltip, ScrollShadow} from "@heroui/react";
import {Icon} from "@iconify/react";
import {cn} from "@heroui/react";

import PromptInput from "./prompt-input";
import SiteLogo from "./site-logo";

const ideas = [
  {
    title: "vercel.com",
    description: "product website",
    value: "vercel.com",
  },
  {
    title: "linear.app",
    description: "saas homepage",
    value: "linear.app",
  },
  {
    title: "github.com/vercel/next.js",
    description: "open source repo",
    value: "github.com/vercel/next.js",
  },
];

type LinkPromptProps = {
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
  isLoading?: boolean;
};

export default function LinkPrompt({
  value,
  onValueChange,
  onSubmit,
  isLoading = false,
}: LinkPromptProps) {
  const canSubmit = Boolean(value.trim()) && !isLoading;

  return (
    <div className="flex w-full flex-col gap-4">
      <ScrollShadow hideScrollBar className="flex flex-nowrap gap-2" orientation="horizontal">
        <div className="flex gap-2">
          {ideas.map(({title, description, value: ideaValue}, index) => (
            <Button
              key={index}
              className="flex h-14 flex-col items-start gap-0 pl-3"
              variant="flat"
              isDisabled={isLoading}
              onPress={() => onValueChange(ideaValue)}
              startContent={<SiteLogo url={ideaValue} size={18} />}
            >
              <p>{title}</p>
              <p className="text-default-500">{description}</p>
            </Button>
          ))}
        </div>
      </ScrollShadow>

      <form
        className="flex w-full flex-col items-start rounded-medium bg-default-100 transition-colors hover:bg-default-200/70"
        onSubmit={(e) => {
          e.preventDefault();
          if (canSubmit) onSubmit();
        }}
      >
        <PromptInput
          classNames={{
            inputWrapper: "!bg-transparent shadow-none",
            innerWrapper: "relative",
            input: "pt-1 pl-2 pb-6 !pr-10 text-medium",
          }}
          endContent={
            <div className="flex items-end gap-2">
              <Tooltip showArrow content="Make demo video">
                <Button
                  isIconOnly
                  color={!canSubmit ? "default" : "primary"}
                  isDisabled={!canSubmit}
                  isLoading={isLoading}
                  radius="lg"
                  size="sm"
                  type="submit"
                  variant="solid"
                >
                  {!isLoading && (
                    <Icon
                      className={cn(
                        "[&>path]:stroke-[2px]",
                        !canSubmit ? "text-default-600" : "text-primary-foreground",
                      )}
                      icon="solar:arrow-up-linear"
                      width={20}
                    />
                  )}
                </Button>
              </Tooltip>
            </div>
          }
          minRows={2}
          radius="lg"
          value={value}
          variant="flat"
          onValueChange={onValueChange}
          isDisabled={isLoading}
          startContent={
            <span className="ml-1 flex h-5 w-5 items-center justify-center">
              <SiteLogo url={value} size={20} />
            </span>
          }
        />
        <div className="flex w-full items-center justify-between gap-2 px-4 pb-4">
          <div className="flex w-full gap-1 md:gap-3">
            <Button
              size="sm"
              startContent={
                <Icon className="text-default-500" icon="solar:link-linear" width={18} />
              }
              variant="flat"
              isDisabled
            >
              Website or GitHub
            </Button>
            <Button
              size="sm"
              className="bg-default-foreground text-background"
              radius="full"
              isDisabled={!canSubmit}
              isLoading={isLoading}
              type="submit"
              startContent={
                !isLoading ? (
                  <Icon icon="solar:videocamera-record-bold" width={16} />
                ) : undefined
              }
            >
              {isLoading ? "Making video" : "Make video"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
