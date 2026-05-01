<div align="center">

# ⚡ DevForces — Backend API

<img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" />
<img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" />
<img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
<img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
<img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" />
<img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" />
<img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
<img src="https://img.shields.io/badge/BullMQ-EF4444?style=for-the-badge&logo=redis&logoColor=white" />
<img src="https://img.shields.io/badge/WebSocket-010101?style=for-the-badge&logo=socketdotio&logoColor=white" />
<img src="https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white" />

> 🚀 **The powerhouse REST API & WebSocket server** for the DevForces competitive programming platform — featuring secure sandboxed code execution, real-time messaging, AI-powered code review, contest management, and a full leaderboard engine.

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [API Routes](#-api-routes)
- [WebSocket Server](#-websocket-server)
- [Queue & Worker System](#-queue--worker-system)
- [Environment Variables](#-environment-variables)
- [Getting Started](#-getting-started)
- [Scripts](#-scripts)

---

## 🌟 Overview

The DevForces backend is a **TypeScript-first Express.js REST API** that powers the entire competitive programming platform. It handles:

- 🔐 JWT-based user authentication with OTP email verification
- 🧑‍💻 Sandboxed code execution via **Docker containers**
- 📬 Async job processing with **BullMQ + Redis queues**
- 📡 Real-time chat over **WebSocket (ws)**
- 🤖 AI-powered code review and hints with **Google Gemini** & **Groq**
- 🏆 Contest management with live leaderboards
- ☁️ Image uploads to **Cloudinary**
- 🛡️ Role-based access control (User / Admin)

---

## ✨ Features

| Feature | Details |
|---|---|
| 🔐 **Authentication** | Register, Login, JWT tokens, OTP verification, Forgot/Reset Password |
| 🧑‍💻 **Code Execution** | Multi-language (Node.js, Python, Java) in isolated Docker containers |
| 📬 **Job Queue** | BullMQ + Redis for async submission processing |
| 📡 **Real-time Chat** | WebSocket server with Redis Pub/Sub for scalable broadcasting |
| 🤖 **AI Integration** | Gemini + Groq API for code hints, review, and scoring |
| 🏆 **Contests** | Create, register, submit, and live contest leaderboards |
| 📊 **Leaderboard** | Global ranking by problem-solving points |
| 🛡️ **Admin Panel** | Full CRUD for problems, contests, and user management |
| ☁️ **File Uploads** | Avatar/image uploads via Cloudinary + Multer |
| 📧 **Email Service** | Nodemailer for OTP and password reset emails |

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js |
| **Framework** | Express.js v5 |
| **Language** | TypeScript |
| **Database** | PostgreSQL (via Neon) |
| **ORM** | Prisma v7 |
| **Cache / Queue Broker** | Redis (ioredis) |
| **Job Queue** | BullMQ |
| **Code Sandbox** | Docker (via Dockerode) |
| **WebSocket** | ws |
| **AI** | Google Gemini API, Groq API |
| **Auth** | JSON Web Tokens (JWT), bcrypt |
| **Email** | Nodemailer |
| **Media Storage** | Cloudinary |
| **Validation** | Zod |

---

## 📂 Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma          # Database models & enums
│   └── migrations/            # SQL migration history
├── src/
│   ├── index.ts               # Express app entry point, route registration
│   ├── config/
│   │   └── prisma.ts          # Prisma client singleton
│   ├── controllers/
│   │   ├── user.controller.ts         # Auth: register, login, profile
│   │   ├── problem.controller.ts      # Fetch problems, hints
│   │   ├── submission.controller.ts   # Code run & submit
│   │   ├── contest.controller.ts      # Contest registration & submissions
│   │   ├── ai.controller.ts           # Gemini AI chat endpoints
│   │   ├── leaderboard.controller.ts  # Global leaderboard
│   │   ├── forgotPassword.controller.ts
│   │   ├── resetPassword.controller.ts
│   │   ├── hint.controller.ts         # AI problem hints
│   │   └── admin/                     # Admin-only controllers
│   ├── routes/
│   │   ├── user.route.ts              # /api/user (auth)
│   │   ├── problem.route.ts           # /api/user/problems
│   │   ├── submission.route.ts        # /api/user/submissions
│   │   ├── contest.route.ts           # /api/user/contests
│   │   ├── ai.route.ts                # /api/user/ai
│   │   ├── leaderboard.route.ts       # /api/user/leaderboard
│   │   ├── admin.problem.route.ts     # /api/admin/problems
│   │   ├── admin.contest.route.ts     # /api/admin/contests
│   │   └── adminprofile.route.ts      # /api/admin/profile
│   ├── middlewares/
│   │   ├── auth.ts            # JWT verification middleware
│   │   ├── admin.ts           # Admin role guard
│   │   ├── user.ts            # User role guard
│   │   ├── upload.ts          # Multer + Cloudinary config
│   │   └── validate.ts        # Zod request validation
│   ├── queues/
│   │   └── submission.queue.ts       # BullMQ queue definition
│   ├── workers/
│   │   ├── submission.worker.ts      # Processes queued submissions
│   │   └── constants/               # Worker configuration constants
│   ├── utils/
│   │   ├── runDocker.ts       # Docker container execution logic
│   │   ├── ai.ts              # Gemini/Groq AI utility wrappers
│   │   ├── cloudinaryUpload.ts
│   │   └── normalizeScore.ts
│   ├── validations/           # Zod schemas for request bodies
│   ├── types/                 # TypeScript type definitions
│   ├── constants/             # App-wide constants
│   ├── sandbox/               # Sandbox configuration
│   ├── test-engines/          # Code test engine helpers
│   ├── ai/                    # AI prompt templates & helpers
│   ├── generated/
│   │   └── prisma/            # Auto-generated Prisma client
│   └── ws/
│       └── ws.server.ts       # Standalone WebSocket server
├── index.js                   # Production entry point
├── package.json
├── tsconfig.json
└── .env
```

---

## 🗄 Database Schema

The database is **PostgreSQL** managed by **Prisma ORM**. Below is an overview of all models:

```
┌──────────────────────────────────────────────────────────┐
│                        USER                              │
│  id · name · email · password · points · role           │
│  avatar · bio · resetToken · resetTokenExpires          │
└───────────┬──────────────────────────────────────────────┘
            │ has many
    ┌───────┴────────┐  ┌──────────────┐  ┌──────────────┐
    │   Submission   │  │   Activity   │  │  ChatMessage │
    │ code·language  │  │ date · count │  │   message    │
    │ status·score   │  └──────────────┘  └──────────────┘
    └────────────────┘
            │ for
    ┌───────┴────────┐
    │    Problem     │
    │ title·desc     │
    │ difficulty     │
    │ type · points  │
    └───────┬────────┘
            │ part of
    ┌───────┴────────┐
    │    Contest     │
    │ title · type   │
    │ startTime      │
    │ endTime·status │
    └───────┬────────┘
            │ has
  ┌─────────┴──────────────────┐
  │  ContestRegistration       │
  │  ContestSubmission         │
  │  ContestProblem            │
  └────────────────────────────┘
```

**Enums defined:**

| Enum | Values |
|---|---|
| `ProblemType` | AUTH_SECURITY, API_BACKEND, BOT_AUTOMATION, APP_BACKEND, SYSTEM_DESIGN |
| `Language` | node, python, java |
| `Role` | USER, ADMIN |
| `Difficulty` | EASY, MEDIUM, HARD |
| `Status` | PENDING, RUNNING, ACCEPTED, WRONG_ANSWER, RUNTIME_ERROR, TIME_LIMIT, COMPILATION_ERROR |
| `ContestType` | WEEKLY, BIWEEKLY, MONTHLY |
| `ContestStatus` | UPCOMING, LIVE, COMPLETED |

---

## 🌐 API Routes

### User / Auth — `/api/user`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/user/register` | Register a new user | ❌ |
| `POST` | `/api/user/login` | Login, returns JWT | ❌ |
| `GET` | `/api/user/profile` | Get current user profile | ✅ |
| `PUT` | `/api/user/profile` | Update profile & avatar | ✅ |
| `POST` | `/api/user/forgot-password` | Send OTP via email | ❌ |
| `POST` | `/api/user/reset-password` | Reset password with OTP | ❌ |

### Problems — `/api/user`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/user/problems` | List all problems | ✅ |
| `GET` | `/api/user/problems/:id` | Get single problem details | ✅ |
| `POST` | `/api/user/problems/:id/hints` | Get AI-generated hints | ✅ |

### Submissions — `/api/user`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/user/submit` | Submit code (queued, async) | ✅ |
| `GET` | `/api/user/submissions/:problemId` | Get past submissions | ✅ |

### Contests — `/api/user`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/user/contests` | List all contests | ✅ |
| `GET` | `/api/user/contests/:id` | Get contest details | ✅ |
| `POST` | `/api/user/contests/:id/register` | Register for a contest | ✅ |
| `POST` | `/api/user/contests/:id/submit` | Submit for contest | ✅ |

### AI Chat — `/api/user`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/user/ai/chat` | General AI chat | ✅ |
| `POST` | `/api/user/ai/problem-chat` | Problem-specific AI chat | ✅ |

### Leaderboard — `/api/user`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/user/leaderboard` | Global leaderboard by points | ✅ |

### Admin — `/api/admin`

| Method | Endpoint | Description | Role |
|---|---|---|---|
| `GET` | `/api/admin/profile` | Admin profile & stats | 🛡 ADMIN |
| `POST` | `/api/admin/problems` | Create a new problem | 🛡 ADMIN |
| `PUT` | `/api/admin/problems/:id` | Update a problem | 🛡 ADMIN |
| `DELETE` | `/api/admin/problems/:id` | Delete a problem | 🛡 ADMIN |
| `POST` | `/api/admin/contests` | Create a contest | 🛡 ADMIN |
| `PUT` | `/api/admin/contests/:id` | Update a contest | 🛡 ADMIN |
| `DELETE` | `/api/admin/contests/:id` | Delete a contest | 🛡 ADMIN |

---

## 📡 WebSocket Server

A **standalone WebSocket server** runs on port `8080` (configurable via `WS_PORT`) separate from the REST API.

**Architecture:**

```
Client ──ws://──► WebSocket Server (port 8080)
                        │
                        ├── Redis SUB ◄── listens on "chat" channel
                        └── Redis PUB ──► broadcasts to all connected clients
                        │
                        └── Prisma ──► PostgreSQL (message persistence)
```

**Message Types:**

| Type | Direction | Description |
|---|---|---|
| `history` | Server → Client | Last 50 chat messages on connect |
| `send` | Client → Server | Send a new chat message |
| `edit` | Client → Server | Edit own message |
| `delete` | Client → Server | Delete own message |

Messages are **persisted to PostgreSQL** and **broadcast via Redis Pub/Sub**, making the chat horizontally scalable.

---

## 📬 Queue & Worker System

Code submissions are processed **asynchronously** using **BullMQ + Redis**:

```
POST /api/user/submit
        │
        ▼
  submission.queue  ──► BullMQ Job added to Redis
        │
        ▼
  submission.worker  ──► Picks up job
        │
        ├── Pulls Docker image for language (node/python/java)
        ├── Runs code in isolated container (runDocker.ts)
        ├── Compares output against test cases
        ├── Sends code to Gemini/Groq for AI review & scoring
        └── Updates submission record in PostgreSQL
```

This ensures the API stays responsive and code execution is **isolated and safe**.

---

## ⚙️ Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

```env
# ─── Database ───────────────────────────────────────────────
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require

# ─── Server ─────────────────────────────────────────────────
PORT=4000
FRONTEND_URL=http://localhost:3000

# ─── Auth ───────────────────────────────────────────────────
JWT_SECRET=your_super_secret_jwt_key

# ─── Email (Nodemailer) ─────────────────────────────────────
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password

# ─── Cloudinary ─────────────────────────────────────────────
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# ─── Redis ──────────────────────────────────────────────────
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# ─── WebSocket ──────────────────────────────────────────────
WS_PORT=8080

# ─── AI Keys ────────────────────────────────────────────────
GEMINI_API_KEY=your_google_gemini_api_key
GROQ_API_KEY=your_groq_api_key
```

> ⚠️ **Never commit your `.env` file to version control!**

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- **Node.js** v18+
- **npm** v9+
- **Docker** (Desktop or Engine — for code sandbox)
- **Redis** (running on localhost:6379 or via Docker)
- **PostgreSQL** (or a Neon cloud instance)

### Installation

```bash
# 1. Navigate to backend
cd backend

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Fill in all values in .env

# 4. Generate Prisma client & push schema
npx prisma generate
npx prisma migrate deploy

# 5. (Optional) Seed an admin user
npx ts-node seed_admin.ts
```

### Running in Development

```bash
# Start the REST API (with hot reload)
npm run dev

# Start the WebSocket server (separate terminal)
npm run ws
```

### Running in Production

```bash
# Build TypeScript
npm run build

# Start REST API
npm start

# Start WebSocket server (separate process)
node dist/ws/ws.server.js
```

---

## 📜 Scripts

| Script | Command | Description |
|---|---|---|
| `dev` | `ts-node-dev --respawn src/index.ts` | Development server with hot reload |
| `build` | `prisma generate && tsc` | Compile TypeScript to `dist/` |
| `start` | `node dist/index.js` | Run compiled production server |
| `worker` | `ts-node src/workers/submission.worker.ts` | Run BullMQ submission worker |
| `ws` | `ts-node src/ws/ws.server.ts` | Run WebSocket server |

---

<div align="center">

**Built with ❤️ for competitive programmers**

</div>
