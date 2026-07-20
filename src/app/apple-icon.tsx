import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#18181B",
          borderRadius: 40,
        }}
      >
        <div
          style={{
            width: 0,
            height: 0,
            borderTop: "36px solid transparent",
            borderBottom: "36px solid transparent",
            borderLeft: "58px solid #FFFFFF",
            marginLeft: 10,
          }}
        />
      </div>
    ),
    size,
  );
}
