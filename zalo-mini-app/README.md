# BlueCode Zalo Mini App

Mini app Zalo của BlueCode là một frontend React/Vite độc lập nằm trong repo `FE-Blue-Code`, dùng cho tài khoản xử lý sự cố và các flow liên kết với Zalo.

## Phạm vi app

Current state mini app hỗ trợ:

- Xác minh session mini app
- Liên kết tài khoản web với tài khoản Zalo
- Approve QR login cho web
- Xem danh sách cuộc gọi của tài khoản xử lý sự cố
- Xem chi tiết cuộc gọi
- Chấp nhận hoặc từ chối cuộc gọi

## Entry points chính

- `src/main.tsx`
- `src/App.tsx`
- `src/services/api.ts`
- `src/services/auth.ts`
- `src/services/socket.ts`

## Cài đặt và chạy local

```powershell
cd FE-Blue-Code/zalo-mini-app
npm install
Copy-Item .env.example .env
npm run dev
```

Dev server mặc định ở `http://localhost:3001`.

## Scripts chính

| Script | Mục đích current state |
| --- | --- |
| `npm run dev` | Chạy dev server Vite |
| `npm run build` | Build app ra thư mục `www` |
| `npm run preview` | Preview bản build Vite |
| `npm run zmp:deploy` | Deploy qua `zmp deploy` |

## Env đang đọc

- `VITE_API_URL`
- `VITE_API_URL_HTTPS`
- `VITE_ZALO_MINI_APP_ID`

## Current-state notes

- `vite.config.ts` proxy `/api` sang `http://localhost:5000` trong local dev.
- Khi app chạy trong HTTPS context, `src/services/api.ts` sẽ chặn request HTTP và yêu cầu `VITE_API_URL_HTTPS`.
- Output build nằm ở `www`, không phải `dist`.
- App dùng `zmp-sdk` để lấy Zalo user info và access token.
- Backend chỉ cho phép mini app cho user có `isDepartmentAccount = true` và không phải `isFloorAccount`.
- Home page hiện vẫn có polling fallback cho danh sách call, nhưng current state chỉ poll khi page đang visible và vẫn ưu tiên update từ socket event.

## Tài liệu liên quan

- [README gốc workspace](../../README.md)
- [README FE web](../README.md)
- [Project context](../../docs/PROJECT_CONTEXT.md)
- [Architecture](../../docs/ARCHITECTURE.md)
- [HDSD](../../docs/HDSD.md)
