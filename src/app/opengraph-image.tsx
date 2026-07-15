import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Conch — Own Your AI Memory";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0a1613 0%, #0d1a17 55%, #16231f 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            width: 120,
            height: 120,
            borderRadius: 28,
            background: "linear-gradient(135deg, #c05f47, #9c7530)",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 40,
            boxShadow: "0 0 80px rgba(226,145,127,0.35)",
          }}
        >
          <svg width="66" height="66" viewBox="0 0 24 24" fill="none">
            <path
              d="M13.2 20c-4.6 0-7.7-3.4-7.7-7.3 0-3.2 2.3-5.6 5.2-5.6 2.4 0 4.1 1.7 4.1 3.9 0 1.8-1.2 3.1-2.8 3.1-1.3 0-2.2-.9-2.2-2.1 0-.9.6-1.6 1.5-1.6"
              stroke="white"
              strokeWidth="1.8"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </div>
        <div style={{ display: "flex", fontSize: 84, color: "#f2e8e0", fontWeight: 600, letterSpacing: "-0.02em" }}>
          Conch
        </div>
        <div style={{ display: "flex", fontSize: 32, color: "#a89c92", marginTop: 18 }}>
          Own Your AI Memory
        </div>
      </div>
    ),
    { ...size }
  );
}
