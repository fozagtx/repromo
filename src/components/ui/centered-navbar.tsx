"use client";

import type {NavbarProps} from "@heroui/react";

import React from "react";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Link,
  Button,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
  Divider,
  cn,
} from "@heroui/react";
import {Icon} from "@iconify/react";

import {RepromoIcon} from "./repromo-icon";

const menuItems = [
  {label: "Home", href: "#generate"},
  {label: "Features", href: "#features"},
  {label: "GitHub", href: "https://github.com/fozagtx/repromo", external: true},
] as const;

const CenteredNavbar = React.forwardRef<HTMLElement, NavbarProps>(
  ({classNames: {base, wrapper, ...otherClassNames} = {}, ...props}, ref) => {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    return (
      <Navbar
        ref={ref}
        classNames={{
          base: cn(
            "max-w-xs sm:max-w-md md:max-w-screen-sm mx-auto bg-default-foreground rounded-full px-1.5 pr-[18px] md:pr-1.5 py-[5px] top-12 shadow-[0_4px_15px_0_rgba(0,0,0,0.25)]",
            base,
          ),
          wrapper: cn("px-0", wrapper),
          ...otherClassNames,
        }}
        height="40px"
        isMenuOpen={isMenuOpen}
        position="static"
        onMenuOpenChange={setIsMenuOpen}
        {...props}
      >
        <NavbarBrand>
          <RepromoIcon className="text-default-foreground" size={34} />
          <span className="ml-2 text-small font-medium text-background">Repromo</span>
        </NavbarBrand>

        <NavbarContent className="hidden md:flex" justify="center">
          <NavbarItem isActive>
            <Link aria-current="page" className="text-background" href="#generate" size="sm">
              Home
            </Link>
          </NavbarItem>
          <NavbarItem>
            <Link className="text-default-400" href="#features" size="sm">
              Features
            </Link>
          </NavbarItem>
          <NavbarItem>
            <Link
              isExternal
              className="text-default-400"
              href="https://github.com/fozagtx/repromo"
              size="sm"
            >
              GitHub
            </Link>
          </NavbarItem>
        </NavbarContent>

        <NavbarContent className="hidden md:flex" justify="end">
          <NavbarItem>
            <Button
              as={Link}
              href="#generate"
              className="bg-background font-medium text-default-foreground"
              endContent={
                <Icon className="pointer-events-none" icon="solar:alt-arrow-right-linear" />
              }
              radius="full"
            >
              Get Started
            </Button>
          </NavbarItem>
        </NavbarContent>

        <NavbarMenuToggle className="text-default-400 md:hidden" />

        <NavbarMenu
          className="bottom-0 top-[initial] max-h-fit rounded-t-2xl bg-default-200/50 pb-6 pt-6 shadow-medium backdrop-blur-md backdrop-saturate-150"
          motionProps={{
            initial: {y: "100%"},
            animate: {y: 0},
            exit: {y: "100%"},
            transition: {type: "spring", bounce: 0, duration: 0.3},
          }}
        >
          {menuItems.map((item, index) => (
            <NavbarMenuItem key={`${item.label}-${index}`}>
              <Link
                className="mb-2 w-full text-default-500"
                href={item.href}
                isExternal={"external" in item && item.external}
                size="md"
                onPress={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
              {index < menuItems.length - 1 && <Divider className="opacity-50" />}
            </NavbarMenuItem>
          ))}
          <NavbarMenuItem className="mb-4">
            <Button
              fullWidth
              as={Link}
              className="bg-foreground text-background"
              href="#generate"
              radius="full"
            >
              Get Started
            </Button>
          </NavbarMenuItem>
        </NavbarMenu>
      </Navbar>
    );
  },
);

CenteredNavbar.displayName = "CenteredNavbar";

export default CenteredNavbar;
