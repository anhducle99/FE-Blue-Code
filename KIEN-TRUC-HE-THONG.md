# KIẾN TRÚC HỆ THỐNG BLUE CODE

## 1. TỔNG QUAN HỆ THỐNG

### 1.1. Mô tả hệ thống
Blue Code là hệ thống quản lý cuộc gọi khẩn cấp và sự cố được xây dựng với công nghệ web hiện đại, hỗ trợ đa nền tảng (Web, Android, iOS) thông qua Progressive Web App (PWA) và Capacitor.

### 1.2. Mục đích
- Quản lý và điều phối cuộc gọi khẩn cấp giữa các phòng ban
- Theo dõi và xử lý sự cố theo thời gian thực
- Hỗ trợ làm việc offline với khả năng đồng bộ dữ liệu tự động
- Cung cấp thống kê và báo cáo về hoạt động hệ thống

### 1.3. Đối tượng sử dụng
- Nhân viên các phòng ban cần gọi hỗ trợ khẩn cấp
- Tài khoản xử lý sự cố (Department Account)
- Quản trị viên hệ thống
- Người dùng hỗ trợ kỹ thuật

---

## 2. KIẾN TRÚC TỔNG THỂ

### 2.1. Sơ đồ kiến trúc

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Web App    │  │ Android App  │  │   iOS App    │     │
│  │   (PWA)      │  │  (Capacitor) │  │  (Capacitor) │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                  │                  │            │
│         └──────────────────┼──────────────────┘            │
│                            │                               │
│         ┌──────────────────▼──────────────────┐           │
│         │     React Application Layer          │           │
│         │  ┌──────────────────────────────┐   │           │
│         │  │   Components & Pages         │   │           │
│         │  │   Contexts & State Mgmt      │   │           │
│         │  │   Hooks & Utilities           │   │           │
│         │  └──────────────────────────────┘   │           │
│         └──────────────────┬──────────────────┘           │
└────────────────────────────┼───────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
┌────────▼────────┐  ┌───────▼───────┐  ┌──────▼────────┐
│   REST API      │  │  Socket.io     │  │  Native APIs  │
│   (HTTP/HTTPS) │  │  (WebSocket)   │  │  (Capacitor)  │
└────────┬────────┘  └───────┬───────┘  └───────────────┘
         │                   │
         └───────────┬───────┘
                     │
         ┌───────────▼───────────┐
         │    BACKEND SERVER      │
         │  ┌──────────────────┐  │
         │  │  API Endpoints   │  │
         │  │  Socket Server   │  │
         │  │  Database        │  │
         │  └──────────────────┘  │
         └────────────────────────┘
```

### 2.2. Kiến trúc phân tầng

#### **Tầng Presentation (UI Layer)**
- **React Components**: Giao diện người dùng
- **Pages**: Các trang chính của ứng dụng
- **Layouts**: Bố cục chung của ứng dụng

#### **Tầng Business Logic**
- **Contexts**: Quản lý state toàn cục (Auth, Incident, Department, Organization)
- **Hooks**: Logic tái sử dụng (useSocket, useOfflineQueue, useNetworkStatus)
- **Services**: Xử lý nghiệp vụ và giao tiếp với API

#### **Tầng Data Access**
- **API Service**: Giao tiếp với REST API
- **Socket Service**: Giao tiếp real-time qua WebSocket
- **Native Service**: Truy cập tính năng native (Camera, Push Notifications, File System)
- **Offline Queue**: Quản lý hàng đợi khi offline

#### **Tầng Infrastructure**
- **Capacitor**: Bridge giữa web và native
- **Service Worker**: Hỗ trợ PWA và offline
- **Local Storage**: Lưu trữ dữ liệu cục bộ

---

## 3. CÁC THÀNH PHẦN CHÍNH

### 3.1. Frontend Application

#### **3.1.1. Core Framework**
- **React 18**: UI framework
- **TypeScript**: Type safety và code quality
- **React Router DOM**: Điều hướng và routing
- **Tailwind CSS**: Styling framework

#### **3.1.2. State Management**
- **React Context API**: Quản lý state toàn cục
  - `AuthContext`: Xác thực và thông tin người dùng
  - `IncidentContext`: Quản lý sự cố và thông báo
  - `DepartmentContext`: Quản lý phòng ban
  - `OrganizationContext`: Quản lý tổ chức
  - `ToastContext`: Thông báo và toast messages
  - `DashboardContext`: Dữ liệu dashboard

#### **3.1.3. Real-time Communication**
- **Socket.io Client**: Kết nối WebSocket
  - Đăng ký người dùng theo department
  - Nhận cuộc gọi đến (incomingCall)
  - Gửi cuộc gọi đi (startCall)
  - Theo dõi trạng thái kết nối
  - Tự động reconnect khi mất kết nối

#### **3.1.4. API Communication**
- **Axios**: HTTP client với interceptors
  - Tự động thêm Authorization token
  - Xử lý lỗi tập trung (401, 403, 404, 500)
  - Retry mechanism cho các request thất bại
  - CORS error handling

#### **3.1.5. Offline Support**
- **Offline Queue Service**: Hàng đợi các request khi offline
  - Lưu trữ trong LocalStorage
  - Tự động xử lý khi có kết nối lại
  - Retry với số lần giới hạn
  - Hỗ trợ nhiều loại request (API call, Image upload)

- **Service Worker**: PWA và caching
  - Cache static assets
  - Offline fallback
  - Background sync

#### **3.1.6. Native Integration (Capacitor)**
- **@capacitor/app**: App lifecycle management
- **@capacitor/camera**: Chụp ảnh và truy cập thư viện ảnh
- **@capacitor/filesystem**: Đọc/ghi file trên thiết bị
- **@capacitor/device**: Thông tin thiết bị
- **@capacitor/network**: Theo dõi trạng thái mạng
- **@capacitor/push-notifications**: Push notifications
- **@capacitor/splash-screen**: Splash screen
- **@capacitor/status-bar**: Điều khiển status bar

### 3.2. Pages & Components

#### **3.2.1. Pages**
- **LoginPage**: Đăng nhập và xác thực
- **App (HomePage)**: Trang chính với danh sách phòng ban và cuộc gọi
- **HistoryPage**: Lịch sử cuộc gọi và sự cố
- **StatisticsPage**: Thống kê và báo cáo
- **UsersPage**: Quản lý người dùng
- **DepartmentManagementPage**: Quản lý phòng ban
- **OrganizationManagementPage**: Quản lý tổ chức

#### **3.2.2. Key Components**
- **Header**: Header chung của ứng dụng
- **Sidebar**: Menu điều hướng
- **DepartmentButton**: Nút chọn phòng ban để gọi
- **SupportButton**: Nút hỗ trợ kỹ thuật
- **CallStatusModal**: Modal hiển thị trạng thái cuộc gọi
- **IncomingCallModal**: Modal nhận cuộc gọi đến
- **IncidentSidebar**: Sidebar hiển thị sự cố
- **IncidentStatusWidget**: Widget trạng thái sự cố
- **FloorAccountPanel**: Panel quản lý tài khoản tầng
- **HistoryTable**: Bảng lịch sử
- **ConfirmationDialog**: Dialog xác nhận

### 3.3. Services Layer

#### **3.3.1. API Services**
- **api.ts**: Axios instance và interceptors
- **authService.ts**: Xác thực và quản lý người dùng
- **userService.ts**: CRUD người dùng
- **departmentService.ts**: Quản lý phòng ban
- **organizationService.ts**: Quản lý tổ chức
- **historyService.ts**: Lịch sử cuộc gọi
- **statisticsService.ts**: Thống kê và báo cáo
- **imageUploadService.ts**: Upload ảnh

#### **3.3.2. Native Services**
- **nativeService.ts**: Wrapper cho Capacitor plugins
  - App service (lifecycle)
  - Network service (status monitoring)
  - Device service (device info)
  - Camera service
  - File system service

#### **3.3.3. Push Notification Service**
- **pushNotificationService.ts**: Quản lý push notifications
- **usePushNotifications.ts**: Hook cho push notifications
- **usePushNotificationsWithSocket.ts**: Tích hợp với Socket.io

### 3.4. Utilities & Helpers

#### **3.4.1. Utilities**
- **apiRetry.ts**: Retry mechanism cho API calls
- **offlineQueue.ts**: Quản lý hàng đợi offline
- **offlineStorage.ts**: Lưu trữ dữ liệu offline
- **storage.ts**: Wrapper cho LocalStorage
- **fileSystem.ts**: Thao tác file system
- **imageConverter.ts**: Chuyển đổi ảnh
- **navigation.ts**: Helper điều hướng
- **serviceWorkerRegistration.ts**: Đăng ký service worker

#### **3.4.2. Configuration**
- **env.ts**: Cấu hình môi trường
  - API URL (khác nhau cho web và native)
  - Socket URL
  - Platform detection (web/android/ios)
- **capacitor.config.ts**: Cấu hình Capacitor

---

## 4. LUỒNG DỮ LIỆU

### 4.1. Luồng đăng nhập và xác thực

```
User → LoginPage → authService.login()
                ↓
         API POST /api/auth/login
                ↓
    Backend xác thực và trả token
                ↓
    Lưu token vào localStorage
                ↓
    AuthContext cập nhật user state
                ↓
    Redirect đến trang chính
                ↓
    Socket.io đăng ký user với department
```

### 4.2. Luồng thực hiện cuộc gọi

```
User chọn department → Click "Gọi ngay"
                    ↓
        ConfirmationDialog hiển thị
                    ↓
    User xác nhận → handleConfirmCall()
                    ↓
    API POST /api/call với targetKeys
                    ↓
    Backend tạo callId và trả về
                    ↓
    Socket.emit("startCall", {callId, from, targets})
                    ↓
    CallStatusModal hiển thị (waiting)
                    ↓
    Socket nhận event từ server
                    ↓
    Cập nhật trạng thái cuộc gọi
                    ↓
    Thêm incident vào IncidentContext
```

### 4.3. Luồng nhận cuộc gọi đến

```
Backend → Socket.emit("incomingCall", data)
                ↓
    useSocket hook nhận event
                ↓
    setIncomingCall(data)
                ↓
    IncomingCallModal hiển thị
                ↓
    User chấp nhận/từ chối
                ↓
    Socket.emit("acceptCall"/"rejectCall")
                ↓
    Backend xử lý và broadcast
```

### 4.4. Luồng offline và đồng bộ

```
User thực hiện action khi offline
                ↓
    API call thất bại (network error)
                ↓
    OfflineQueue.add() lưu request
                ↓
    Request được lưu vào LocalStorage
                ↓
    User thấy thông báo "offline mode"
                ↓
    Network status monitor phát hiện online
                ↓
    OfflineQueue.processQueue()
                ↓
    Xử lý từng request trong queue
                ↓
    Retry nếu thất bại (max 3 lần)
                ↓
    Xóa request khỏi queue khi thành công
```

### 4.5. Luồng upload ảnh

```
User chọn ảnh từ Camera/Gallery
                ↓
    Capacitor Camera plugin
                ↓
    imageConverter xử lý ảnh
                ↓
    Kiểm tra network status
                ↓
    Nếu offline → OfflineQueue.add(uploadImage)
                ↓
    Nếu online → API POST /api/upload/image
                ↓
    FormData với file
                ↓
    Hiển thị progress (nếu có)
                ↓
    Nhận URL ảnh từ server
```

---

## 5. CÔNG NGHỆ VÀ CÔNG CỤ

### 5.1. Core Technologies
- **React 18.2.0**: UI framework
- **TypeScript 4.9.5**: Type safety
- **React Router DOM 7.6.3**: Routing
- **Tailwind CSS 3.4.18**: Styling

### 5.2. State Management & Data
- **React Context API**: Global state
- **React Hooks**: Custom hooks
- **Axios 1.12.2**: HTTP client
- **Socket.io Client 4.8.1**: WebSocket

### 5.3. UI Libraries
- **Ant Design 5.27.1**: UI components
- **Chart.js 4.5.0**: Data visualization
- **React Chart.js 2 5.3.0**: React wrapper cho Chart.js
- **Heroicons React 2.2.0**: Icons
- **Lucide React 0.525.0**: Icons
- **React Icons 4.11.0**: Icons
- **Framer Motion 12.23.22**: Animations

### 5.4. Forms & Validation
- **Formik 2.4.6**: Form management
- **Yup 1.7.0**: Schema validation

### 5.5. Native Mobile
- **Capacitor 7.4.4**: Native bridge
- **Capacitor Plugins**:
  - App, Camera, Device, Filesystem
  - Network, Push Notifications
  - Splash Screen, Status Bar, Keyboard

### 5.6. Build Tools
- **React Scripts 5.0.1**: Build tooling
- **PostCSS 8.5.6**: CSS processing
- **Autoprefixer 10.4.22**: CSS vendor prefixes

### 5.7. Development Tools
- **TypeScript**: Type checking
- **ESLint**: Code linting (nếu có)
- **Git**: Version control

---

## 6. CẤU TRÚC THỨ MỤC

```
FE-Blue-Code/
├── public/                    # Static files
│   ├── index.html            # HTML entry point
│   ├── manifest.json         # PWA manifest
│   ├── sw.js                 # Service worker
│   └── img/                  # Images và icons
│
├── src/
│   ├── components/           # React components
│   │   ├── AudioPermissionModal.tsx
│   │   ├── CallStatusModal.tsx
│   │   ├── DepartmentButton.tsx
│   │   ├── Header.tsx
│   │   ├── HistoryTable.tsx
│   │   ├── IncidentSidebar.tsx
│   │   └── ...
│   │
│   ├── contexts/             # React contexts
│   │   ├── AuthContext.tsx
│   │   ├── IncidentContext.tsx
│   │   ├── DepartmentContext.tsx
│   │   ├── OrganizationContext.tsx
│   │   ├── ToastContext.tsx
│   │   └── useSocket.ts
│   │
│   ├── hooks/                # Custom hooks
│   │   ├── useDeviceInfo.ts
│   │   ├── useNetworkStatus.ts
│   │   ├── useOfflineQueue.ts
│   │   ├── usePushNotifications.ts
│   │   └── usePushNotificationsWithSocket.ts
│   │
│   ├── layouts/              # Layout components
│   │   ├── DashboardLayout.tsx
│   │   └── DashboardContext.tsx
│   │
│   ├── pages/                # Page components
│   │   ├── LoginPage.tsx
│   │   ├── HistoryPage.tsx
│   │   ├── StatisticsPage.tsx
│   │   ├── UsersPage.tsx
│   │   ├── DepartmentManagementPage.tsx
│   │   └── OrganizationManagementPage.tsx
│   │
│   ├── services/             # API và business logic
│   │   ├── api.ts
│   │   ├── authService.ts
│   │   ├── userService.ts
│   │   ├── departmentService.ts
│   │   ├── organizationService.ts
│   │   ├── historyService.ts
│   │   ├── statisticsService.ts
│   │   ├── imageUploadService.ts
│   │   ├── nativeService.ts
│   │   └── pushNotificationService.ts
│   │
│   ├── types/                 # TypeScript definitions
│   │   ├── incident.d.ts
│   │   └── contact.d.ts
│   │
│   ├── utils/                 # Utility functions
│   │   ├── apiRetry.ts
│   │   ├── offlineQueue.ts
│   │   ├── offlineStorage.ts
│   │   ├── storage.ts
│   │   ├── fileSystem.ts
│   │   ├── imageConverter.ts
│   │   ├── navigation.ts
│   │   └── serviceWorkerRegistration.ts
│   │
│   ├── config/                # Configuration
│   │   └── env.ts
│   │
│   ├── styles/                # Global styles
│   │   └── index.css
│   │
│   ├── data/                  # Mock data
│   │   └── mockUsers.json
│   │
│   ├── App.tsx                # Main App component
│   └── index.tsx              # Entry point
│
├── android/                   # Android native project (Capacitor)
├── ios/                       # iOS native project (Capacitor)
│
├── capacitor.config.ts        # Capacitor configuration
├── tailwind.config.js         # Tailwind configuration
├── postcss.config.js          # PostCSS configuration
├── tsconfig.json              # TypeScript configuration
├── package.json               # Dependencies
└── README.md                  # Documentation
```

---

## 7. CÁC TÍNH NĂNG CHÍNH

### 7.1. Quản lý cuộc gọi khẩn cấp
- **Gọi đi**: Chọn phòng ban và thực hiện cuộc gọi
- **Nhận cuộc gọi**: Nhận và xử lý cuộc gọi đến
- **Theo dõi trạng thái**: Real-time tracking của cuộc gọi
- **Lịch sử**: Xem lịch sử các cuộc gọi đã thực hiện

### 7.2. Quản lý sự cố
- **Theo dõi sự cố**: Real-time incident tracking
- **Phân loại**: Phân loại theo status (resolved, warning, error, info)
- **Lọc và tìm kiếm**: Lọc sự cố theo loại và thời gian
- **Widget hiển thị**: Widget trạng thái sự cố trên dashboard

### 7.3. Quản lý người dùng và tổ chức
- **Quản lý người dùng**: CRUD người dùng
- **Quản lý phòng ban**: CRUD phòng ban
- **Quản lý tổ chức**: CRUD tổ chức
- **Phân quyền**: Phân biệt tài khoản thường và department account

### 7.4. Thống kê và báo cáo
- **Dashboard**: Tổng quan hoạt động hệ thống
- **Biểu đồ**: Biểu đồ cột, tròn, đường xu hướng
- **Bộ lọc**: Lọc theo thời gian, phòng ban, loại sự cố

### 7.5. Tính năng offline
- **Hàng đợi offline**: Lưu trữ request khi offline
- **Đồng bộ tự động**: Tự động đồng bộ khi có kết nối
- **Thông báo trạng thái**: Hiển thị trạng thái mạng
- **Retry mechanism**: Tự động retry khi thất bại

### 7.6. Tính năng native
- **Camera**: Chụp ảnh và chọn từ thư viện
- **Push Notifications**: Nhận thông báo đẩy
- **File System**: Đọc/ghi file trên thiết bị
- **Network Status**: Theo dõi trạng thái mạng
- **Device Info**: Lấy thông tin thiết bị

### 7.7. Progressive Web App (PWA)
- **Service Worker**: Cache và offline support
- **Manifest**: Cấu hình PWA
- **Installable**: Có thể cài đặt như app
- **Responsive**: Tối ưu cho mọi kích thước màn hình

---

## 8. MÔ HÌNH TRIỂN KHAI

### 8.1. Môi trường phát triển
- **Local Development**: `npm start` hoặc `npm run dev`
- **API URL**: Cấu hình qua `.env` file
- **Socket URL**: Tự động detect hoặc cấu hình

### 8.2. Môi trường production
- **Web**: Build với `npm run build:pwa`
- **Android**: Build với `npm run build` và `npm run cap:run:android`
- **iOS**: Build với `npm run build` và `npm run cap:run:ios`

### 8.3. Cấu hình môi trường
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000
REACT_APP_NATIVE_API_URL=https://api.bluecode.com
```

### 8.4. Deployment
- **Web**: Deploy build folder lên web server (Nginx, Apache, etc.)
- **Android**: Build APK/AAB và publish lên Google Play Store
- **iOS**: Build IPA và publish lên App Store

---

## 9. BẢO MẬT

### 9.1. Xác thực
- **JWT Token**: Lưu trong localStorage
- **Authorization Header**: Tự động thêm vào mọi request
- **Token Refresh**: Xử lý khi token hết hạn (401)

### 9.2. Bảo mật API
- **HTTPS**: Bắt buộc cho production
- **CORS**: Cấu hình trên backend
- **Error Handling**: Không expose thông tin nhạy cảm

### 9.3. Bảo mật dữ liệu
- **LocalStorage**: Chỉ lưu token và dữ liệu không nhạy cảm
- **Offline Queue**: Không lưu thông tin nhạy cảm
- **Native Permissions**: Yêu cầu quyền truy cập khi cần

---

## 10. XỬ LÝ LỖI

### 10.1. Network Errors
- **Retry Mechanism**: Tự động retry với số lần giới hạn
- **Offline Queue**: Lưu request khi offline
- **User Notification**: Thông báo cho người dùng

### 10.2. API Errors
- **401 Unauthorized**: Tự động logout và redirect
- **403 Forbidden**: Hiển thị thông báo không có quyền
- **404 Not Found**: Thông báo không tìm thấy
- **500 Server Error**: Thông báo lỗi server

### 10.3. Socket Errors
- **Connection Error**: Tự động reconnect
- **Reconnect Attempts**: Số lần reconnect không giới hạn
- **Error Handling**: Xử lý lỗi WebSocket gracefully

---

## 11. TỐI ƯU HÓA

### 11.1. Performance
- **Code Splitting**: Lazy loading components
- **Memoization**: React.memo và useMemo
- **Image Optimization**: Compress và resize ảnh
- **Bundle Size**: Tree shaking và minification

### 11.2. Caching
- **Service Worker**: Cache static assets
- **LocalStorage**: Cache dữ liệu thường dùng
- **Memory Cache**: Cache trong memory khi cần

### 11.3. Network Optimization
- **Request Batching**: Gộp nhiều request khi có thể
- **Retry Strategy**: Retry thông minh với exponential backoff
- **Offline First**: Ưu tiên offline experience

---

## 12. TESTING & QUALITY ASSURANCE

### 12.1. Type Safety
- **TypeScript**: Type checking tại compile time
- **Type Definitions**: Định nghĩa types cho tất cả data structures

### 12.2. Code Quality
- **ESLint**: Code linting (nếu có)
- **Code Review**: Review code trước khi merge
- **Best Practices**: Tuân thủ React và TypeScript best practices

---

## 13. TÀI LIỆU THAM KHẢO

### 13.1. Documentation
- React: https://react.dev
- TypeScript: https://www.typescriptlang.org
- Capacitor: https://capacitorjs.com
- Socket.io: https://socket.io
- Tailwind CSS: https://tailwindcss.com

### 13.2. Project Files
- `README.md`: Hướng dẫn cài đặt và sử dụng
- `package.json`: Dependencies và scripts
- `capacitor.config.ts`: Cấu hình Capacitor
- `tsconfig.json`: Cấu hình TypeScript

---

## 14. ROADMAP & FUTURE ENHANCEMENTS

### 14.1. Tính năng dự kiến
- [ ] Voice call integration
- [ ] Video call support
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Advanced search và filtering
- [ ] Export reports (PDF, Excel)

### 14.2. Cải thiện kỹ thuật
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Performance monitoring
- [ ] Error tracking (Sentry, etc.)
- [ ] Analytics integration

---

**Tài liệu này được tạo tự động dựa trên phân tích codebase của dự án Blue Code.**

**Phiên bản**: 1.0.0  
**Ngày cập nhật**: 27/01/2026
