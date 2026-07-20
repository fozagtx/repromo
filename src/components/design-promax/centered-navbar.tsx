"use client";

import type { NavbarProps } from "@heroui/react";
import React from "react";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Link,
  Button,
  cn,
} from "@heroui/react";
import { Icon } from "@iconify/react";

const CenteredNavbar = React.forwardRef<HTMLElement, NavbarProps>(
  ({ classNames: { base, wrapper, ...otherClassNames } = {}, ...props }, ref) => {
    return (
      <Navbar
        ref={ref}
        classNames={{
          base: cn(
            "mx-auto w-fit max-w-full rounded-full border border-default-200/80 bg-white/90 px-1.5 py-1 shadow-sm backdrop-blur-md",
            base,
          ),
          wrapper: cn("h-auto min-h-0 gap-1 px-0", wrapper),
          ...otherClassNames,
        }}
        height="44px"
        maxWidth="full"
        position="static"
        isBlurred={false}
        {...props}
      >
        <NavbarBrand className="mr-1 max-w-fit gap-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Icon icon="solar:play-bold" width={14} />
          </div>
          <span className="ml-2 text-small font-semibold tracking-tight text-foreground">
            Repromo
          </span>
        </NavbarBrand>

        <NavbarContent className="!flex-none gap-0" justify="end">
          <NavbarItem>
            <Link
              className="px-3 text-small text-default-500 transition-colors hover:text-foreground"
              href="#features"
              size="sm"
            >
              Features
            </Link>
          </NavbarItem>
          <NavbarItem>
            <Link
              className="px-3 text-small text-default-500 transition-colors hover:text-foreground"
              href="#contact"
              size="sm"
            >
              Contact
            </Link>
          </NavbarItem>
          <NavbarItem>
            <Button
              as={Link}
              href="#generate"
              color="primary"
              className="ml-1 font-medium"
              radius="full"
              size="sm"
              endContent={
                <Icon icon="solar:alt-arrow-right-linear" width={14} />
              }
            >
              Get started
            </Button>
          </NavbarItem>
        </NavbarContent>
      </Navbar>
    );
  },
);

CenteredNavbar.displayName = "CenteredNavbar";

export default CenteredNavbar;
