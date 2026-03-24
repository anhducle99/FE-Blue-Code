# BlueCode Zalo Mini App

Mini app Zalo cua BlueCode la mot frontend React/Vite doc lap nam trong repo `FE-Blue-Code`, dung cho tai khoan xu ly su co va cac flow lien ket voi Zalo.

## Pham vi app

Current state mini app ho tro:

- Xac minh session mini app
- Lien ket tai khoan web voi tai khoan Zalo
- Approve QR login cho web
- Dang nhap mini app bang email/password cua tai khoan web neu account du dieu kien vao mini app
- Dang nhap local bang email/password department account tai `localhost:3001`
- Hien thi trang chu voi 2 block `Vi tri su co` va `Chon doi phan ung can goi` theo organization hien tai, trong do phai chon `Vi tri su co` truoc khi gui cuoc goi
- Tao cuoc goi di tu trang chu mini app qua `POST /api/mini/call`
- Sau khi gui cuoc goi thanh cong, mini app mo modal theo doi trang thai phan hoi cua tung nguoi nhan ngay tren trang chu
- Xem danh sach cuoc goi cua tai khoan xu ly su co
- Xem chi tiet cuoc goi
- Chap nhan hoac tu choi cuoc goi

## Entry points chinh

- `src/main.tsx`
- `src/App.tsx`
- `src/services/api.ts`
- `src/services/auth.ts`
- `src/services/socket.ts`

## Cai dat va chay local

```powershell
cd FE-Blue-Code/zalo-mini-app
npm install
Copy-Item .env.example .env
npm run dev
```

Dev server mac dinh o `http://localhost:3001`.

## Scripts chinh

| Script | Muc dich current state |
| --- | --- |
| `npm run dev` | Chay dev server Vite |
| `npm run build` | Build app ra thu muc `www` |
| `npm run preview` | Preview ban build Vite |
| `npm run zmp:deploy` | Deploy qua `zmp deploy` |

## Env dang doc

- `VITE_API_URL`
- `VITE_API_URL_HTTPS`
- `VITE_ZALO_MINI_APP_ID`

## Current-state notes

- `vite.config.ts` proxy `/api` sang `http://localhost:5000` trong local dev.
- Khi app chay trong HTTPS context, `src/services/api.ts` se chan request HTTP va yeu cau `VITE_API_URL_HTTPS`.
- Output build nam o `www`, khong phai `dist`.
- App dung `zmp-sdk` de lay Zalo user info va access token.
- Backend chi cho phep mini app cho user co `isDepartmentAccount = true` va khong phai `isFloorAccount`.
- Trang `/login` hien co them form `Dang nhap bang tai khoan web`; flow nay dung email/password web account nhung backend van giu cung guard mini app (`isDepartmentAccount = true`, `isFloorAccount = false`, co `organizationId`).
- Khi chay browser local tai `http://localhost:3001`, trang `/login` hien them form `Dang nhap local`; flow nay chi de test local va khong thay the flow Zalo chuan.
- Home page van co polling fallback cho danh sach call, nhung current state chi poll khi page dang visible va van uu tien update tu socket event.
- `GET /api/mini/dashboard-options` tra ve `floorAccounts` va `departments` scoped theo organization cua token mini app de render 2 block trang chu; danh sach `departments` duoc dung nhu cac doi phan ung de goi.
- `POST /api/mini/call` dung chung logic dispatch call voi web, nen account xu ly su co co the goi ra truc tiep tu mini app; home page gui `fromDept` theo `Vi tri su co` da chon, va neu goi vao chinh doi cua minh thi backend se tu bo user gui khoi danh sach nhan. Response hien tra `callId` kem `receiverNames` de mini app mo modal theo doi trang thai cuoc goi theo tung nguoi nhan.

## Tai lieu lien quan

- [README goc workspace](../../README.md)
- [README FE web](../README.md)
- [Project context](../../docs/PROJECT_CONTEXT.md)
- [Architecture](../../docs/ARCHITECTURE.md)
- [HDSD](../../docs/HDSD.md)
