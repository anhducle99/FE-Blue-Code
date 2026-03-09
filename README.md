# FE-Blue-Code

Frontend web của BlueCode, phục vụ web app quản trị và màn hình gọi khẩn chính. Repo này cũng chứa mini app Zalo như một app con ở `zalo-mini-app/`.

## Phạm vi repo

Current state repo này chịu trách nhiệm cho:

- Web login bằng email/password
- Màn hình gọi khẩn chính (`/main`)
- Dashboard quản trị (`/dashboard/*`)
- Kết nối Socket.IO realtime
- PWA trên web production
- Capacitor wrappers cho native shell
- Luồng tạo `linkToken` và QR login session để phối hợp với mini app

Mini app Zalo có README riêng tại [zalo-mini-app/README.md](zalo-mini-app/README.md).

## Entry points chính

- `src/index.tsx`
- `src/App.tsx`
- `src/layouts/DashboardLayout.tsx`
- `src/contexts/AuthContext.tsx`
- `src/contexts/IncidentContext.tsx`
- `src/services/api.ts`
- `src/config/env.ts`

## Cài đặt và chạy local

```powershell
cd FE-Blue-Code
npm install
Copy-Item .env.example .env
npm start
```

Dev server mặc định ở `http://localhost:3000`.

## Scripts chính

| Script | Mục đích current state |
| --- | --- |
| `npm start` | Chạy web app ở chế độ dev |
| `npm run dev` | Alias của `npm start` |
| `npm run build:pwa` | Build web/PWA thuần |
| `npm run build` | Build rồi chạy `cap:sync` |
| `npm test` | Test theo `react-scripts test` |
| `npm run cap:sync` | Đồng bộ output vào Capacitor |
| `npm run cap:run:android` | Build + chạy Android |
| `npm run cap:run:ios` | Build + chạy iOS |

## Env đang đọc

- `REACT_APP_API_URL`
- `REACT_APP_NATIVE_API_URL`
- `REACT_APP_SOCKET_URL`

`src/config/env.ts` tự chuẩn hóa base URL và socket URL theo web/native runtime.

## Current-state notes

- Service worker chỉ được register khi chạy web production và không-native.
- Provider stack được khai báo tập trung trong `src/index.tsx`.
- `is_admin_view` hiện được FE dùng như một cờ mở quyền giao diện admin.
- `src/contexts/IncidentContext.tsx` và các widget history/live feed hiện ưu tiên consume socket payload trước, sau đó mới dùng polling fallback để tự sync.
- Polling/refetch nền đã giảm tải: current state tránh reload định kỳ khi tab web ẩn hoặc khi vừa có socket event mới.
- Repo có service gọi `/api/upload/image` và `/api/push/*`, nhưng backend current state chưa thấy route tương ứng.
- Chuỗi tiếng Việt trong một số file nguồn đang bị lỗi encoding; pass tài liệu này không sửa source đó.

## Tài liệu liên quan

- [README gốc workspace](../README.md)
- [Project context](../docs/PROJECT_CONTEXT.md)
- [Architecture](../docs/ARCHITECTURE.md)
- [HDSD](../docs/HDSD.md)
- [Rules](../docs/RULES.md)
