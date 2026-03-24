# FE-Blue-Code

Frontend web c?a BlueCode, ph?c v? web app qu?n tr?< v� m�n h�nh g?i kh?n ch�nh. Repo n�y cung ch?a mini app Zalo nhu m?Tt app con ?Y `zalo-mini-app/`.

## Ph?m vi repo

Current state repo n�y ch?<u tr�ch nhi??m cho:

- Web login b?ng email/password
- M�n h�nh g?i kh?n ch�nh (`/main`)
- Dashboard qu?n tr?< (`/dashboard/*`)
- K?t n?'i Socket.IO realtime
- PWA tr�n web production
- Capacitor wrappers cho native shell
- Lu?"ng t?o `linkToken` v� QR login session ?'?f ph?'i h?p v?>i mini app
- Man hinh goi khan web hien cho phep tai khoan xu ly su co chon chinh doi phan ung cua minh; backend se loai chinh account dang goi khoi danh sach nhan
- Man hinh goi khan web hien cung cho phep chon `Vi tri su co`; gia tri duoc chon se duoc gui qua `fromDept` khi tao cuoc goi

Mini app Zalo c� README ri�ng t?i [zalo-mini-app/README.md](zalo-mini-app/README.md).

## Entry points ch�nh

- `src/index.tsx`
- `src/App.tsx`
- `src/layouts/DashboardLayout.tsx`
- `src/contexts/AuthContext.tsx`
- `src/contexts/IncidentContext.tsx`
- `src/services/api.ts`
- `src/config/env.ts`

## C�i ?'?t v� ch?y local

```powershell
cd FE-Blue-Code
npm install
Copy-Item .env.example .env
npm start
```

Dev server m?c ?'?<nh ?Y `http://localhost:3000`.

## Scripts ch�nh

| Script | M?c ?'�ch current state |
| --- | --- |
| `npm start` | Ch?y web app ?Y ch? ?'?T dev |
| `npm run dev` | Alias c?a `npm start` |
| `npm run build:pwa` | Build web/PWA thu?n |
| `npm run build` | Build r?"i ch?y `cap:sync` |
| `npm test` | Test theo `react-scripts test` |
| `npm run cap:sync` | D?"ng b?T output v�o Capacitor |
| `npm run cap:run:android` | Build + ch?y Android |
| `npm run cap:run:ios` | Build + ch?y iOS |

## Env ?'ang ?'?c

- `REACT_APP_API_URL`
- `REACT_APP_NATIVE_API_URL`
- `REACT_APP_SOCKET_URL`

`src/config/env.ts` t? chu?n h�a base URL v� socket URL theo web/native runtime.

## Current-state notes

- Service worker ch?? ?'u?c register khi ch?y web production v� kh�ng-native.
- Provider stack ?'u?c khai b�o t?p trung trong `src/index.tsx`.
- `is_admin_view` hi??n ?'u?c FE d�ng nhu m?Tt c? m?Y quy?n giao di??n admin.
- `src/contexts/IncidentContext.tsx` v� c�c widget history/live feed hi??n uu ti�n consume socket payload tru?>c, sau ?'� m?>i d�ng polling fallback ?'?f t? sync.
- Polling/refetch n?n ?'� gi?m t?i: current state tr�nh reload ?'?<nh k? khi tab web ?n ho?c khi v?a c� socket event m?>i.
- Repo c� service g?i `/api/upload/image` v� `/api/push/*`, nhung backend current state chua th?y route tuong ?ng.
- Chu?-i ti?ng Vi??t trong m?Tt s?' file ngu?"n ?'ang b?< l?-i encoding; pass t�i li??u n�y kh�ng s?a source ?'�.

## T�i li??u li�n quan

- [README g?'c workspace](../README.md)
- [Project context](../docs/PROJECT_CONTEXT.md)
- [Architecture](../docs/ARCHITECTURE.md)
- [HDSD](../docs/HDSD.md)
- [Rules](../docs/RULES.md)

