# Hướng dẫn Backend: Trạng thái cuộc gọi (Call Status)

Tài liệu này mô tả **các yêu cầu backend** để phù hợp với frontend hiện tại sau các thay đổi gần đây.

---

## 📋 Tổng quan

Frontend đã được cập nhật để xử lý các trạng thái cuộc gọi một cách thống nhất. Backend cần đảm bảo:

1. ✅ **`call_logs.status`** có đầy đủ các giá trị: `pending`, `accepted`, `rejected`, `timeout`, `cancelled`, `unreachable` (nếu dùng)
2. ✅ **Thứ tự check status** trong backend phải đúng: `accepted` → `cancelled` → `timeout` → `rejected`
3. ✅ **Socket events** emit đúng với `callLog` object đầy đủ
4. ✅ **Không emit duplicate events**

---

## 1. Bảng `call_logs.status` - Giá trị bắt buộc

| `status` | Khi nào set | FE hiển thị | Màu |
|----------|-------------|-------------|-----|
| `pending` | Vừa tạo cuộc gọi, chờ phản hồi | "Chờ phản hồi" | Vàng nhạt (`#fbbf24`) |
| `accepted` | User department **nhận** cuộc gọi | "Đã xác nhận" | Xanh (`#22c55e`) |
| `rejected` | User department **từ chối** | "Từ chối" | Vàng (`#facc15`) |
| `timeout` | Hết thời gian chờ, **không phản hồi** | "Không liên lạc được" | Xám (`#9ca3af`) |
| `cancelled` | Người gọi (floor) **hủy** cuộc gọi | "Đã hủy" | Cam (`#f97316`) |
| `unreachable` *(tùy chọn)* | Không gửi/liên lạc được tới đích | "Không liên lạc được" | Xám (`#9ca3af`) |

**QUAN TRỌNG:**
- Nếu dùng `unreachable`, frontend sẽ xử lý như `timeout`
- Không thêm giá trị `status` tự nghĩ nếu frontend chưa map

---

## 2. Logic xử lý status trong Backend

### 2.1 Thứ tự check status (QUAN TRỌNG)

Backend cần check status theo thứ tự này để tránh nhầm lẫn:

```javascript
if (callLog.status === "accepted" || callLog.accepted_at) {
  // Xử lý accepted
} else if (callLog.status === "cancelled") {
  // Xử lý cancelled - CHECK TRƯỚC rejected
} else if (callLog.status === "timeout" || callLog.status === "unreachable") {
  // Xử lý timeout - CHECK TRƯỚC rejected
} else if (callLog.status === "rejected" || callLog.rejected_at) {
  // Xử lý rejected - CHECK CUỐI CÙNG
}
```

**Lý do:**
- `cancelled` và `timeout` có thể có `rejected_at` set, nhưng không phải là `rejected`
- Nếu check `rejected` trước, sẽ nhầm `cancelled`/`timeout` thành `rejected`

### 2.2 Khi nào cập nhật status

#### `pending`
- **Khi:** Tạo bản ghi `call_logs` trong `POST /api/call`
- **Hành động:** `status = 'pending'`, `sender` = tên người gọi, `receiver` = tên đích

#### `accepted`
- **Khi:** User department **nhận** cuộc gọi (socket `acceptCall`)
- **Hành động:**
  - Set `accepted_at = NOW()`, `status = 'accepted'`
  - Emit `callLogUpdated`: `{ callLog: {...} }`

#### `rejected`
- **Khi:** User department **từ chối** cuộc gọi
- **Hành động:**
  - Set `rejected_at = NOW()`, `status = 'rejected'`
  - Emit `callLogUpdated`: `{ callLog: {...} }`

#### `timeout`
- **Khi:** Hết thời gian chờ (ví dụ: 20 giây), **không phản hồi**
- **Hành động:**
  - Set `rejected_at = NOW()` (hoặc cột riêng nếu có), `status = 'timeout'`
  - Emit `callLogUpdated`: `{ callLog: {...} }`

#### `cancelled`
- **Khi:** Người gọi (floor) **hủy** cuộc gọi (`POST /api/call/:callId/cancel` hoặc socket `cancelCall`)
- **Hành động:**
  - Set `rejected_at = NOW()`, `status = 'cancelled'` cho **tất cả** bản ghi `call_logs` của `call_id` đó
  - Emit `callLogUpdated`: `{ callLog: {...} }` cho từng đích

---

## 3. Cấu trúc `callLog` object trong Socket Events

### 3.1 Fields bắt buộc

```typescript
interface CallLog {
  id: number;                    // ✅ Bắt buộc - để FE tạo incident id
  sender: string;                 // ✅ Bắt buộc - tên người gọi (user name hoặc department name)
  receiver: string;              // ✅ Bắt buộc - tên người nhận (department name)
  status: 'pending' | 'accepted' | 'rejected' | 'timeout' | 'cancelled' | 'unreachable';
  message?: string;               // ✅ Optional - nội dung cuộc gọi
  created_at: string;            // ✅ Bắt buộc - ISO date string
  accepted_at?: string | null;    // ✅ Optional - ISO date string hoặc null
  rejected_at?: string | null;    // ✅ Optional - ISO date string hoặc null
  // ... other fields
}
```

### 3.2 Ví dụ emit đúng

```javascript
// ✅ ĐÚNG: Lấy đầy đủ thông tin từ DB trước khi emit
const callLog = await db.query(`
  SELECT 
    id, sender, receiver, status, message,
    created_at, accepted_at, rejected_at
  FROM call_logs 
  WHERE id = ?
`, [callLogId]);

io.to(organizationRoom).emit('callLogUpdated', {
  callLog: callLog[0]  // Đầy đủ fields
});
```

---

## 4. Socket Events

### 4.1 Events cần emit

| Event | Khi nào emit | Payload |
|-------|--------------|---------|
| `callLogCreated` | Khi tạo call log mới (`POST /api/call`) | `{ callLog: {...} }` |
| `callLogUpdated` | Khi cập nhật status (`accepted`, `rejected`, `timeout`, `cancelled`) | `{ callLog: {...} }` |
| `callStatusUpdate` | Khi status thay đổi (cho CallStatusModal) | `{ callId, toDept, status }` |

### 4.2 Quan trọng: Chỉ emit một lần

```javascript
// ✅ ĐÚNG: Chỉ emit một lần
await updateCallLog(callLogId, { status: 'rejected' });
const updatedCallLog = await getCallLogById(callLogId);

io.to(organizationRoom).emit('callLogUpdated', {
  callLog: updatedCallLog
});

// ❌ SAI: Emit nhiều lần
io.to(organizationRoom).emit('callLogUpdated', { callLog: updatedCallLog });
io.to(organizationRoom).emit('callStatusUpdate', { callId, status: 'rejected' }); // Nếu dùng riêng thì OK
```

---

## 5. Checklist Backend

Trước khi deploy, đảm bảo:

- [ ] **`call_logs.status` hỗ trợ đầy đủ**: `pending`, `accepted`, `rejected`, `timeout`, `cancelled`, `unreachable` (nếu dùng)
- [ ] **Thứ tự check status đúng**: `accepted` → `cancelled` → `timeout` → `rejected`
- [ ] **`callLog` object đầy đủ fields**: `id`, `sender`, `receiver`, `status`, `created_at`, `accepted_at`, `rejected_at`
- [ ] **Mỗi call log update chỉ emit một socket event** (`callLogCreated` hoặc `callLogUpdated`)
- [ ] **Không emit duplicate events** (sử dụng debounce/throttle nếu cần)
- [ ] **Test với nhiều users cùng lúc** để đảm bảo không có race condition

---

## 6. Ví dụ code Backend

```javascript
// services/callService.js

async function updateCallStatus(callLogId, status) {
  // Update DB với status đúng
  const updateQuery = `
    UPDATE call_logs 
    SET status = ?, 
        ${status === 'accepted' ? 'accepted_at' : 'rejected_at'} = NOW()
    WHERE id = ?
    RETURNING *
  `;
  
  const result = await db.query(updateQuery, [status, callLogId]);
  const updatedCallLog = result[0];

  // Lấy đầy đủ thông tin
  const fullCallLog = await db.query(`
    SELECT 
      id, sender, receiver, status, message,
      created_at, accepted_at, rejected_at
    FROM call_logs 
    WHERE id = ?
  `, [callLogId]);

  // Emit một lần
  const organizationId = await getOrganizationId(updatedCallLog.sender);
  io.to(`org:${organizationId}`).emit('callLogUpdated', {
    callLog: fullCallLog[0]
  });

  return updatedCallLog;
}

// Sử dụng với thứ tự check đúng
async function handleCallResponse(callLogId, response) {
  if (response === 'accept') {
    await updateCallStatus(callLogId, 'accepted');
  } else if (response === 'reject') {
    await updateCallStatus(callLogId, 'rejected');
  }
}

async function handleCallTimeout(callLogId) {
  await updateCallStatus(callLogId, 'timeout');
}

async function handleCallCancel(callId) {
  // Update tất cả call logs của call_id này
  await db.query(`
    UPDATE call_logs 
    SET status = 'cancelled', rejected_at = NOW()
    WHERE call_id = ?
  `, [callId]);

  // Lấy tất cả call logs đã update
  const callLogs = await db.query(`
    SELECT 
      id, sender, receiver, status, message,
      created_at, accepted_at, rejected_at
    FROM call_logs 
    WHERE call_id = ?
  `, [callId]);

  // Emit cho từng call log
  const organizationId = await getOrganizationId(callLogs[0].sender);
  callLogs.forEach(callLog => {
    io.to(`org:${organizationId}`).emit('callLogUpdated', {
      callLog: callLog
    });
  });
}
```

---

## 📝 Tóm tắt

**Yêu cầu Backend:**
1. ✅ `call_logs.status` có đầy đủ: `pending`, `accepted`, `rejected`, `timeout`, `cancelled`, `unreachable`
2. ✅ Thứ tự check: `accepted` → `cancelled` → `timeout` → `rejected`
3. ✅ `callLog` object đầy đủ fields khi emit socket events
4. ✅ Chỉ emit một socket event cho mỗi call log update
5. ✅ Không emit duplicate events

**Kết quả:** Frontend sẽ hiển thị đúng trạng thái cuộc gọi, không còn duplicate incidents, và real-time updates hoạt động đúng.
