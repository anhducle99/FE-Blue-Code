import React from "react";

interface Props {
  label: string;
  phone: string;
  color: string; // ví dụ: "bg-purple-600" hoặc mã màu hex "#9333ea"
  isSelected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

export default function SupportButton({
  label,
  phone,
  color,
  isSelected = false,
  onClick,
  disabled = false,
}: Props) {
  // Nếu color là class tailwind (bắt đầu bằng "bg-"), ta không convert
  const isTailwindColor = color.startsWith("bg-");
  const backgroundColor = isTailwindColor ? undefined : color;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        backgroundColor: isTailwindColor
          ? undefined
          : isSelected
          ? "#16a34a" // xanh khi được chọn
          : backgroundColor || "#9333ea", // tím mặc định
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
      }}
      className={`p-[35px] rounded-lg text-white font-bold text-lg flex items-center justify-center gap-8 shadow-md ${
        isTailwindColor ? (isSelected ? "bg-green-600" : color) : ""
      }`}
    >
      {/* Icon điện thoại */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-10"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25
             a2.25 2.25 0 002.25-2.25v-1.372
             c0-.516-.351-.966-.852-1.091l-4.423-1.106
             c-.44-.11-.902.055-1.173.417l-.97 1.293
             c-.282.376-.769.542-1.21.38
             a12.035 12.035 0 01-7.143-7.143
             c-.162-.441.004-.928.38-1.21l1.293-.97
             c.363-.271.527-.734.417-1.173L6.963 3.102
             a1.125 1.125 0 00-1.091-.852H4.5
             A2.25 2.25 0 002.25 4.5v2.25z"
        />
      </svg>

      {/* Thông tin liên hệ */}
      <div className="text-center">
        <span className="block">{label}</span>
        <h1 className="font-medium text-sm mt-1 flex justify-center gap-2">
          {phone}
        </h1>
      </div>
    </button>
  );
}
