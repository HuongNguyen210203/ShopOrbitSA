# Event Messaging Specification

## 1. Message Broker

- **Technology**: RabbitMQ
- **Exchange Type**: Fanout (hoặc Topic)

## 2. Event Contracts

Các sự kiện nghiệp vụ (Domain Events) được bắn ra hệ thống.

### `OrderCreatedEvent`

- **Trigger**: Khi User đặt hàng thành công tại Ordering Service.
- **Publisher**: Ordering Service.
- **Consumers**:
  - _Email Service_: Gửi mail xác nhận.
  - _Cart Service_: Xóa giỏ hàng.
- **Payload Format (JSON)**:
  ```json
  {
    "OrderId": "guid-xxx",
    "UserId": "guid-yyy",
    "TotalAmount": 150.0,
    "CreatedAt": "2025-12-01T10:00:00Z"
  }
  ```

## 3. Retry Policy

- Sử dụng thư viện **MassTransit** Retry Policy.
- **Strategy**: Incremental Retry (Thử lại tăng dần).
- **Config**: Retry 3 lần, khoảng cách 2s, 5s, 10s. Nếu vẫn lỗi -> Đẩy vào Dead Letter Queue (DLQ).
