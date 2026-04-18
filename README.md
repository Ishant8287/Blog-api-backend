# Blog API

A production-ready REST API for a blogging platform built with Node.js, Express, and MongoDB. Features complete auth lifecycle, role-based access control, content management, and input validation across all routes.

---

## Live API

⚙️ **Backend (Render)** → https://blog-api-backend-1-cdcp.onrender.com

📦 **GitHub** → https://github.com/Ishant8287/Blog-api-backend

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js + Express v5 |
| Database | MongoDB + Mongoose |
| Auth | JWT (access + refresh tokens) |
| Password Hashing | bcryptjs |
| Validation | Joi |
| Security | Helmet, CORS, express-rate-limit |
| Dev Server | nodemon |

---

## Features

- JWT auth with access + refresh token flow
- Role-based access control — user / admin
- Full CRUD for Posts, Comments, Users
- Like / Unlike toggle on posts
- Ownership checks — users can only modify their own content
- Joi validation on every route — body and params
- Filtering, sorting, and pagination on list endpoints
- Centralized error handling — CastError, ValidationError, JWT errors, duplicates
- Rate limiting — 100 req/15min globally, 5 req/15min on login
- Helmet security headers + CORS

---

## Project Structure

```
src/
├── controllers/
│   ├── authController.js
│   ├── postController.js
│   ├── commentController.js
│   ├── userController.js
│   └── likeController.js
├── middleware/
│   ├── authMiddleware.js
│   └── validate.js
├── models/
│   ├── User.js
│   ├── Post.js
│   └── Comment.js
├── routes/
│   ├── authRoutes.js
│   ├── postRoutes.js
│   ├── commentRoutes.js
│   └── userRoutes.js
├── validations/
│   ├── userValidation.js
│   ├── postValidation.js
│   ├── commentValidation.js
│   └── commonValidation.js
├── utils/
│   ├── AppError.js
│   └── asyncHandler.js
└── config/
    └── db.js

server.js
```

---

## API Reference

### Auth — `/api/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/signup` | Public | Register new user |
| POST | `/login` | Public | Login, returns access + refresh token |
| POST | `/refresh-token` | Public | Get new access token |
| POST | `/logout` | Public | Invalidate refresh token |

### Posts — `/api/posts`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | Public | Get all posts (filter, sort, paginate) |
| GET | `/:id` | Public | Get single post |
| POST | `/` | User | Create post |
| PATCH | `/:id` | Owner / Admin | Update post |
| DELETE | `/:id` | Owner / Admin | Delete post |
| POST | `/:id/like` | User | Toggle like |

### Comments — `/api`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/posts/:id/comments` | Public | Get all comments on a post |
| POST | `/posts/:id/comments` | User | Add comment to post |
| GET | `/comments/:id` | Public | Get single comment |
| PATCH | `/comments/:id` | Owner / Admin | Update comment |
| DELETE | `/comments/:id` | Owner / Admin | Delete comment |

### Users — `/api/users`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | Admin | Get all users |
| POST | `/` | Admin | Create user |
| GET | `/:id` | Owner / Admin | Get user |
| PATCH | `/:id` | Owner / Admin | Update user |
| DELETE | `/:id` | Admin | Delete user |

---

## Query Parameters

```
# Filtering
GET /api/posts?title=javascript

# Sorting (prefix - for descending)
GET /api/posts?sort=-createdAt

# Pagination
GET /api/posts?page=1&limit=10

# Combined
GET /api/posts?sort=-createdAt&page=1&limit=5
```

---

## Auth Flow

**Login** → returns `accessToken` (15min) + `refreshToken` (7d)

**Protected routes** → send `Authorization: Bearer <accessToken>`

**Token expired** → call `/refresh-token` with `{ refreshToken }` → get new access token

**Logout** → send `{ refreshToken }` → token invalidated in DB

---

## Getting Started

```bash
git clone https://github.com/Ishant8287/Blog-api-backend.git
cd Blog-api-backend
npm install
```

Create `.env`:

```env
PORT=5000
MONGO_URI=your_mongodb_uri
NODE_ENV=development
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
```

```bash
npm run dev
```

---

## License

ISC
