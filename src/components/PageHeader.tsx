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
    <div className="px-4 pt-5 pb-4">
      <div className="flex min-h-10 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="m-0 flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1 text-base font-medium leading-6 text-gray-800">
          <Link className="text-[#0365af] hover:underline shrink-0 inline-flex items-center" to={backLink}>
            Trang chủ
          </Link>
          <i className="bi bi-chevron-right text-sm shrink-0 inline-flex items-center justify-center" aria-hidden />
          <span className="break-words">{title}</span>
        </h1>
        {createButton && (
          <div className="flex shrink-0 items-center self-end sm:self-center">{createButton}</div>
        )}
      </div>
      <div className="mt-4 border-b border-gray-200" />
    </div>
  );
};
