import React from "react";

interface Props {
  name: string;
  phone: string;
  isSelected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export default function DepartmentButton({
  name,
  phone,
  isSelected = false,
  onClick,
  disabled = false,
  icon,
}: Props) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      title={name}
      className={`px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl font-semibold text-sm sm:text-base w-full min-w-0 shadow-sm border-2 transition-all duration-200 flex flex-col items-center ${
        disabled
          ? "bg-gray-200 text-gray-500 cursor-not-allowed border-gray-200"
          : isSelected
          ? "bg-tthBlue text-white border-tthBlue ring-2 ring-blue-300 ring-offset-1"
          : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-blue-50 hover:border-blue-200 hover:text-tthBlue"
      }`}
    >
      {icon && (
        <div className="text-xl sm:text-2xl mb-1.5 sm:mb-2 [&>svg]:w-5 [&>svg]:h-5 sm:[&>svg]:w-6 sm:[&>svg]:h-6 text-current flex-shrink-0">
          {icon}
        </div>
      )}
      <div className="text-center w-full min-w-0 break-words whitespace-normal leading-tight px-0.5">{name}</div>
      <div className="mt-1.5 sm:mt-2 text-xs sm:text-sm flex justify-center items-center gap-1 opacity-90 min-w-0">
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
