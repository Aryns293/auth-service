# 🔐 Auth Service

A production-ready authentication and authorization microservice built from scratch — featuring stateless JWT authentication, refresh token rotation, role-based access control (RBAC), and brute-force protection via rate limiting.

> Built as a standalone service that any application can plug into, similar to Auth0 or Firebase Auth — but fully self-hosted and customizable.

---

## ⚡ Features

| Feature | Details |
|---|---|
| **JWT Authentication** | Short-lived access tokens (15m) + long-lived refresh tokens (7d) |
| **Refresh Token Rotation** | Old token invalidated on every refresh — replay attacks prevented |
| **RBAC** | Three roles: `ADMIN`, `USER`, `GUEST` with middleware-level enforcement |
| **Rate Limiting** | Max 5 login attempts per 15 minutes per IP (sliding window) |
| **Secure Password Storage** | bcrypt with cost factor 12 |
| **Token Revocation** | Refresh tokens stored in DB — instant invalidation on logout |

---

## 🛠 Tech Stack

- **Runtime** — Node.js + Express
- **Database** — PostgreSQL via Prisma ORM
- **Auth** — JSON Web Tokens (`jsonwebtoken`)
- **Hashing** — `bcryptjs`
- **Rate Limiting** — `express-rate-limit`

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- PostgreSQL (or Docker)
- npm

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/auth-service.git
cd auth-service
npm install
```

### 2. Start PostgreSQL

```bash
docker run --name auth-postgres \
  -e POSTGRES_PASSWORD=password123 \
  -e POSTGRES_DB=authdb \
  -p 5432:5432 \
  -d postgres
```

### 3. Configure Environment

Create a `.env` file in the root:

```env
DATABASE_URL="postgresql://postgres:password123@localhost:5432/authdb"
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-refresh-secret-key"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=3000
```

### 4. Run Migrations & Start

```bash
npx prisma migrate dev --name init
npm run dev
```

Server starts at `http://localhost:3000`

---

## 📡 API Reference

### Auth Routes

#### `POST /api/auth/register`
Register a new user.

```json
// Request Body
{
  "email": "user@example.com",
  "password": "password123",
  "role": "USER"
}

// Response 201
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "USER",
    "createdAt": "2026-05-26T18:49:45.231Z"
  }
}
```

#### `POST /api/auth/login` ⚠️ Rate Limited
Login with credentials.

```json
// Request Body
{
  "email": "user@example.com",
  "password": "password123"
}

// Response 200
{
  "message": "Login successful",
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci...",
  "user": { "id": "...", "email": "...", "role": "USER" }
}
```

#### `POST /api/auth/refresh`
Rotate refresh token and get new access token.

```json
// Request Body
{ "refreshToken": "eyJhbGci..." }

// Response 200
{
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci..."
}
```

#### `POST /api/auth/logout`
Invalidate refresh token.

```json
// Request Body
{ "refreshToken": "eyJhbGci..." }
```

---

### User Routes (Protected)

All user routes require:
```
Authorization: Bearer <accessToken>
```

#### `GET /api/users/profile`
Get current user's profile. *(Any authenticated user)*

#### `GET /api/users`
Get all users. *(ADMIN only)*

#### `PATCH /api/users/:id/role`
Update a user's role. *(ADMIN only)*

```json
// Request Body
{ "role": "ADMIN" }
```

---

## 🏗 Architecture

```
Client
  │
  ▼
Express App
  │
  ├── /api/auth  ──► Rate Limiter ──► Auth Controller ──► PostgreSQL
  │
  └── /api/users ──► authenticate() ──► authorize() ──► User Controller
                          │                   │
                     Verify JWT          Check Role
```

### Token Flow

```
Login ──► Access Token (15m) + Refresh Token (7d, stored in DB)
             │
             ▼
        Protected Route
             │
        Token Expired?
             │
             ▼
        POST /refresh ──► Old token deleted ──► New tokens issued
             │
        Logout?
             │
        Refresh token deleted from DB (instant revocation)
```

---

## 🔒 Security Decisions

**Why refresh tokens in DB?**
Stateless JWTs can't be revoked — storing refresh tokens in DB allows instant invalidation on logout or suspicious activity.

**Why bcrypt cost factor 12?**
Balances security vs performance. Cost 12 takes ~250ms per hash — slow enough to deter brute force, fast enough for production.

**Why rotate refresh tokens?**
If a refresh token is stolen and used, the legitimate user's next request will detect the token is already consumed — alerting to potential compromise.

**Why rate limit only `/login`?**
Registration and other endpoints don't expose sensitive data. Login is the attack vector for credential stuffing and brute force.

---

## 📁 Project Structure

```
auth-service/
├── prisma/
│   └── schema.prisma          # DB schema (User, RefreshToken, Role)
├── src/
│   ├── config/
│   │   └── db.js              # Prisma client singleton
│   ├── controllers/
│   │   ├── auth.controller.js # Register, Login, Refresh, Logout
│   │   └── user.controller.js # Profile, All Users, Update Role
│   ├── middleware/
│   │   ├── authenticate.js    # JWT verification middleware
│   │   ├── authorize.js       # RBAC role-check middleware
│   │   └── rateLimiter.js     # Login attempt limiter
│   ├── routes/
│   │   ├── auth.routes.js
│   │   └── user.routes.js
│   └── app.js
├── server.js
├── .env
└── package.json
```

---

## 🧪 Test the API

Import into **Thunder Client** or **Postman**:

1. Register an ADMIN user
2. Login → copy `accessToken`
3. Hit `GET /api/users/profile` with `Authorization: Bearer <token>`
4. Try `GET /api/users` — works only with ADMIN token
5. Try login 6 times with wrong password → rate limiter kicks in

---

## 📈 Roadmap

- [ ] OAuth2 — Google & GitHub login
- [ ] Email verification on register
- [ ] Redis-backed rate limiting (distributed deployments)
- [ ] Admin dashboard frontend (Next.js)
- [ ] Swagger / OpenAPI docs

---

## 📄 License

MIT
