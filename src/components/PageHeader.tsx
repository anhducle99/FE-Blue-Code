import React from "react";
import { Link } from "react-router-dom";

interface PageHeaderProps {
  title: string;
  backLink?: string;
  createButton?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  backLink = "/main",
  createButton,
}) => {
  return (
    <div className="px-4 py-4 min-h-[88px]">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 border-b pb-4">
        <h1 className="text-base font-medium text-gray-800 flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0 flex-1 leading-none m-0">
          <Link className="text-[#0365af] hover:underline shrink-0 inline-flex items-center" to={backLink}>
            Trang chu
          </Link>
          <i className="bi bi-chevron-right text-sm shrink-0 inline-flex items-center justify-center" aria-hidden />
          <span className="break-words">{title}</span>
        </h1>
        {createButton && (
          <div className="shrink-0 self-end sm:self-auto flex items-center pt-0.5">{createButton}</div>
        )}
      </div>
    </div>
  );
};
