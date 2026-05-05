# Hatonquyen Backend Merged

Backend này dùng `hatonquyen-backend-1` làm nền để giữ API POI/map đang chạy đúng với mobile app, sau đó ghép các phần cần cho web/admin từ `hatonquyen-backend-2`.

## Điểm đã merge

- Giữ `/api/pois`, POI `lat/lng/address`, translations, menu, audio, reviews cho app.
- Giữ `/api/maps` và `public/maps` cho offline/cloud map của app.
- Mở CORS theo kiểu web-rule để chạy được Vite/dev local.
- Login `/api/users/login` nhận cả `email` và `account/username`.
- Thêm `username` vào User model để web login `admin/ad123`.
- Giữ analytics app `/api/analytics/presence/*`.
- Thêm analytics web `/api/analytics/live-count`, `/api/analytics/users-growth`, `/api/analytics/heartbeat`, `/api/analytics/disconnect`.
- POI `address` được giữ nhưng không bắt buộc để web create/edit POI không bị lỗi thiếu address.
- Thêm `/api/pois/favorites` cho app lấy danh sách POI đã lưu.
- Seed admin mặc định: username `admin`, password `ad123`.

## Cách chạy nhanh

```bash
cp .env.example .env
npm install
npm run seed
npm run dev
```

Web login admin:

```txt
admin
ad123
```

App vẫn trỏ BaseUrl dạng:

```txt
http://<host>:5000/api/
```
