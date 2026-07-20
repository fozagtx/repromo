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
        className="min-h-[40px]"
        classNames={{
          ...classNames,
          label: cn("hidden", classNames?.label),
          inputWrapper: cn(
            "bg-default-100 border-default-200 shadow-none",
            classNames?.inputWrapper,
          ),
          input: cn("py-0 text-small", classNames?.input),
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
