# Attendance Dashboard with Analytics Analysis

AttendIQ is a full-stack attendance intelligence dashboard for colleges, schools, and training teams. It does more than record attendance: it highlights risky attendance patterns, compares departments, and recommends practical follow-up actions before students fall too far behind.

## What Makes It Stand Out

- Real-time-ready dashboard with live refresh and same-day attendance marking.
- AI-style risk scoring based on attendance rate, absence streaks, late marks, and recent trend drops.
- Department health analytics for quickly finding weak cohorts.
- Action brief that turns raw attendance data into advisor-ready interventions.
- Works with MongoDB when configured, and automatically falls back to realistic demo data when no database is available.

## Tech Stack

- Frontend: HTML, CSS, JavaScript, Canvas charts
- Backend: Node.js, Express
- Database: MongoDB with Mongoose, plus in-memory demo fallback

## Run Locally

```bash
cd server
npm install
npm start
```

Open:

```text
http://localhost:5000
```

Optional MongoDB setup:

```text
MONGO_URI=your_mongodb_connection_string
PORT=5000
```

## Main API

- `GET /api/health`
- `GET /api/students`
- `POST /api/students`
- `PATCH /api/students/:id/attendance`
- `GET /api/students/analytics/overview`
- `POST /api/students/demo/reset`

## Real-World Problem Solved

Institutions often discover attendance issues after students have already missed too many classes. This dashboard helps staff act earlier by showing who is at risk, where attendance is dropping, and what action should happen next.
