# BlueCode Zalo Mini App

Mini App cho phép nhận thông báo sự cố khẩn cấp và phản hồi trực tiếp từ Zalo.

## Flow đăng nhập (handoff token)

Mini app chạy độc lập bằng handoff token:

1. Đăng nhập Dashboard Web.
2. Mở modal `Mini App Settings` (từ menu avatar).
3. Bấm `Tạo Link Mini App` để lấy link đăng nhập (hết hạn sau 5 phút).
4. Mở link đó trên điện thoại → tự đăng nhập và vào thẳng cuộc gọi (nếu có callId).

Endpoint dùng cho flow này:

- `POST /api/mini/auth/handoff-token` (cần token web)
- `POST /api/mini/auth/handoff` (mini app đổi handoff lấy mini token)

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

### Option 1: Test trên browser (handoff token)
1. Mở Dashboard Web, tạo handoff token từ modal `Mini App Settings`.
2. Mở link trên trình duyệt → tự đăng nhập vào mini app.

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
1. Đăng nhập Dashboard Web
   ↓
2. Tạo handoff token (POST /api/mini/auth/handoff-token)
   ↓
3. Mở launchUrl trên điện thoại
   ↓
4. Mini App đọc ?handoff=... từ URL → đổi lấy session token
   ↓
5. Hiển thị danh sách calls / call detail
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
| `/api/mini/auth/handoff-token` | POST | Tạo handoff token (cần web token) |
| `/api/mini/auth/handoff` | POST | Đổi handoff token lấy mini session |
| `/api/mini/auth/verify` | POST | Verify mini token |
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

- Mini App sử dụng handoff token từ Dashboard Web
- Handoff token hết hạn sau 5 phút, cần tạo mới nếu hết hạn
- Trong development, mock mode tự động bật nếu không chạy trong Zalo environment
