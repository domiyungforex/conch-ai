// Shared visual for opengraph-image.tsx and twitter-image.tsx — same Conch
// shell mark used in src/components/shared/Logo.tsx, rendered for social cards.
export function BrandOgImage() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #100b06 0%, #181209 55%, #2a1c0c 100%)",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          width: 120,
          height: 120,
          borderRadius: 28,
          background: "linear-gradient(135deg, #e0a34e, #d97a56)",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 40,
          boxShadow: "0 0 80px rgba(224,163,78,0.35)",
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
      <div style={{ display: "flex", fontSize: 84, color: "#f4ead6", fontWeight: 600, letterSpacing: "-0.02em" }}>
        Conch
      </div>
      <div style={{ display: "flex", fontSize: 32, color: "#a8997c", marginTop: 18 }}>
        Own Your AI Memory
      </div>
    </div>
  );
}
