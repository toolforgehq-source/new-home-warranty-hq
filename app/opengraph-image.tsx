import { ImageResponse } from "next/og";

export const alt = "New Home Warranty HQ: document, send, and track builder warranty repairs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0f172a",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px 88px",
          color: "white",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="64" height="64" viewBox="0 0 40 40" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 8L4 20h4v12h8v-8h8v8h8V20h4L20 8z" />
            <path d="M14 18l3 3 6-6" stroke="#22c55e" strokeWidth="2.5" />
          </svg>
          <div style={{ display: "flex", fontSize: 34, fontWeight: 700, letterSpacing: 1 }}>
            NEW HOME WARRANTY <span style={{ color: "#22c55e", marginLeft: 10 }}>HQ</span>
          </div>
        </div>
        <div style={{ display: "flex", marginTop: 48, fontSize: 64, fontWeight: 700, lineHeight: 1.15, maxWidth: 1000 }}>
          Don&apos;t let a warranty repair slip past your builder&apos;s deadline.
        </div>
        <div style={{ display: "flex", marginTop: 32, fontSize: 30, color: "rgba(255,255,255,0.8)" }}>
          Document issues · Send builder requests · Track every repair
        </div>
      </div>
    ),
    size
  );
}
