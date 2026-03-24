🚀 Blog API Backend

A fully functional backend API built using Node.js, Express, and MongoDB.
This project demonstrates CRUD operations, filtering, sorting, pagination, and proper backend architecture.

⸻

📌 Features
	•	Create, Read, Update, Delete (CRUD) operations for Posts
	•	Advanced Filtering, Sorting & Pagination
	•	MongoDB Integration with Mongoose
	•	MVC Architecture (Models, Controllers, Routes)
	•	Centralized Error Handling
	•	Async Error Handling (asyncHandler)
	•	Environment Configuration using .env

⸻

🛠 Tech Stack
	•	Node.js
	•	Express.js
	•	MongoDB
	•	Mongoose
	•	Nodemon

 📂 Project Structure
  project-root/
│
├── src/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── config/
│   └── app.js
│
├── server.js
├── .env
├── .gitignore
├── package.json
└── README.md

📌 API Endpoints
POST    /api/posts
GET     /api/posts
GET     /api/posts/:id
PATCH   /api/posts/:id
DELETE  /api/posts/:id

📌 Query Examples
GET /api/posts?sort=-createdAt
GET /api/posts?page=1&limit=5
GET /api/posts?title=example
