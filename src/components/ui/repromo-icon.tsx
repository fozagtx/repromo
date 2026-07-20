import type {IconSvgProps} from "./types";

import React from "react";

/** Repromo brand mark: film frame + play */
export const RepromoIcon: React.FC<IconSvgProps> = ({
  size = 32,
  width,
  height,
  ...props
}) => (
  <svg
    fill="none"
    height={size || height}
    viewBox="0 0 64 64"
    width={size || width}
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <rect width="64" height="64" rx="16" fill="currentColor" />
    <rect x="10" y="18" width="4" height="6" rx="1" fill="#FFFFFF" opacity="0.35" />
    <rect x="10" y="29" width="4" height="6" rx="1" fill="#FFFFFF" opacity="0.35" />
    <rect x="10" y="40" width="4" height="6" rx="1" fill="#FFFFFF" opacity="0.35" />
    <rect x="50" y="18" width="4" height="6" rx="1" fill="#FFFFFF" opacity="0.35" />
    <rect x="50" y="29" width="4" height="6" rx="1" fill="#FFFFFF" opacity="0.35" />
    <rect x="50" y="40" width="4" height="6" rx="1" fill="#FFFFFF" opacity="0.35" />
    <path
      d="M26 20.5v23c0 1.4 1.5 2.3 2.7 1.6l18.5-11.5a1.8 1.8 0 0 0 0-3.1L28.7 18.9A1.8 1.8 0 0 0 26 20.5Z"
      fill="#FFFFFF"
    />
  </svg>
);
