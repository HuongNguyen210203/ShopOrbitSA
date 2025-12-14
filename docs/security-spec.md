# Security Specification – ShopOrbit

## 1. Introduction

This document outlines the security architecture and mechanisms implemented in the ShopOrbit microservices system. ShopOrbit uses a centralized **Identity Service** to handle authentication and authorization. Downstream services (Catalog, Ordering, Basket) rely on JWT tokens issued by the Identity Service to verify user identity and enforce permissions.

## 2. Security Architecture

### 2.1 Identity Service Overview

The Identity Service is the central authority for user management.

- **Core Function**: Stores user accounts, handles login/registration, and issues JWT access tokens.
- **Token Strategy**: After a successful login, the service issues a JWT containing user identity, roles, and permission claims.
- **Tech Stack**: ASP.NET Core Identity, PostgreSQL (User Store), MassTransit (for email events/integration).

### 2.2 Authentication Flow (JWT)

The system uses **JSON Web Token (JWT)** for stateless authentication.

1.  **Client** sends credentials (username, password) to the `Identity Service` (`/api/auth/login`).
2.  **Identity Service** validates credentials. If valid, it returns an **Access Token**.
3.  **Client** sends subsequent requests to the **API Gateway** with the header: `Authorization: Bearer <token>`.
4.  **API Gateway** forwards the request to the appropriate downstream service (Catalog, Ordering, etc.).
5.  **Downstream Services** validate the JWT signature, expiration, and claims using authentication middleware before processing the request.

---

## 3. Authentication Implementation

### 3.1 Token Configuration

- **Signing Algorithm**: HMAC-SHA256
- **Issuer**: `ShopOrbitIdentity`
- **Audience**: `ShopOrbitClient`
- **Expiration**: 60 minutes
- **Secret Key**: Loaded from environment variable `JwtSettings__Secret`.

### 3.2 Registration & Email Confirmation

- **Registration (`POST /api/v1/auth/register`)**:
  - Creates a new user account with the default role: `User`.
  - Rejects request if Username or Email already exists.
  - Generates an email confirmation token and sends a link via email.
- **Confirmation (`GET /api/v1/auth/confirm-email`)**:
  - **Requirement**: `options.SignIn.RequireConfirmedEmail = true`.
  - Users cannot log in until they visit the confirmation link.
  - Tokens are URL-encoded to prevent corruption.

### 3.3 Login (`POST /api/v1/auth/login`)

- Validates username and password.
- Checks `EmailConfirmed == true`.
- Loads User Roles and Permission Claims.
- Returns the JWT.

### 3.4 Password Management

- **Forgot Password**: Generates a reset token and sends it via email. Returns a generic response to prevent user enumeration.
- **Reset Password**: Accepts userId, token, and newPassword to reset credentials.
- **Change Password**: Requires a valid JWT (authenticated user) to change their own password.

---

## 4. Authorization (Roles & Permissions)

Authorization is enforced using **Roles** (high-level) and **Claims** (granular permissions).

### 4.1 Defined Roles

| Role      | Description                                                        |
| :-------- | :----------------------------------------------------------------- |
| **Admin** | Full system access (CRUD Products, Manage Users, View All Orders). |
| **Staff** | Operational access (Update Order Status, View Products).           |
| **User**  | Customer access (View Products, Place Orders, View Own History).   |

### 4.2 Permission Claims

Permissions are injected into the JWT as claims during login.

- **Admin**: `product.manage`, `order.manage`
- **Staff**: `product.manage`, `order.manage`
- **User**: `order.create`, `order.view_own`

### 4.3 JWT Token Structure

A typical JWT payload in ShopOrbit:

```json
{
  "sub": "guid-user-id",
  "email": "admin@shoporbit.com",
  "name": "admin_user",
  "role": ["Admin"],
  "permission": ["product.manage", "order.manage"],
  "iss": "ShopOrbitIdentity",
  "aud": "ShopOrbitClient",
  "exp": 1733461200
}
```

## 5. Service-Level Security (Implementation Details)

This section details how security is implemented in specific microservices to prevent common vulnerabilities.

### 5.1 Basket Service (Secure State)

- **Protection**: `[Authorize]` attribute on `BasketController`.
- **IDOR Prevention**: The API **does not** accept `userName` or `userId` from the URL or Request Body.
  - **Logic**: The code automatically extracts the `UserId` from the JWT Context:
  ```csharp
  var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
  ```
  - This ensures a user can only access their own basket in Redis.

### 5.2 Ordering Service (Secure Transaction)

- **Protection**: `[Authorize]` attribute on `OrdersController`.
- **Data Integrity**: When placing an order, the Client sends an empty body (or just shipping address).
  - **Logic**: The server extracts `UserId` from the Token -> Queries Redis directly to retrieve the basket items.
  - **Benefit**: Prevents malicious clients from modifying product prices or quantities in the payload during checkout.

### 5.3 Catalog Service (Access Control)

The Catalog Service enforces strict role-based access control for administrative operations.

- **Read Operations (Public/Auth)**: Products and Categories are viewable by all authenticated users (User, Staff, Admin).
- **Write Operations (Admin Only)**: Creating, updating, or deleting products/categories is strictly limited to the `Admin` role.

---

## 6. Endpoint Security Matrix

### Identity Service

| Endpoint                       | Method | Auth Required | Notes                  |
| :----------------------------- | :----: | :-----------: | :--------------------- |
| `/api/v1/auth/register`        |  POST  |      No       | Public                 |
| `/api/v1/auth/confirm-email`   |  GET   |      No       | Public                 |
| `/api/v1/auth/login`           |  POST  |      No       | Public                 |
| `/api/v1/auth/forgot-password` |  POST  |      No       | Public                 |
| `/api/v1/auth/reset-password`  |  POST  |      No       | Public                 |
| `/api/v1/auth/me`              |  GET   |      Yes      | Any authenticated user |
| `/api/v1/auth/change-password` |  POST  |      Yes      | Any authenticated user |

### Catalog Service (Detailed)

| Resource       | Method | Endpoint               | Required Role      |
| :------------- | :----: | :--------------------- | :----------------- |
| **Products**   |  GET   | `/api/products`        | User, Staff, Admin |
|                |  GET   | `/api/products/{id}`   | User, Staff, Admin |
|                |  POST  | `/api/products`        | **Admin**          |
|                |  PUT   | `/api/products/{id}`   | **Admin**          |
|                | DELETE | `/api/products/{id}`   | **Admin**          |
| **Categories** |  GET   | `/api/categories`      | User, Staff, Admin |
|                |  GET   | `/api/categories/{id}` | User, Staff, Admin |
|                |  POST  | `/api/categories`      | **Admin**          |
|                |  PUT   | `/api/categories/{id}` | **Admin**          |
|                | DELETE | `/api/categories/{id}` | **Admin**          |

### Ordering Service

| Endpoint      | Method | Required Role | Description            |
| :------------ | :----: | :------------ | :--------------------- |
| `/api/orders` |  GET   | Admin, Staff  | View all system orders |
| `/api/orders` |  POST  | User          | Place a new order      |

---

## 7. Threat Model & Mitigations

| Threat                      | Mitigation Strategy                                                                                         |
| :-------------------------- | :---------------------------------------------------------------------------------------------------------- |
| **Token Tampering**         | JWTs are signed with HMAC-SHA256. Any modification invalidates the signature.                               |
| **Unauthorized Access**     | Endpoints are protected by `[Authorize]` policies checking specific Roles/Claims. Deny-by-default approach. |
| **Account Takeover**        | Strong password policies enforced by ASP.NET Identity.                                                      |
| **Email Bypass**            | Login is rejected if `EmailConfirmed` is false in the database.                                             |
| **User Enumeration**        | "Forgot Password" endpoints return generic messages regardless of whether the email exists.                 |
| **Price Manipulation**      | The Ordering Service ignores client prices and rebuilds the order from the secure Redis Basket.             |
| **Sensitive Data Exposure** | Identity data is not exposed by Catalog. Only minimal required claims are included in JWTs.                 |
| **Replay Attacks**          | Access tokens have a short lifespan (60 minutes).                                                           |
