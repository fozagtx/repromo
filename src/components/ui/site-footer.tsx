"use client";

import {Divider, Link} from "@heroui/react";
import {Icon} from "@iconify/react";
import {RepromoIcon} from "./repromo-icon";

export default function SiteFooter() {
  return (
    <footer id="contact" className="z-20 mt-16 w-full">
      <Divider className="mb-8 opacity-60" />
      <div className="flex flex-col items-center justify-between gap-4 pb-10 sm:flex-row">
        <div className="flex items-center gap-2">
          <RepromoIcon className="text-default-foreground" size={28} />
          <span className="text-small font-medium text-foreground">Repromo</span>
        </div>

        <p className="text-center text-tiny text-default-400 sm:text-left">
          You built the app. We make the demo.
        </p>

        <div className="flex items-center gap-4">
          <Link
            isExternal
            className="text-default-400"
            href="https://github.com/fozagtx/repromo"
            size="sm"
          >
            <Icon icon="mdi:github" width={20} />
            <span className="sr-only">GitHub</span>
          </Link>
          <p className="text-tiny text-default-400">
            &copy; {new Date().getFullYear()} Repromo
          </p>
        </div>
      </div>
    </footer>
  );
}
