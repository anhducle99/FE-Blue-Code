import React from "react";

interface Props {
  label: string;
  phone: string;
  color?: string; // cho phép truyền màu tùy chọn
  isSelected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

export default function SupportButton({
  label,
  phone,
  color = "#9333ea", // mặc định tím (giống support)
  isSelected = false,
  onClick,
  disabled = false,
}: Props) {
  const baseStyle: React.CSSProperties = {
    backgroundColor: isSelected ? "#16a34a" : color, // xanh lá khi được chọn
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "12px",
    width: "100%",
    fontWeight: 600,
    fontSize: "15px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
    transition: "none", // tắt hiệu ứng hover
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={baseStyle}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor =
          isSelected ? "#16a34a" : color;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor =
          isSelected ? "#16a34a" : color;
      }}
      onMouseDown={(e) => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor =
          isSelected ? "#16a34a" : color;
      }}
      onFocus={(e) => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor =
          isSelected ? "#16a34a" : color;
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          justifyContent: "center",
        }}
      >
        <PhoneIcon width={22} height={22} />
        <div style={{ textAlign: "left" }}>
          <div style={{ fontWeight: 700 }}>{label}</div>
          <div style={{ fontSize: "13px", marginTop: "4px" }}>{phone}</div>
        </div>
      </div>
    </button>
  );
}

function PhoneIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25
           a2.25 2.25 0 002.25-2.25v-1.372
           a1.125 1.125 0 00-.852-1.091l-4.423-1.106
           a1.125 1.125 0 00-1.173.417l-.97 1.293
           a1.125 1.125 0 01-1.21.38
           a12.035 12.035 0 01-7.143-7.143
           a1.125 1.125 0 01.38-1.21l1.293-.97
           a1.125 1.125 0 00.417-1.173L6.963 3.102
           A1.125 1.125 0 006.111 2.25H4.5
           A2.25 2.25 0 002.25 4.5v2.25z"
      />
    </svg>
  );
}
