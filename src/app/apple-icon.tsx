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
        {/* film sprockets */}
        <div
          style={{
            position: "absolute",
            left: 28,
            top: 48,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 12,
                height: 16,
                borderRadius: 3,
                background: "rgba(255,255,255,0.35)",
              }}
            />
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            right: 28,
            top: 48,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 12,
                height: 16,
                borderRadius: 3,
                background: "rgba(255,255,255,0.35)",
              }}
            />
          ))}
        </div>
        <div
          style={{
            width: 0,
            height: 0,
            borderTop: "32px solid transparent",
            borderBottom: "32px solid transparent",
            borderLeft: "52px solid #FFFFFF",
            marginLeft: 8,
          }}
        />
      </div>
    ),
    size,
  );
}
