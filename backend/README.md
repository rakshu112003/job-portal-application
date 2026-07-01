# 🚀 Job Portal Backend

This is the backend for the Job Portal Application built using Node.js, Express.js, MongoDB Atlas, and JWT Authentication. It provides REST APIs for managing job listings and user authentication.

## 🌐 Live Backend

https://job-portal-application-5-tc2n.onrender.com

## 📌 API Endpoints

### Health Check
GET /
Returns:
```
Backend is alive 🚀
```

### Get All Jobs
GET /api/jobs

Example:
```
https://job-portal-application-5-tc2n.onrender.com/api/jobs
```

## 🛠️ Tech Stack

- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- JWT Authentication
- Render

## ⚙️ Installation

```bash
git clone https://github.com/rakshu112003/job-portal-application.git
cd job-portal-application/backend
npm install
```

## ▶️ Run Locally

```bash
npm start
```

Server runs on:

```
http://localhost:5000
```

## 🔐 Environment Variables

Create a `.env` file:

```env
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_secret_key
PORT=5000
```

## 🚀 Deployment

- **Backend:** Render
- **Database:** MongoDB Atlas

## 👨‍💻 Developer

**Rakshith Gowda**
