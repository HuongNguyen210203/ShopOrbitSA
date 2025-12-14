# Caching Strategy Specification

## 1. Catalog Service (Read-Heavy)

> The Catalog Service is read-heavy. Caching is applied to reduce PostgreSQL load, improve API response times, and save network bandwidth.

### 1.1 Redis Caching Strategy (Server-Side)

**Cache Key Patterns**

| Cache Key Pattern                               | Description                              |
| :---------------------------------------------- | :--------------------------------------- |
| `catalog:product:{id}`                          | Cache a single product detail            |
| `catalog:products:p{page}_s{size}_filters...`   | Cache product list with paging & filters |
| `catalog:category:{id}`                         | Cache a single category detail           |
| `catalog:categories:p{page}_s{size}_filters...` | Cache category list with paging          |

**TTL (Time To Live)**

| Data Type               | TTL        | Reason                                                                                    |
| :---------------------- | :--------- | :---------------------------------------------------------------------------------------- |
| Product/Category Detail | 30 minutes | Data changes infrequently.                                                                |
| Product/Category List   | 2 minutes  | Lists are frequently affected by CRUD operations; short TTL ensures eventual consistency. |

**Invalidation Strategy**

| Operation                   | Invalidation Logic                                                                 |
| :-------------------------- | :--------------------------------------------------------------------------------- |
| **Create** Product/Category | List cache is **not** immediately removed. It expires naturally (TTL).             |
| **Update** Product/Category | Remove specific detail cache (`catalog:product:{id}`). List cache updates via TTL. |
| **Delete** Product/Category | Remove specific detail cache (`catalog:product:{id}`). List cache updates via TTL. |

### 1.2 HTTP Caching (Client-Side)

Uses HTTP Headers to allow browsers/proxies to cache responses.

- **Mechanism**: ETag (Entity Tag).
  1. Server generates an MD5 hash of the response content.
  2. Client stores the ETag.
  3. Subsequent requests send `If-None-Match`.
  4. If hash matches -> Server returns `304 Not Modified` (No body).
- **Configuration**:
  - `Cache-Control: public, max-age=60`
  - `ETag: "<hash>"`
- **Applied Endpoints**:
  - `GET /products`
  - `GET /products/{id}`
  - `GET /categories`

---

## 2. Basket & Ordering Services (Transactional State)

This flow uses Redis as the primary storage for the shopping cart state and coordinates between services.

### 2.1 Basket Service (Redis as Primary Store)

- **Purpose**: Temporary storage for the user's shopping cart (Stateful).
- **Key Pattern**: `{UserId}` (Raw GUID).
  - _> Note: The `InstanceName` prefix has been removed in `Program.cs` configuration to ensure the Ordering Service can access this key directly._
- **Data Structure**: JSON String (Serialized `ShoppingCart` object).
- **TTL**: Persist (Does not expire automatically; persists until the order is placed).
- **Logic**:
  - **Write**: `BasketController` overwrites the entire JSON value.
  - **Read**: `BasketController` reads the JSON to return to the client.

### 2.2 Ordering Service (Redis Reader)

- **Purpose**: Retrieve basket data to create an order (ensures price security and data integrity).
- **Logic**:
  1. **Trigger**: `POST /api/orders`.
  2. **Read**: Service extracts `UserId` from the Token -> Reads Redis Key `{UserId}`.
  3. **Invalidation**: After successfully executing `SaveChanges` to PostgreSQL -> Calls `RemoveAsync(userId)` to clear the shopping cart.

---

## 3. Payment Service (Idempotency)

- **Purpose**: Prevent transaction duplication (Idempotency handling).
- **Key Pattern**: `processed_order_{OrderId}`
- **TTL**: 24 hours.
- **Logic**:
  - **Before Processing**: Check `Get(key)`. If it exists -> Return immediately (skip processing).
  - **After Processing**: Call `Set(key, "processed")` to mark the transaction as complete.

---

## 4. Summary of Benefits

- **Reduced Database Load**: High-traffic read operations are intercepted by Redis.
- **Bandwidth Efficiency**: `304 Not Modified` responses prevent sending redundant data.
- **Data Consistency**: Strategy balances between immediate consistency (Basket) and eventual consistency (Catalog Lists).
- **Reliability**: Idempotency keys in the Payment service prevent double-charging.
