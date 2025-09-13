import React from "react";

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
    <div className="px-4 pt-3 pb-3 min-h-[77px]">
      <div className="flex flex-row items-center justify-between gap-2 border-b pb-3">
        <h1 className="text-base font-medium text-gray-800 flex items-center gap-2 flex-wrap min-h-[36px]">
          <a className="text-[#0365af] hover:underline" href={backLink}>
            Trang chủ
          </a>
          <i className="bi bi-chevron-right text-sm" />
          <span>{title}</span>
        </h1>
        {createButton && <div className="shrink-0">{createButton}</div>}
      </div>
    </div>
  );
};
