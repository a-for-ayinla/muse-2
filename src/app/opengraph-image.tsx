import { ImageResponse } from "next/og";

export const alt = "Muse — Your sound. Your culture. Your AI.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 28,
          background: "#0E0F0C",
          padding: 96,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div
            style={{
              width: 128,
              height: 128,
              borderRadius: 40,
              background: "#C8FF2E",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg viewBox="0 0 48 48" width="96" height="96">
              <path
                d="M12 35V17l12 12 12-12v18"
                fill="none"
                stroke="#0E0F0C"
                strokeWidth="5.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="24" cy="13" r="3.6" fill="#0E0F0C" />
            </svg>
          </div>
          <div style={{ fontSize: 120, fontWeight: 800, color: "#F4EFE4", letterSpacing: -4 }}>muse</div>
        </div>
        <div style={{ fontSize: 44, color: "#C8FF2E", fontWeight: 600 }}>
          Your sound. Your culture. Your AI.
        </div>
        <div style={{ fontSize: 28, color: "#B4B6A6" }}>
          A Nigerian AI music companion — grounded in a real catalog.
        </div>
      </div>
    ),
    size,
  );
}
