# 🎓 Placement Portal

A full-stack placement management system connecting **students**, **companies**, and **admins** — built with a Flask REST API, a Vue.js frontend, and Celery + Redis for background job processing (async resume exports, scheduled email reminders, and reports).

---

## ✨ Features

### 👨‍🎓 Student
- 🔍 Browse and search active placement drives
- 📝 Apply to drives and track application status
- 📄 Upload resume, manage profile
- 📊 Export application history as CSV (processed asynchronously via Celery)

### 🏢 Company
- ➕ Create and manage placement drives
- 📋 View and review applications per drive
- ✅ Update application status, schedule interviews
- 🔒 Close drives once hiring is complete

### 🛡️ Admin
- 📈 Dashboard overview of all activity
- 🏢 Approve / blacklist companies
- 🎓 Manage and blacklist students
- 🔎 Search across students, companies, and drives
- 📬 Automated email reminders and monthly reports (via Celery Beat)

---

## 🛠️ Tech Stack

| Layer          | Technology                              |
|----------------|------------------------------------------|
| Backend        | Flask, Flask-SQLAlchemy, Flask-Login     |
| Frontend       | Vue.js                                   |
| Database       | SQLite                                   |
| Background Jobs| Celery + Redis (async tasks + scheduled beat jobs) |
| Auth           | Flask-Login, hashed passwords (Werkzeug) |
| Email          | Flask-Mail (SMTP via Gmail)              |

---

## 📁 Project Structure

```
Placement-Portal-Application-V2/
├── backend/
│   ├── app/
│   │   ├── admin.py        # Admin routes
│   │   ├── student.py      # Student routes
│   │   ├── company.py      # Company routes
│   │   ├── auth.py         # Register/login routes
│   │   ├── models.py       # Database models
│   │   ├── tasks.py        # Celery tasks + beat schedule
│   │   └── cache.py        # Redis caching helpers
│   ├── config.py           # App configuration (env-based)
│   ├── run.py               # App entry point
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── components/     # Login, Register, dashboards
│       └── router.js
└── Project Report MAD-2.pdf
```

---

## 🚀 Getting Started (Local Setup)

### Prerequisites
- Python 3.10+
- Node.js & npm
- Redis (running locally on port 6379)

### 1️⃣ Clone the repo
```bash
git clone https://github.com/anay-repo/placement-portal.git
cd placement-portal
```

### 2️⃣ Backend setup
```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in `backend/` (use `.env.example` as a template) and fill in:
```
SECRET_KEY=your-secret-key
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-gmail-app-password
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=set-your-own-password
FRONTEND_ORIGIN=http://localhost:8080
```

Start Redis locally, then run the backend:
```bash
python run.py
```

In separate terminals, start the Celery worker and beat scheduler:
```bash
celery -A app.tasks.celery_app worker --loglevel=info
celery -A app.tasks.celery_app beat --loglevel=info
```

### 3️⃣ Frontend setup
```bash
cd frontend
npm install
npm run serve
```

The app should now be running at `http://localhost:8080` 🎉

---

## 🔑 Default Admin Login

On first run, a default admin account is created using the `ADMIN_EMAIL` / `ADMIN_PASSWORD` values from your `.env` file — set these to something real before running.

---

## 📌 Notes

- This project was built as part of the **MAD-2 (Modern Application Development II)** course project.
- See `Project Report MAD-2.pdf` for architecture details and design decisions.

---

## 📬 Contact

Built by **Anay** — feel free to reach out on (https://www.linkedin.com/in/anay-singh-6a21402a8) or open an issue if you spot something!
