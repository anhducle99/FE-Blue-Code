import React from "react";
import clsx from "clsx";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "outline" | "default";
  fullWidth?: boolean;
}

export function Button({
  children,
  className,
  variant = "primary",
  fullWidth = false,
  ...props
}: ButtonProps) {
  const baseStyle =
    "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";

  const variantStyles: Record<NonNullable<ButtonProps["variant"]>, string> = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary:
      "bg-gray-100 text-gray-800 hover:bg-gray-200 focus:ring-gray-300",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    outline:
      "border border-gray-300 text-gray-800 hover:bg-gray-100 focus:ring-gray-300",
    default:
      "bg-white text-gray-800 border border-gray-300 hover:bg-gray-100 focus:ring-gray-300",
  };

  const fullWidthStyle = fullWidth ? "w-full" : "";

  return (
    <button
      className={clsx(
        baseStyle,
        variantStyles[variant],
        fullWidthStyle,
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
