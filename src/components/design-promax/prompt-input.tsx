"use client";

import type {TextAreaProps} from "@heroui/react";

import React from "react";
import {Textarea} from "@heroui/react";
import {cn} from "@heroui/react";

const PromptInput = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({classNames = {}, ...props}, ref) => {
    return (
      <Textarea
        ref={ref}
        aria-label="Project link"
        className="min-h-[40px]"
        classNames={{
          ...classNames,
          label: cn("hidden", classNames?.label),
          input: cn("py-0", classNames?.input),
        }}
        minRows={1}
        placeholder="yoursite.com or github.com/you/app"
        radius="lg"
        variant="bordered"
        {...props}
      />
    );
  },
);

export default PromptInput;

PromptInput.displayName = "PromptInput";
