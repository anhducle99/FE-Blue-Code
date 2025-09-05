import React from "react";
import { PageHeader } from "../components/PageHeader";

export const OrganizationManagementPage: React.FC = () => {
  return (
    <div className="mx-4">
      <PageHeader title="Quản lý tổ chức" />

      <div className="bg-white rounded shadow-sm p-4 mt-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-4">
          <div className="text-sm text-gray-600">Tổng cộng: 1 mục</div>
          <button
            type="button"
            className="h-9 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition ml-auto sm:ml-0"
          >
            Tạo tổ chức
          </button>
        </div>

        <div className="overflow-x-auto border rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr className="text-left border-b">
                <th className="px-4 py-3">Tên</th>
                <th className="px-4 py-3">Tạo lúc</th>
                <th className="px-4 py-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">Bệnh viện Thái Thượng Hoàng</td>
                <td className="px-4 py-3">2025-07-17</td>
                <td className="px-4 py-3 text-right">
                  <button className="text-blue-600 hover:underline">Sửa</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center text-sm text-zinc-700 pt-5">
          <div>Tổng: 1 mục</div>
        </div>
      </div>
    </div>
  );
};
