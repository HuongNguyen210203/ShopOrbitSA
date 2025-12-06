# Caching Strategy Plan

## 1. Redis Caching (Server-Side)

Áp dụng cho dữ liệu đọc nhiều, ít thay đổi (Read-heavy).

| Cache Key Pattern      | Data Content                   | TTL (Time To Live) | Invalidation Strategy              |
| :--------------------- | :----------------------------- | :----------------- | :--------------------------------- |
| `catalog:products:all` | List of all products (summary) | 10 minutes         | Xóa khi Admin thêm/sửa/xóa Product |
| `catalog:product:{id}` | Product detail                 | 30 minutes         | Xóa khi update Product đó          |

## 2. HTTP Caching (Client-Side)

Sử dụng HTTP Headers để browser/proxy cache lại response.

- **Cache-Control**: `public, max-age=60` (Cache 60s cho danh sách sản phẩm).
- **ETag**: Server tính toán hash của data trả về.
  - Nếu Client gửi `If-None-Match` trùng với hash hiện tại -> Trả về `304 Not Modified` (Không tốn băng thông body).
