import React from "react";

interface Props {
  name: string;
  phone: string;
  isSelected?: boolean;
  onClick?: () => void;
}

export default function DepartmentButton({
  name,
  phone,
  isSelected = false,
  onClick,
}: Props) {
  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-lg text-white font-semibold text-base w-full shadow-md transition-colors duration-200 ${
        isSelected ? "bg-green-600" : "bg-blue-500 hover:bg-blue-600"
      }`}
    >
      <div className="text-center">{name}</div>
      <div className="mt-2 text-sm flex justify-center items-center gap-1">
        <PhoneIcon className="w-4 h-4" />
        <span>{phone}</span>
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
        d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372a1.125 1.125 0 00-.852-1.091l-4.423-1.106a1.125 1.125 0 00-1.173.417l-.97 1.293a1.125 1.125 0 01-1.21.38 12.035 12.035 0 01-7.143-7.143 1.125 1.125 0 01.38-1.21l1.293-.97a1.125 1.125 0 00.417-1.173L6.963 3.102A1.125 1.125 0 006.111 2.25H4.5A2.25 2.25 0 002.25 4.5v2.25z"
      />
    </svg>
  );
}
