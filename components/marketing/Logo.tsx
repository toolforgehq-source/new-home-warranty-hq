export function Logo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 260 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="New Home Warranty HQ"
    >
      <path
        d="M20 8L4 20h4v12h8v-8h8v8h8V20h4L20 8z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M14 18l3 3 6-6"
        stroke="#22c55e"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <text
        x="46"
        y="26"
        fill="currentColor"
        fontSize="13"
        fontWeight="700"
        fontFamily="var(--font-geist-sans), sans-serif"
      >
        NEW HOME WARRANTY{" "}
        <tspan fill="#22c55e">HQ</tspan>
      </text>
    </svg>
  );
}
