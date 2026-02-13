import React from 'react';
import ZaloLinkButton from '../components/ZaloLinkButton';

const ZaloSettingsPage: React.FC = () => {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Cài đặt thông báo Zalo</h1>
      
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600 mb-4">
          Liên kết tài khoản Zalo để nhận thông báo khi có sự cố khẩn cấp.
          <br />
          Sau khi liên kết, bạn sẽ nhận được tin nhắn từ Zalo Official Account mỗi khi có cuộc gọi sự cố.
        </p>
        
        <div className="mt-6">
          <ZaloLinkButton />
        </div>
      </div>

      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">Hướng dẫn sử dụng:</h3>
        <ol className="list-decimal list-inside text-blue-700 space-y-1 text-sm">
          <li>Click "Liên kết Zalo" để tạo mã code</li>
          <li>Mở Zalo trên điện thoại, tìm Official Account của hệ thống</li>
          <li>Gửi tin nhắn: <strong>LINK [mã code]</strong> (ví dụ: LINK 123456)</li>
          <li>Hệ thống sẽ xác nhận và bắt đầu gửi thông báo cho bạn</li>
        </ol>
      </div>
    </div>
  );
};

export default ZaloSettingsPage;
