💼 Job Portal Application

A full-stack MERN Job Portal application that enables users to manage job listings with complete CRUD functionality, search and filter jobs, view analytics, export data, and save favorite jobs.

🚀 Live Demo

- Frontend: https://job-portal-application-hnk8-phi.vercel.app/
- Backend API: https://job-portal-application-5-tc2n.onrender.com

📌 Features

Job Management

- Add new jobs
- Update existing jobs
- Delete jobs
- View all job listings

Search & Filter

- Search by job title
- Search by company
- Filter by city
- Sort by newest
- Sort by salary (High → Low)
- Sort by salary (Low → High)
- Sort alphabetically

User Features

- Save/Favorite jobs
- Apply button
- Pagination
- Responsive design

Dashboard

- Total jobs
- Total companies
- Total cities
- Saved jobs count
- Highest salary
- Average salary
- Jobs by city chart
- Jobs by company chart
- City distribution pie chart

Additional Features

- Form validation
- Loading spinner
- Toast notifications
- CSV Export
- Local Storage support

🛠️ Tech Stack

Frontend

- React
- Axios
- Recharts
- React CSV
- CSS

Backend

- Node.js
- Express.js
- MongoDB
- Mongoose

Deployment

- Frontend: Vercel
- Backend: Render

📁 Project Structure

job-portal-application/
│
├── frontend/
│   ├── public/
│   ├── src/
│   └── package.json
│
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── server.js
│   └── package.json
│
└── README.md

⚙️ Installation

Clone Repository

git clone https://github.com/rakshu112003/job-portal-application.git

Install Backend

cd backend
npm install
npm start

Install Frontend

cd frontend
npm install
npm start

🌐 API Endpoint

GET    /api/jobs
POST   /api/jobs
PUT    /api/jobs/:id
DELETE /api/jobs/:id

🎯 Future Improvements

- User Authentication (JWT)
- Recruiter & Candidate Login
- Apply with Resume Upload
- Email Notifications
- Admin Dashboard
- Dark Mode
- Advanced Filters

👨‍💻 Developer

Rakshu Gowda

Built as a MERN Stack portfolio project to demonstrate full-stack development skills, REST API integration, CRUD operations, analytics, and responsive UI design.
