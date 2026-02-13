# BlueCode Zalo Mini App

Mini App cho phép nhận thông báo sự cố khẩn cấp và phản hồi trực tiếp từ Zalo.

## 🚀 Cách chạy

### 1. Cài đặt dependencies
```bash
cd zalo-mini-app
npm install
```

### 2. Cấu hình environment
```bash
cp .env.example .env
# Sửa VITE_API_URL trỏ đến backend của bạn
```

### 3. Chạy development server
```bash
npm run dev
```

App sẽ chạy tại: http://localhost:3001

## 📱 Cách test

### Option 1: Test trên browser (không có Zalo SDK)
1. Mở http://localhost:3001
2. Login sẽ tự động dùng mock mode trong development

### Option 2: Test trên Zalo DevTools (có Zalo SDK đầy đủ)
1. Cài Zalo Mini App CLI:
```bash
npm install -g @zalo-mini-app/cli
```

2. Login vào Zalo Developer:
```bash
zmp login
```

3. Chạy với DevTools:
```bash
zmp start
```

### Option 3: Test trên Zalo app thật
1. Tạo Mini App mới tại https://miniapp.zalo.me/developer
2. Lấy App ID và cập nhật vào `.env`
3. Deploy:
```bash
zmp deploy
```
4. Quét QR code bằng Zalo app để test

## 🔗 Flow hoạt động

```
1. Tạo Call (Dashboard Web)
   ↓
2. Gửi Zalo OA message kèm deep-link
   ↓
3. User click link → Mở Mini App
   ↓
4. Mini App auto-login với Zalo SDK
   ↓
5. Hiển thị call detail
   ↓
6. User nhấn NHẬN/TỪ CHỐI
   ↓
7. Gọi API → Backend update status
   ↓
8. Socket emit → Dashboard Web realtime update
```

## 📡 API Endpoints sử dụng

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/api/auth/zalo-login` | POST | Login với Zalo access token |
| `/api/mini/my-calls` | GET | Lấy danh sách calls |
| `/api/mini/calls/:id` | GET | Lấy chi tiết call |
| `/api/mini/calls/:id/accept` | POST | Nhận cuộc gọi |
| `/api/mini/calls/:id/reject` | POST | Từ chối cuộc gọi |

## 🏗️ Build production

```bash
npm run build
```

Output trong thư mục `dist/`, upload lên Zalo Mini App Portal để deploy.

## 📝 Lưu ý

- User cần **liên kết Zalo** trong Dashboard Web trước khi dùng Mini App
- Mini App chỉ hoạt động với users đã link Zalo (`zaloVerified: true`)
- Trong development, mock mode tự động bật nếu không chạy trong Zalo environment
