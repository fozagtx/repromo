"use client";

import type { InputProps } from "@heroui/react";
import React from "react";
import { Input, cn } from "@heroui/react";

const PromptInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ classNames = {}, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        aria-label="Repository URL"
        classNames={{
          ...classNames,
          label: cn("hidden", classNames?.label),
          inputWrapper: cn(
            "h-14 border-default-200 bg-white shadow-none data-[hover=true]:bg-white group-data-[focus=true]:bg-white",
            classNames?.inputWrapper,
          ),
          input: cn(
            "text-medium text-foreground placeholder:text-default-400",
            classNames?.input,
          ),
        }}
        radius="lg"
        variant="bordered"
        {...props}
      />
    );
  },
);

PromptInput.displayName = "PromptInput";

export default PromptInput;
