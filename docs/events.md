# Event Messaging Specification

## 1. Message Broker

- **Technology**: RabbitMQ
- **Exchange Type**: Fanout (or Topic)

## 2. Event Contracts

Business events (Domain Events) emitted across the system.

# Event Messaging Specification – Catalog Service

> The Catalog Service publishes domain events whenever important data changes occur.
> These events enable other microservices to stay synchronized in a loosely coupled manner.

### `Event Contracts`

### 3.1 ProductCreatedEvent

```json
{
  "ProductId": "guid-xxx",
  "Name": "iPhone 15 Pro",
  "Price": 999.0,
  "CategoryId": "guid-yyy",
  "OccurredAt": "2025-12-01T10:00:00Z"
}
```

### 3.2 ProductUpdatedEvent

```json
{
  "ProductId": "guid-xxx",
  "UpdatedFields": ["Price", "StockQuantity"],
  "OccurredAt": "2025-12-01T10:05:00Z"
}
```

### 3.2 ProductDeletedEvent

```json
{
  "ProductId": "guid-xxx",
  "OccurredAt": "2025-12-01T10:10:00Z"
}
```

### `Potential Consumers`

| Service                 | Purpose                                              |
| ----------------------- | ---------------------------------------------------- |
| Ordering Service        | Store product price snapshot during user checkout    |
| Search Service (future) | Re-index product data in Elasticsearch               |
| Notification Service    | Notify administrators when products are out of stock |

### `Retry Strategy`

The Catalog Service uses MassTransit retry policies to handle transient failures.

```yaml
Retry: 3 times
Delay intervals: 2s → 5s → 10s
Backoff: Incremental
```

> If all retry attempts fail, the message is moved to a Dead Letter Queue (DLQ) for later inspection.

### `OrderCreatedEvent`

- **Trigger**: When a User successfully places an order in the Ordering Service.
- **Publisher**: Ordering Service.
- **Consumers**:
  - _Email Service_: Send confirmation email.
  - _Cart Service_: Clear shopping cart.
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

- Uses the **MassTransit** library Retry Policy.
- **Strategy**: Incremental Retry.
- **Config**: Retry 3 times, intervals of 2s, 5s, 10s. If it still fails -> Push to Dead Letter Queue (DLQ).

## 4. Implemented Event Saga (Update)

The order processing workflow (Choreography) has been implemented as follows:

### Config RabbitMQ

- **Host:** `shoporbit-rabbitmq` (Docker Network).
- **Retry Policy:** Incremental (3 times: 2s, 5s, 10s) configured in the `Program.cs` consumer.

### Luồng sự kiện 1: Order Created

- **Trigger:** API `POST /api/orders` successful (Status: Pending).
- **Publisher:** `Ordering Service`.
- **Consumer:** `Payment Service` (Class `OrderCreatedConsumer`).
- **Payload:**
  ```json
  {
    "OrderId": "Guid",
    "UserId": "Guid",
    "TotalAmount": decimal,
    "CreatedAt": "DateTime"
  }
  ```

### Luồng sự kiện 2: Payment Succeeded

This is the payment confirmation step to complete the order process (Saga Choreography).

- **Event Name:** `ShopOrbit.BuildingBlocks.Contracts.PaymentSucceededEvent`
- **Trigger:**
  - After `Payment Service` successfully processes the `OrderCreatedEvent`.
  - The payment transaction has been securely saved to the `Payments` table in the Database.
- **Publisher:** `Payment Service`
- **Consumer:** `Ordering Service` (Class `PaymentSucceededConsumer`)

#### Data Payload (JSON)

Data sent over RabbitMQ:

```json
{
  "OrderId": "Guid (ID của đơn hàng gốc)",
  "PaymentId": "Guid (ID của giao dịch thanh toán vừa tạo)",
  "ProcessedAt": "DateTime (Thời gian xử lý, UTC)"
}
```
