# 🚀 Blog API Backend

A fully functional backend API built using **Node.js, Express, and MongoDB**.
This project demonstrates real-world backend development including CRUD operations, relationships, filtering, pagination, and structured architecture.

---

## 📌 Features

* ✅ User, Post, and Comment APIs
* ✅ Full CRUD Operations
* ✅ MongoDB Relationships (User ↔ Post ↔ Comment)
* ✅ Populate (Reference Data Fetching)
* ✅ Filtering, Sorting & Pagination
* ✅ Centralized Error Handling
* ✅ Async Error Handling (asyncHandler)
* ✅ Clean MVC Architecture

---

## 🛠 Tech Stack

* **Node.js**
* **Express.js**
* **MongoDB**
* **Mongoose**

---

## 📂 Project Structure

```
src/
├── controllers/
├── models/
├── routes/
├── config/
└── app.js

server.js
```

---

## 🔗 API Endpoints

### 👤 Users

```
POST    /api/users
GET     /api/users
GET     /api/users/:id
PATCH   /api/users/:id
DELETE  /api/users/:id
```

### 📝 Posts

```
POST    /api/posts
GET     /api/posts
GET     /api/posts/:id
PATCH   /api/posts/:id
DELETE  /api/posts/:id
```

### 💬 Comments

```
POST    /api/comments
GET     /api/comments
GET     /api/comments/:id
PATCH   /api/comments/:id
DELETE  /api/comments/:id
```

---

## ⚙️ Query Features

### Filtering

```
/api/posts?title=example
/api/comments?postId=POST_ID
```

### Sorting

```
/api/posts?sort=-createdAt
```

### Pagination

```
/api/posts?page=1&limit=5
```

---

## 🚀 Run Locally

### 1️⃣ Install dependencies

```
npm install
```

### 2️⃣ Create .env file

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
NODE_ENV=development
```

### 3️⃣ Run server

```
npm run dev
```

---

## 🧠 Learning Outcomes

* Built scalable backend architecture
* Implemented RESTful APIs
* Managed relationships using MongoDB
* Applied error handling best practices
* Understood real-world API flow

---

## 🔮 Future Improvements

* 🔐 JWT Authentication
* 👥 Role-based Access Control
* 📁 File Uploads
* 🚀 Deployment (Render / Railway)

---

## 👨‍💻 Author

Ishant Singh 🚀
