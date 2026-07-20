import type {IconSvgProps} from "./types";

import React from "react";

/** Brand mark adapted from design-promax AcmeIcon tile pattern */
export const RepromoIcon: React.FC<IconSvgProps> = ({
  size = 32,
  width,
  height,
  ...props
}) => (
  <svg
    fill="none"
    height={size || height}
    viewBox="0 0 32 32"
    width={size || width}
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M12 9.2v13.6c0 .7.75 1.15 1.35.8l11-6.8a.9.9 0 0 0 0-1.55l-11-6.8A.9.9 0 0 0 12 9.2Z" fill="currentColor" />
  </svg>
);
