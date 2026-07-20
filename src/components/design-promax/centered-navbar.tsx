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
            "mx-auto max-w-xs rounded-full bg-default-100 px-1.5 py-[5px] shadow-[0_4px_15px_0_rgba(0,0,0,0.45)] sm:max-w-md md:max-w-fit md:pr-1.5",
            base,
          ),
          wrapper: cn("px-0 h-auto min-h-0", wrapper),
          ...otherClassNames,
        }}
        height="40px"
        maxWidth="full"
        position="static"
        isBlurred={false}
        {...props}
      >
        <NavbarBrand className="max-w-fit gap-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Icon icon="solar:play-bold" width={14} />
          </div>
          <span className="ml-2 text-small font-semibold text-foreground">
            Repromo
          </span>
        </NavbarBrand>

        <NavbarContent className="!flex-none gap-0" justify="end">
          <NavbarItem>
            <Link className="px-3 text-small text-default-500" href="#features" size="sm">
              Features
            </Link>
          </NavbarItem>
          <NavbarItem>
            <Link className="px-3 text-small text-default-500" href="#contact" size="sm">
              Contact
            </Link>
          </NavbarItem>
          <NavbarItem className="hidden sm:flex">
            <Button
              as={Link}
              href="#generate"
              className="bg-primary font-medium text-primary-foreground"
              endContent={
                <Icon
                  className="pointer-events-none"
                  icon="solar:alt-arrow-right-linear"
                  width={16}
                />
              }
              radius="full"
              size="sm"
            >
              Generate
            </Button>
          </NavbarItem>
        </NavbarContent>
      </Navbar>
    );
  },
);

CenteredNavbar.displayName = "CenteredNavbar";

export default CenteredNavbar;
