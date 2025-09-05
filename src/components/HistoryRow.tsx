import React from "react";

export interface HistoryRowProps {
  index: number;
  from: string;
  to: string;
  content: string;
  image: string;
  receiver: string;
  status: string;
  sentAt: string;
  confirmedAt: string;
}

export const HistoryRow: React.FC<HistoryRowProps> = React.memo(
  ({
    index,
    from,
    to,
    content,
    image,
    receiver,
    status,
    sentAt,
    confirmedAt,
  }) => {
    const renderDataRow = () => (
      <>
        <td className="py-2 border px-2 whitespace-nowrap">{receiver}</td>
        <td className="py-2 border px-2 text-center whitespace-nowrap">
          <span className="bg-gray btn-template">{status}</span>
        </td>
        <td className="py-2 border px-2 text-center whitespace-nowrap">
          {sentAt}
        </td>
        <td className="py-2 border px-2 text-center whitespace-nowrap">
          {confirmedAt}
        </td>
      </>
    );

    return (
      <>
        <tr className="bg-indigo-50 border text-sm">
          <td
            rowSpan={2}
            className="py-2 border px-2 text-center whitespace-nowrap"
          >
            {index}
          </td>
          <td rowSpan={2} className="py-2 border px-2 whitespace-nowrap">
            {from}
          </td>
          <td rowSpan={2} className="py-2 border px-2 whitespace-nowrap">
            {to}
          </td>
          <td rowSpan={2} className="py-2 border px-2 whitespace-nowrap">
            {content}
          </td>
          <td rowSpan={2} className="py-2 border px-2 whitespace-nowrap">
            <img
              className="w-32 mx-auto object-contain"
              src={image || "https://techvang.com/storage/null"}
              alt="ảnh thông báo"
              loading="lazy"
            />
          </td>
          {renderDataRow()}
        </tr>
        <tr className="bg-indigo-50 border text-sm">{renderDataRow()}</tr>
      </>
    );
  }
);
