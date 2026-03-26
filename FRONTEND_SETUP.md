### Giới thiệu

Frontend `Nhom02_KTvTKPM_DHKTPM18A_Frontned` được dự kiến sử dụng **React + Vite** và giao tiếp với backend `Nhom02_KTvTKPM_DHKTPM18A_Backend` thông qua REST API.

Toàn bộ URL backend sẽ được cấu hình qua các biến môi trường bắt đầu bằng `VITE_`.

---

### Biến môi trường frontend (`.env`)

Các biến môi trường dùng cho frontend được định nghĩa mẫu trong:

- `.env.example` (đặt ở **root** project frontend)

Nội dung chính:

- `VITE_API_BASE_URL` – URL gốc của backend cho môi trường dev:
  - Mặc định: `http://localhost:8080/api`
- `VITE_APP_FRONTEND_URL` – URL của chính frontend (nếu cần dùng trong code, ví dụ tạo link, redirect,...):
  - Mặc định: `http://localhost:5173`
- (Tuỳ chọn) `VITE_API_BASE_URL_PROD` – URL backend cho môi trường production:
  - Ví dụ: `https://your-backend-domain.com/api`

#### Các bước chuẩn bị `.env` cho frontend:

1. Tại thư mục `Nhom02_KTvTKPM_DHKTPM18A_Frontned`, copy:
   - Từ: `.env.example`
   - Thành: `.env`
2. Chỉnh sửa giá trị biến cho phù hợp:
   - Dev:
     - `VITE_API_BASE_URL=http://localhost:8080/api`
     - `VITE_APP_FRONTEND_URL=http://localhost:5173`
   - Prod (nếu dùng):
     - `VITE_API_BASE_URL_PROD=https://your-backend-domain.com/api`

> **Lưu ý**: Với Vite, chỉ những biến bắt đầu bằng `VITE_` mới được expose vào code frontend.

---

### Yêu cầu môi trường

- **Node.js**: khuyến nghị **>= 18**.
- **Trình quản lý package**:
  - `npm` (bundled với Node.js) hoặc
  - `yarn` / `pnpm` (tuỳ bạn chọn).

---

### Cách cài đặt & chạy frontend (dev)

Giả sử code React + Vite đã được khởi tạo bên trong repo này.

1. **Cài đặt dependencies**:

   ```bash
   # Tại thư mục Nhom02_KTvTKPM_DHKTPM18A_Frontned
   npm install
   # hoặc
   yarn
   ```

2. **Tạo file `.env` từ `.env.example`**:

   ```bash
   cp .env.example .env
   ```

   Sau đó sửa `VITE_API_BASE_URL` trỏ đến backend:

   - Dev: `http://localhost:8080/api`

3. **Chạy dev server**:

   ```bash
   npm run dev
   # hoặc
   yarn dev
   ```

   Mặc định Vite chạy tại: `http://localhost:5173`

---

### Kết nối với Backend

- Backend đã được cấu hình chạy tại:
  - Dev: `http://localhost:8080`
- Frontend sử dụng:
  - `VITE_API_BASE_URL` để gọi API, ví dụ: `http://localhost:8080/api`.

Đảm bảo backend đang chạy **trước** khi truy cập frontend, để tránh lỗi request thất bại.

---

### CORS (gợi ý cấu hình phía backend)

Để frontend (Vite dev: `http://localhost:5173`) gọi được API backend, backend cần cho phép origin này trong cấu hình CORS, ví dụ:

- Cho phép origin: `http://localhost:5173`
- Khi deploy production:
  - Cho phép origin bằng với `FRONTEND_URL` bạn cấu hình trong backend (`FRONTEND_URL`, `app.frontend.url`).

Chi tiết cấu hình CORS phụ thuộc vào implementation trong Spring Boot (WebSecurity, `@CrossOrigin`, hoặc `CorsConfigurationSource`, ...).

