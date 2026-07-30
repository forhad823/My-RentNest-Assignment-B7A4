# 🏠 RentNest Backend API

**RentNest** is a full-featured, high-performance RESTful backend API for a multi-role rental property marketplace. It empowers Tenants to discover, request, and pay for properties, Landlords to list and manage rentals, and Admins to moderate the entire ecosystem with complete data integrity.

---

## 🛠️ Tech Stack & Architecture

- **Runtime**: Node.js & Express.js
- **Language**: TypeScript
- **Database & ORM**: PostgreSQL with Prisma ORM (`@prisma/client` + `@prisma/adapter-pg`)
- **Authentication**: JSON Web Token (JWT) with HTTP-only Cookie support
- **Payments**: Stripe Checkout API + Stripe Webhooks (Raw Buffer Parsing)
- **Deployment**: Configured for Vercel Serverless Deployment

---

## 🗄️ Database Architecture & Entity Relationships

RentNest uses a **PostgreSQL** relational database structured around **6 domain models** spread across 6 Prisma schema files. All models use UUID primary keys and include standard audit timestamps (`createdAt`, `updatedAt`).

### 📐 Full Entity Relationship Diagram (2D Text-Based)

```
┌─────────────────────────────────┐          ┌──────────────────────────────────┐
│              users              │          │            categories            │
├─────────────────────────────────┤          ├──────────────────────────────────┤
│ PK  id           UUID           │          │ PK  id           UUID            │
│     name         VARCHAR(255)   │          │     name         VARCHAR(100) UQ │
│     email        TEXT  UNIQUE   │          │     description  TEXT  nullable  │
│     password     TEXT           │          │     createdAt    TIMESTAMP       │
│     role         Role  enum     │          │     updatedAt    TIMESTAMP       │
│                  TENANT/        │          └──────────────┬───────────────────┘
│                  LANDLORD/ADMIN │                         │
│     activeStatus ActiveStatus   │                         │ 1
│                  ACTIVE/BLOCKED │                         │ has many
│     createdAt    TIMESTAMP      │                         │
│     updatedAt    TIMESTAMP      │                         ▼ N
└─────────┬───────────────────────┘          ┌──────────────────────────────────┐
          │                                  │            properties            │
          │ 1 (as LANDLORD)                  ├──────────────────────────────────┤
          │ has many                         │ PK  id               UUID        │
          ├─────────────────────────────────►│     title            VARCHAR(255)│
          │                                  │     location         VARCHAR(255)│
          │ 1 (as TENANT)                    │     price            FLOAT       │
          │ has many                         │     bedroomCount     INT         │
          │               ┌──────────────────│     bathroomCount    INT         │
          │               │                  │     amenities        TEXT[]      │
          │               │                  │     availabilityStatus           │
          │               │                  │                  AVAILABLE /     │
          │               │                  │                  RENTED /        │
          │               │                  │                  MAINTENANCE     │
          │               │                  │     createdAt        TIMESTAMP   │
          │               │                  │     updatedAt        TIMESTAMP   │
          │               │                  │ FK  categoryId       UUID ───────┘
          │               │                  │ FK  landlordId       UUID ───────|---(→ users)
          │               │                  └──────┬────────────┬─────────────-┘
          │               │1                                     │
          │               │has many                              │ 1
          │               │N                                     │ has many
          │               │                                      ▼ N
          │               │     ┌───────────────────────┐   ┌──────────────────────────┐
          │               │     │    rental_requests    │   │         reviews          │
          │               │     ├───────────────────────┤   ├──────────────────────────┤
          │               │     │ PK id       UUID      │   │ PK id        UUID        │
          │               └────►│ FK tenantId UUID      │   │    rating    INT (1-5)   │
          │                     │ FK propertyId UUID    |   │    comment   TEXT        │
          │                     │    rentAmount FLOAT   |   │    createdAt TIMESTAMP   │
          │                     │    status             |   │    updatedAt TIMESTAMP   │
          │                     │       PENDING /       |   │ FK propertyId UUID       |
          └────────────────────►│       APPROVED /      |   │ FK tenantId  UUID ───────|─► (→ users)
                                │       REJECTED /      |   └──────────────────────────┘
                                │       COMPLETED       |
                                │    createdAt TIMESTAMP|
                                │    updatedAt TIMESTAMP|
                                └──────────────┬────────┘
                                               │ 1
                                               │ has many
                                               ▼ N
                                ┌──────────────────────────────────────┐
                                │               payments               │
                                ├──────────────────────────────────────┤
                                │ PK  id                    UUID       │
                                │ FK  rentalRequestId       UUID       │
                                │     amount                FLOAT      │
                                │     currency              VARCHAR    │
                                │                           default:usd│
                                │     status   PENDING /               │
                                │              COMPLETED / FAILED      │
                                │     stripeSessionId  VARCHAR UQ null │
                                │     stripePaymentIntentId VARCHAR    │
                                │                           UQ null    │
                                │     stripeReceiptUrl  TEXT null      │
                                │     paymentMethod     VARCHAR null   │
                                │     paidAt            TIMESTAMP null │
                                │     createdAt         TIMESTAMP      │
                                │     updatedAt         TIMESTAMP      │
                                └──────────────────────────────────────┘
```

---

### 🔗 Relationship Summary

| From Table        | Relation | To Table           | FK Column         | On Delete  |
| :---------------- | :------: | :----------------- | :---------------- | :--------- |
| `properties`      |  N → 1   | `users` (landlord) | `landlordId`      | `Cascade`  |
| `properties`      |  N → 1   | `categories`       | `categoryId`      | `Restrict` |
| `rental_requests` |  N → 1   | `properties`       | `propertyId`      | `Cascade`  |
| `rental_requests` |  N → 1   | `users` (tenant)   | `tenantId`        | `Cascade`  |
| `payments`        |  N → 1   | `rental_requests`  | `rentalRequestId` | `Cascade`  |
| `reviews`         |  N → 1   | `properties`       | `propertyId`      | `Cascade`  |
| `reviews`         |  N → 1   | `users` (tenant)   | `tenantId`        | `Cascade`  |

> **Note on Cardinality**: `payments` is modeled as **1:N** from `rental_requests` at the schema level (a request can have multiple payment attempt rows), but business logic enforces at most **one** `COMPLETED` payment per request.

---

### 🏷️ Enums

| Enum                   | Values                                         |
| :--------------------- | :--------------------------------------------- |
| `Role`                 | `TENANT`, `LANDLORD`, `ADMIN`                  |
| `ActiveStatus`         | `ACTIVE`, `BLOCKED`                            |
| `PropertyAvailability` | `AVAILABLE`, `RENTED`, `MAINTENANCE`           |
| `RentalRequestStatus`  | `PENDING`, `APPROVED`, `REJECTED`, `COMPLETED` |
| `PaymentStatus`        | `PENDING`, `COMPLETED`, `FAILED`               |

---

### 📄 Model Descriptions

1. **`users`** — Central auth & role entity. A user can act as a `LANDLORD` (owns properties), a `TENANT` (submits rental requests & reviews), or an `ADMIN` (moderates the platform). The `activeStatus` field enables admin-level ban/unban control.
2. **`categories`** — A simple lookup table for property types (Apartment, Villa, Studio, etc.). Linked to properties with a `Restrict` delete rule — a category cannot be deleted while it still has properties.
3. **`properties`** — Core listing entity. Stores multi-valued `amenities` as a PostgreSQL text array (`TEXT[]`). Tracks real-time availability via `availabilityStatus`. Indexed on both `categoryId` and `landlordId` for fast filtering.
4. **`rental_requests`** — Bridges Tenants and Properties. Captures the `rentAmount` at the time of the request. Drives the core approval workflow. Indexed on `propertyId` and `tenantId`.
5. **`payments`** — Stripe-aware payment ledger. Stores the `stripeSessionId` (set at checkout creation) and `stripePaymentIntentId` (set after webhook confirmation), enabling full traceability without building custom receipts (`stripeReceiptUrl`). Both Stripe IDs carry a `UNIQUE` constraint.
6. **`reviews`** — Tenant-authored property reviews with a rating (1–5 integer) and comment. Business logic in the service layer enforces that only tenants who completed a rental for the property may submit a review.

---

## 🚀 Key Features

### 🌐 Public Features

- Browse properties with advanced multi-criteria filtering, search terms, and pagination.
- View detailed property info with average ratings and tenant reviews.
- View property categories.

### 👤 Tenant Features

- Register/Login securely.
- Submit rental requests for properties.
- Process rental payments securely via Stripe Checkout.
- Track personal rental request history and payment transaction history.
- Submit reviews and ratings for completed rentals.

### 🏠 Landlord Features

- Create, update, and delete property listings.
- View rental requests submitted for owned properties.
- Approve or reject rental requests.

### 🛡️ Admin Features

- View and ban/unban user accounts.
- Monitor all listed properties and rental requests across the system.
- Inspect all payment transactions.

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/rentnest_db?schema=public"
PORT=5000
NODE_ENV=development

# JWT Authentication
JWT_ACCESS_SECRET="your_access_token_secret"
JWT_ACCESS_EXPIRES_IN="7d"
JWT_REFRESH_SECRET="your_refresh_token_secret"
JWT_REFRESH_EXPIRES_IN="30d"

# CORS & Application URL
APP_URL="http://localhost:3000"

# Stripe Payment Integration
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

---

## 💻 Installation & Setup

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/your-username/rentnest-backend.git
   cd rentnest-backend
   ```

2. **Install Dependencies**:

   ```bash
   npm install
   ```

3. **Prisma Setup & Migrations**:

   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```
   The server will start at `http://localhost:5000`.

---

## 📡 Complete API Reference (Organized by Route)

### 🔑 1. Authentication Routes (`/api/auth`)

| Method | Endpoint                  | Access Role                   | Description                                         |
| :----- | :------------------------ | :---------------------------- | :-------------------------------------------------- |
| `POST` | `/api/auth/register`      | Public                        | Registers a new user (`TENANT` or `LANDLORD`).      |
| `POST` | `/api/auth/login`         | Public                        | Authenticates user and returns JWT tokens.          |
| `POST` | `/api/auth/refresh-token` | Public                        | Generates a new access token using a refresh token. |
| `GET`  | `/api/auth/me`            | `TENANT`, `LANDLORD`, `ADMIN` | Fetches details of the currently logged-in user.    |

---

### 🏘️ 2. Property Routes (`/api/properties`)

| Method | Endpoint              | Access Role | Description                                                      |
| :----- | :-------------------- | :---------- | :--------------------------------------------------------------- |
| `GET`  | `/api/properties`     | Public      | Browses properties with multi-criteria filters & pagination.     |
| `GET`  | `/api/properties/:id` | Public      | Gets full property details including reviews and average rating. |

---

### 📑 3. Category Routes (`/api/categories`)

| Method | Endpoint          | Access Role | Description                                              |
| :----- | :---------------- | :---------- | :------------------------------------------------------- |
| `GET`  | `/api/categories` | Public      | Retrieves all property categories sorted alphabetically. |

---

### 👨‍🌾 4. Landlord Routes (`/api/landlord`)

| Method   | Endpoint                               | Access Role | Description                                              |
| :------- | :------------------------------------- | :---------- | :------------------------------------------------------- |
| `POST`   | `/api/landlord/properties`             | `LANDLORD`  | Creates a new property listing.                          |
| `PUT`    | `/api/landlord/properties/:propertyId` | `LANDLORD`  | Updates a property listing owned by the landlord.        |
| `DELETE` | `/api/landlord/properties/:propertyId` | `LANDLORD`  | Deletes a property listing owned by the landlord.        |
| `GET`    | `/api/landlord/requests`               | `LANDLORD`  | Retrieves all rental requests for landlord's properties. |
| `PATCH`  | `/api/landlord/requests/:rentalReqId`  | `LANDLORD`  | Approves or rejects a specific rental request.           |

---

### 📝 5. Rental Request Routes (`/api/rentals`)

| Method | Endpoint                    | Access Role       | Description                                                        |
| :----- | :-------------------------- | :---------------- | :----------------------------------------------------------------- |
| `POST` | `/api/rentals`              | `TENANT`          | Submits a new rental request for a property.                       |
| `GET`  | `/api/rentals`              | `TENANT`, `ADMIN` | Gets user's rental requests (`TENANT` sees own; `ADMIN` sees all). |
| `GET`  | `/api/rentals/:rentalReqId` | `TENANT`, `ADMIN` | Fetches details of a specific rental request.                      |

---

### 💳 6. Payment Routes (`/api/payments`)

| Method | Endpoint                | Access Role             | Description                                                                   |
| :----- | :---------------------- | :---------------------- | :---------------------------------------------------------------------------- |
| `POST` | `/api/payments/create`  | `TENANT`                | Generates a Stripe Checkout Session for an approved rental request.           |
| `POST` | `/api/payments/confirm` | Public (Stripe Webhook) | Verifies Stripe webhook event, updates payment, request, and property states. |
| `GET`  | `/api/payments`         | `TENANT`, `ADMIN`       | Gets payment transaction history (`TENANT` sees own; `ADMIN` sees all).       |
| `GET`  | `/api/payments/:id`     | `TENANT`, `ADMIN`       | Gets detailed information for a single payment transaction.                   |

---

### ⭐ 7. Review Routes (`/api/reviews`)

| Method | Endpoint       | Access Role | Description                                                                   |
| :----- | :------------- | :---------- | :---------------------------------------------------------------------------- |
| `POST` | `/api/reviews` | `TENANT`    | Submits a property review (allowed only if tenant completed a rental for it). |

---

### 👑 8. Admin Routes (`/api/admin`)

| Method  | Endpoint                | Access Role | Description                                       |
| :------ | :---------------------- | :---------- | :------------------------------------------------ |
| `GET`   | `/api/admin/users`      | `ADMIN`     | Retrieves all registered tenants and landlords.   |
| `PATCH` | `/api/admin/users/:id`  | `ADMIN`     | Updates user status (`ACTIVE` or `BLOCKED`).      |
| `GET`   | `/api/admin/properties` | `ADMIN`     | Monitors all listed properties across the system. |
| `GET`   | `/api/admin/rentals`    | `ADMIN`     | Oversees all rental requests platform-wide.       |

---

## 🔍 Deep-Dive: Key Service Procedures

### 1. `getAllProperties` in `property.service.ts`

The `getAllProperties` function handles complex, multi-criteria filtering and pagination.

- **Dynamic Query Building**: Extracts filters from query parameters (`location`, `minPrice`, `maxPrice`, `categoryId`, `searchTerm`, `amenities`, `bedroomCount`, `bathroomCount`, `availabilityStatus`).
- **Full-Text Search & Array Filtering**: Constructs case-insensitive partial match conditions (`mode: "insensitive"`) for search terms, and array containment filters (`hasSome`) for property amenities.
- **ACID Read Transaction**:
  To prevent data drift between property records and pagination counts during concurrent listing operations, `getAllProperties` wraps the data query and the total count query inside a single Prisma read transaction:
  ```ts
  const [data, total] = await prisma.$transaction([
    prisma.property.findMany({ where: whereConditions, skip, take: limitNum, ... }),
    prisma.property.count({ where: whereConditions }),
  ]);
  ```
  This guarantees strict ACID read isolation and ensures exact pagination metadata (`page`, `limit`, `total`).

---

### 2. `createCheckoutSession` in `payment.service.ts`

The `createCheckoutSession` procedure initiates an online payment for an approved rental request:

1. **Strict Validation & Authorization**:
   - Verifies that the rental request exists.
   - Ensures the request belongs to the authenticated Tenant.
   - Enforces that the request status is `APPROVED`.
   - Checks if a `COMPLETED` payment record already exists to prevent double payments.
2. **Stripe Checkout Session Generation**:
   - Converts the rent amount to cents (`Math.round(amount * 100)`).
   - Invokes `stripe.checkout.sessions.create()` with line items, product descriptions, customer email, redirect URLs (`success_url`, `cancel_url`), and metadata (`rentalRequestId`, `tenantId`).
3. **Atomic PENDING Record Upsert**:
   - Clears any previous stale `PENDING` payment entries for the request.
   - Creates a new `Payment` record with status `PENDING` and links the `stripeSessionId` inside a `prisma.$transaction` block.

--- 

### 3. `handleStripeWebhook` in `payment.service.ts` (Stripe Webhook Challenge & Execution Path)

#### ⚡ The Core Technical Challenge: Middleware Ordering

Integrating Stripe Webhooks into an Express application often fails with `Signature verification failed` errors because standard Express JSON body parsers (`express.json()`) modify the incoming request body buffer before Stripe can compute its HMAC-SHA256 signature.

**Solution Implemented in `app.ts`**:

```ts
// MUST run BEFORE express.json() so raw Buffer is preserved for signature verification
app.use("/api/payments/confirm", express.raw({ type: "application/json" }));
app.use(express.json());
```

#### 🛤️ Text-Based Flow / Path Diagram

```
[Stripe Gateway]
      │
      │ HTTP POST (Header: stripe-signature, Body: Raw JSON Buffer)
      ▼
[Express Server (app.ts)]
      │
      ├─► app.use('/api/payments/confirm', express.raw({ type: 'application/json' }))
      │   └── Preserves unparsed Raw Buffer in req.body
      │
      ▼
[Payment Controller / Service]
      │
      ├─► Step 1: Signature Verification
      │   └── stripe.webhooks.constructEvent(rawBody, stripeSignature, secret)
      │       ├── ❌ Invalid Signature ──► Throws Error (400/500 response)
      │       └── ✅ Valid Event        ──► Proceed to Event Processing
      │
      ├─► Step 2: Event Type Handling ('checkout.session.completed')
      │   └── Retrieve Payment Intent & Charge details via Stripe API:
      │       stripe.paymentIntents.retrieve(intentId, { expand: ['latest_charge'] })
      │       └── Extracts receipt URL and payment card brand
      │
      ▼
[Prisma ACID Transaction (prisma.$transaction)]
      │
      ├─── 1. Find & Update Payment Record:
      │       - match by stripeSessionId
      │       - set status = "COMPLETED"
      │       - set stripePaymentIntentId, stripeReceiptUrl, paymentMethod, paidAt
      │
      ├─── 2. Update RentalRequest Record:
      │       - set status = "COMPLETED"
      │
      └─── 3. Update Property Record:
              - set availabilityStatus = "RENTED"
```

This multi-model state update executes atomically in PostgreSQL. If any step fails, the entire transaction rolls back, preserving data integrity across payments, rental requests, and property availability.

---

## 🏗️ Project Structure

```
src/
├── app.ts                        # Express app setup, middleware, route mounting
├── server.ts                     # HTTP server bootstrap
├── config/                       # Environment variable config
├── lib/
│   ├── prisma.ts                 # PrismaClient singleton (with pg adapter)
│   └── stripe.ts                 # Stripe SDK singleton
├── middlewares/
│   ├── auth.ts                   # JWT verification & role-based guard
│   ├── globalErrorHandler.ts     # Centralized Prisma & Express error handler
│   └── notFound.ts               # 404 fallback handler
├── modules/
│   ├── auth/                     # register, login, refresh-token, /me
│   ├── property/                 # public GET properties (filter + pagination)
│   ├── category/                 # public GET categories
│   ├── landlord/                 # CRUD listings + approve/reject requests
│   ├── rentalreq/                # submit, list, detail rental requests
│   ├── payment/                  # Stripe checkout + webhook + history
│   ├── review/                   # submit post-rental reviews
│   └── admin/                    # user management + platform oversight
├── types/                        # Shared TypeScript type declarations
└── utils/
    ├── catchAsync.ts             # Async error wrapper for controllers
    └── sendResponse.ts           # Standardised JSON response helper
prisma/
└── schema/
    ├── schema.prisma             # Generator & datasource config
    ├── enums.prisma              # All shared enums
    ├── users.prisma
    ├── categories.prisma
    ├── properties.prisma
    ├── rental_requests.prisma
    ├── payments.prisma
    └── reviews.prisma
```

---

## 🛡️ Security & Middleware

| Concern                      | Implementation                                                                                              |
| :--------------------------- | :---------------------------------------------------------------------------------------------------------- |
| **Authentication**           | `Bearer` JWT via `Authorization` header or HTTP-only cookie                                                 |
| **Authorization**            | Role-based guard — `auth(Role.LANDLORD)` per route                                                          |
| **Stripe Webhook Integrity** | `express.raw()` mounted before `express.json()` preserves raw buffer for HMAC-SHA256 signature verification |
| **Double-Payment Guard**     | Service checks for existing `COMPLETED` payment before generating a new Stripe session                      |
| **Blocked User Guard**       | `auth` middleware queries the DB on every protected request to reject `BLOCKED` accounts                    |
| **Cascade Deletes**          | Deleting a landlord cascades to their properties, rental requests, and payments                             |
| **Restrict on Category**     | A category cannot be deleted while properties still reference it                                            |

---

## ⚡ ACID Transactions in Use

| Endpoint                               | Transaction Type       | Guarantee                                                                                                             |
| :------------------------------------- | :--------------------- | :-------------------------------------------------------------------------------------------------------------------- |
| `GET /api/properties`                  | Batch read transaction | `findMany` + `count` execute at the same DB snapshot — pagination metadata never drifts                               |
| `POST /api/payments/create`            | Write transaction      | Stale `PENDING` payment deleted and fresh one created atomically — no orphan rows                                     |
| `POST /api/payments/confirm` (webhook) | Write transaction      | Payment → `COMPLETED`, RentalRequest → `COMPLETED`, Property → `RENTED` are all committed together or all rolled back |

---
 