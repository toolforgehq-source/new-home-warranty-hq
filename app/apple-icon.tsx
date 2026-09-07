import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0f172a",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width="120"
          height="120"
          viewBox="0 0 40 40"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 8L4 20h4v12h8v-8h8v8h8V20h4L20 8z" />
          <path d="M14 18l3 3 6-6" stroke="#22c55e" strokeWidth="2.5" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
