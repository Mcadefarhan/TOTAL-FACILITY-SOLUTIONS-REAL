# Total Facility Solutions — Full-Stack Platform

A production-ready staff management platform connecting job seekers with employers, managed by an admin team. Built with React, Node.js, MongoDB, JWT auth, and email OTP verification.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (Access + Refresh) + Email OTP |
| Email | Nodemailer (Gmail SMTP / SendGrid) |
| File Storage | Cloudinary |
| Frontend Deploy | Vercel |
| Backend Deploy | Render |
| DB Hosting | MongoDB Atlas |

---

## Project Structure

```
tfs/
├── backend/
│   ├── server.js              # Main server + middleware
│   ├── models/
│   │   ├── User.js            # User schema (seeker/employer/admin)
│   │   └── JobRequest.js      # Staff request schema
│   ├── routes/
│   │   ├── auth.js            # Auth (register, login, OTP, JWT refresh)
│   │   ├── seekers.js         # Job seeker profile + application
│   │   ├── employers.js       # Employer profile + job requests
│   │   ├── admin.js           # Admin management + analytics
│   │   └── upload.js          # Cloudinary avatar upload
│   ├── middleware/
│   │   ├── auth.js            # JWT verify + role guards
│   │   └── errorHandler.js    # Global error handler
│   └── utils/
│       ├── jwt.js             # Token generation + verification
│       ├── email.js           # Email templates + Nodemailer
│       └── seed.js            # Admin account seeder
│
└── frontend/
    └── src/
        ├── App.jsx            # Routes + guards
        ├── context/           # Auth state (useAuth)
        ├── utils/api.js       # Axios + auto token refresh
        ├── components/        # UI, Sidebar, DashboardLayout
        └── pages/
            ├── LandingPage.jsx
            ├── auth/          # Login, Register, OTP, Reset
            ├── seeker/        # Dashboard, Application, Profile, Notifications
            ├── employer/      # Dashboard, Requests, New Request, Profile
            └── admin/         # Overview, Seekers, Employers, Requests, Settings
```

---

## Quick Start (Local Development)

### 1. Clone and Install

```bash
git clone <your-repo-url> tfs
cd tfs

# Backend
cd backend
cp .env.example .env
npm install

# Frontend (new terminal)
cd ../frontend
cp .env.example .env
npm install
```

### 2. Configure Environment Variables

**Backend `.env`:**
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://...    # MongoDB Atlas connection string
JWT_SECRET=your_64_char_secret   # node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_REFRESH_SECRET=another_64_char_secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_16_char_app_password  # Google → Security → App Passwords
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLIENT_URL=http://localhost:3000
ADMIN_EMAIL=admin@totalfacility.com
ADMIN_PASSWORD=Admin@123456
```

**Frontend `.env`:**
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Run Development Servers

```bash
# Backend (port 5000)
cd backend && npm run dev

# Frontend (port 3000)  
cd frontend && npm run dev
```

### 4. First Login

After starting the server, an admin account is auto-created:
- **Email:** admin@totalfacility.com (or your ADMIN_EMAIL)
- **Password:** Admin@123456 (or your ADMIN_PASSWORD)

> ⚠️ Change the admin password immediately after first login.

---

## Deployment

### Backend → Render

1. Push code to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your GitHub repo, set root directory to `backend`
4. Build command: `npm install`
5. Start command: `node server.js`
6. Add all environment variables from `.env.example`
7. The `render.yaml` file in the root auto-configures the service

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → Import Project
2. Connect your GitHub repo, set root directory to `frontend`
3. Add environment variable: `VITE_API_URL=https://your-render-service.onrender.com/api`
4. Deploy!

### Database → MongoDB Atlas

1. Create free cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create database user with read/write access
3. Whitelist `0.0.0.0/0` (all IPs) for Render's dynamic IPs
4. Copy connection string to `MONGODB_URI`

### Email → Gmail SMTP

1. Enable 2-Step Verification on your Google account
2. Go to Google Account → Security → App Passwords
3. Generate password for "Mail" app
4. Use that 16-char password as `EMAIL_PASS`

### File Storage → Cloudinary

1. Create free account at [cloudinary.com](https://cloudinary.com)
2. Copy Cloud Name, API Key, API Secret from dashboard
3. Add to environment variables

---

## API Reference

### Authentication
```
POST /api/auth/register          Register (returns userId for OTP)
POST /api/auth/verify-otp        Verify email OTP
POST /api/auth/resend-otp        Resend OTP
POST /api/auth/login             Login (returns JWT tokens)
POST /api/auth/refresh           Refresh access token
POST /api/auth/logout            Logout (revoke refresh token)
POST /api/auth/forgot-password   Request password reset
POST /api/auth/reset-password    Reset password with token
GET  /api/auth/me                Get current user
```

### Job Seekers (auth required)
```
GET  /api/seekers/profile                Get seeker profile
PUT  /api/seekers/profile                Update seeker profile
POST /api/seekers/submit-application     Submit job application
GET  /api/seekers/my-status              Get application status
GET  /api/seekers/notifications          Get notifications
PATCH /api/seekers/mark-notifications-read  Mark all as read
```

### Employers (auth required)
```
GET  /api/employers/profile              Get employer profile
PUT  /api/employers/profile              Update employer profile
POST /api/employers/job-requests         Create staff request
GET  /api/employers/job-requests         List all requests
GET  /api/employers/job-requests/:id     Get single request
PATCH /api/employers/job-requests/:id/cancel  Cancel request
GET  /api/employers/dashboard-stats      Dashboard statistics
```

### Admin (admin auth required)
```
GET  /api/admin/overview                 Platform analytics
GET  /api/admin/seekers                  List all seekers (filterable)
GET  /api/admin/seekers/:id              Get seeker details
PATCH /api/admin/seekers/:id/status      Update application status
PATCH /api/admin/seekers/:id/suspend     Suspend/reactivate user
GET  /api/admin/employers                List all employers
PATCH /api/admin/employers/:id/verify    Verify employer
GET  /api/admin/job-requests             List all requests
PATCH /api/admin/job-requests/:id/status Update request status
POST /api/admin/job-requests/:id/match-seeker  Match a seeker
GET  /api/admin/seekers-for-matching     Get available seekers
POST /api/admin/broadcast-notification   Send to all users
```

### Upload
```
POST   /api/upload/avatar   Upload profile photo (multipart/form-data)
DELETE /api/upload/avatar   Remove profile photo
```

---

## Security Features

- **Bcrypt** password hashing (12 salt rounds)
- **JWT** access tokens (7d) + refresh tokens (30d) with rotation
- **Email OTP** verification (10min expiry, 5 attempt limit)
- **Rate limiting**: 20 auth attempts / 5 OTP requests per hour
- **Helmet** HTTP security headers
- **CORS** whitelist for specific origins
- **Input validation** with express-validator
- **Role-based access control** on all protected routes
- **Sensitive fields** excluded from queries (passwords, OTPs, Aadhaar)

---

## User Flows

### Job Seeker Flow
1. Register with email + password
2. Verify email via OTP (6-digit, 10min)
3. Complete profile form (skills, experience, address, etc.)
4. Submit application
5. Admin reviews → shortlists → places
6. Receive real-time notifications at each step

### Employer Flow
1. Register with email + password  
2. Verify email via OTP
3. Complete business profile
4. Submit staff request (type, count, salary, timing)
5. Admin reviews and matches candidates
6. View matched candidates' contact details

### Admin Flow
1. Login with pre-seeded admin credentials
2. Review new seeker applications → update status
3. Verify employer accounts
4. Review staff requests → process → match seekers
5. Broadcast notifications to users
6. View platform analytics (charts, stats)

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string |
| `JWT_SECRET` | ✅ | 64+ char random string for access tokens |
| `JWT_REFRESH_SECRET` | ✅ | Different 64+ char string for refresh tokens |
| `EMAIL_HOST` | ✅ | SMTP host (smtp.gmail.com) |
| `EMAIL_PORT` | ✅ | SMTP port (587) |
| `EMAIL_USER` | ✅ | Your Gmail address |
| `EMAIL_PASS` | ✅ | 16-char Gmail App Password |
| `CLIENT_URL` | ✅ | Your Vercel frontend URL |
| `CLOUDINARY_CLOUD_NAME` | ⚠️ | Required for avatar uploads |
| `CLOUDINARY_API_KEY` | ⚠️ | Required for avatar uploads |
| `CLOUDINARY_API_SECRET` | ⚠️ | Required for avatar uploads |
| `ADMIN_EMAIL` | ✅ | Admin account email |
| `ADMIN_PASSWORD` | ✅ | Admin account password (change after first login!) |

---

## License

© 2026 Total Facility Solutions. All rights reserved.
