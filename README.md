# DevHayat

> A modern project management platform for software development teams.

DevHayat is a full-stack project management web application designed for managing software projects, tasks, issues, sprints, team members, and project progress in one centralized platform.

The project was built as a practical full-stack application with authentication, role-based access control, REST API routes, PostgreSQL database integration, and a modern responsive interface.

---

## ✨ Features

### 🔐 Authentication & Authorization

* User registration and login
* Secure password hashing with bcrypt
* Session-based authentication
* Logout functionality
* Authentication middleware
* Role-based access control
* Admin and project manager permissions

### 👥 Team Management

* View project members
* Add members to projects
* Remove project members
* User roles
* Member information
* Project membership management

### 📁 Project Management

* Create projects
* View project details
* Update project information
* Delete projects
* Project status management
* Project progress tracking
* Project owners
* Project members

### 🐛 Issue Management

* Create issues
* Update issues
* Delete issues
* Issue types:

  * Task
  * Bug
  * Story
* Issue priorities:

  * Low
  * Medium
  * High
  * Critical
* Issue status tracking
* Issue assignment
* Issue reporting

### ✅ Task Management

* Create tasks
* Update tasks
* Delete tasks
* Assign tasks to users
* Task priorities
* Task status tracking
* Due dates
* Sprint assignment

### 🏃 Sprint Management

* Create sprints
* Update sprints
* Delete sprints
* Sprint goals
* Sprint status
* Start and end dates
* Sprint task management

### 📊 Dashboard & Reports

* Project statistics
* Task statistics
* Issue statistics
* Team member statistics
* Project progress
* Reports and analytics

### ⚙️ Settings

* Account settings
* User information
* Password management
* Role information

---

## 🛠️ Tech Stack

### Frontend

* Next.js 16
* React 19
* TypeScript
* Tailwind CSS
* Lucide React

### Backend

* Next.js App Router
* Next.js API Routes
* TypeScript
* Prisma ORM

### Database

* PostgreSQL
* Neon PostgreSQL
* Prisma Migrations

### Authentication

* Session-based authentication
* HTTP cookies
* bcrypt password hashing

### Development

* Git
* GitHub
* GitHub Codespaces
* npm
* Prisma CLI

---

## 🏗️ Architecture

```text
DevHayat
│
├── Frontend
│   ├── Dashboard
│   ├── Projects
│   ├── Issues
│   ├── Tasks
│   ├── Sprints
│   ├── Team
│   ├── Reports
│   └── Settings
│
├── Backend
│   ├── Authentication API
│   ├── Project API
│   ├── Issue API
│   ├── Task API
│   ├── Sprint API
│   └── User API
│
├── Database
│   ├── PostgreSQL
│   ├── Prisma ORM
│   └── Prisma Migrations
│
└── Authentication
    ├── Sessions
    ├── Cookies
    ├── Password Hashing
    └── Role-Based Access Control
```

---

## 📂 Project Structure

```text
DevHayat/
│
├── prisma/
│   ├── migrations/
│   └── schema.prisma
│
├── public/
│
├── scripts/
│   └── create-admin.ts
│
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── issues/
│   │   │   ├── projects/
│   │   │   ├── sprints/
│   │   │   ├── tasks/
│   │   │   └── users/
│   │   │
│   │   ├── issues/
│   │   ├── login/
│   │   ├── projects/
│   │   ├── register/
│   │   ├── reports/
│   │   ├── settings/
│   │   ├── sprints/
│   │   ├── tasks/
│   │   └── team/
│   │
│   ├── components/
│   ├── generated/
│   └── lib/
│       ├── auth.ts
│       └── db.ts
│
├── .env
├── .gitignore
├── package.json
├── prisma.config.ts
├── next.config.ts
└── README.md
```

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/parham0541/DevHayat.git
cd DevHayat
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file:

```env
DATABASE_URL="your_postgresql_connection_string"
```

For local development, you can use a PostgreSQL database.

For cloud development, DevHayat can use Neon PostgreSQL.

> Never commit `.env` or database credentials to GitHub.

---

## 🗄️ Database Setup

DevHayat uses Prisma ORM with PostgreSQL.

After configuring `DATABASE_URL`, run:

```bash
npx prisma migrate deploy
```

This applies all existing database migrations.

To inspect the database during development:

```bash
npx prisma studio
```

---

## 👑 Create an Admin Account

DevHayat includes an admin creation script.

Configure the following variables in `.env`:

```env
ADMIN_NAME="Dev Admin"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="your-secure-password"
```

Then run:

```bash
npx tsx scripts/create-admin.ts
```

The script will:

* Create the admin account if it doesn't exist
* Update an existing account if it already exists
* Set the user's role to `ADMIN`
* Hash the password securely using bcrypt

---

## ▶️ Run Development Server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## 🏭 Production Build

Create an optimized production build:

```bash
npm run build
```

Run the production server:

```bash
npm run start
```

For Codespaces or remote environments:

```bash
npm run start -- --hostname 0.0.0.0
```

---

## 🔑 User Roles

DevHayat currently supports the following roles:

| Role              | Description                        |
| ----------------- | ---------------------------------- |
| `ADMIN`           | Full administrative access         |
| `PROJECT_MANAGER` | Project and team management        |
| `DEVELOPER`       | Development-related project access |
| `DESIGNER`        | Design-related project access      |
| `MEMBER`          | Standard project member            |

---

## 🔌 API Routes

### Authentication

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

### Projects

```text
GET    /api/projects
POST   /api/projects
GET    /api/projects/[id]
PATCH  /api/projects/[id]
DELETE /api/projects/[id]
```

### Project Members

```text
GET    /api/projects/[id]/members
POST   /api/projects/[id]/members
DELETE /api/projects/[id]/members/[userId]
```

### Issues

```text
GET    /api/issues
POST   /api/issues
GET    /api/issues/[id]
PATCH  /api/issues/[id]
DELETE /api/issues/[id]
```

### Tasks

```text
GET    /api/tasks
POST   /api/tasks
GET    /api/tasks/[id]
PATCH  /api/tasks/[id]
DELETE /api/tasks/[id]
```

### Sprints

```text
GET    /api/sprints
POST   /api/sprints
GET    /api/sprints/[id]
PATCH  /api/sprints/[id]
DELETE /api/sprints/[id]
```

### Users

```text
GET    /api/users
GET    /api/users/[id]
PATCH  /api/users/[id]
PATCH  /api/users/[id]/password
```

### Dashboard

```text
GET /api/dashboard
```

---

## 🔒 Security

DevHayat implements several security practices:

* Password hashing with bcrypt
* Session-based authentication
* HTTP-only authentication cookies
* Role-based authorization
* Database-level unique constraints
* Input validation
* Protected API routes
* Environment-based secrets
* `.env` excluded from Git

Never expose:

```text
DATABASE_URL
ADMIN_PASSWORD
Database credentials
Session secrets
```

in source code or public repositories.

---

## 🧪 Development Workflow

Recommended workflow:

```bash
git pull
npm install
npx prisma migrate deploy
npm run build
npm run dev
```

Before pushing changes:

```bash
git status
git add .
git commit -m "Describe your changes"
git push origin main
```

---

## 🌐 Deployment

DevHayat can be deployed to platforms supporting Next.js and PostgreSQL.

Recommended architecture:

```text
              ┌───────────────┐
              │    Browser    │
              └───────┬───────┘
                      │
                      ▼
             ┌─────────────────┐
             │    Next.js      │
             │   Application   │
             └────────┬────────┘
                      │
                      ▼
             ┌─────────────────┐
             │     Prisma      │
             │       ORM       │
             └────────┬────────┘
                      │
                      ▼
             ┌─────────────────┐
             │    PostgreSQL   │
             │      Neon       │
             └─────────────────┘
```

For temporary demonstrations, the project can also run inside GitHub Codespaces.

---

## 📸 Project Screens

Screenshots can be added here:

```text
Coming soon...
```

---

## 🎯 Project Goals

DevHayat was created to provide a practical project management platform while demonstrating real-world full-stack development concepts such as:

* Authentication
* Authorization
* CRUD operations
* REST APIs
* Database relationships
* ORM usage
* Session management
* Role-based access control
* Project management
* Team management
* Modern frontend development
* Production builds
* Git/GitHub workflow

---

## 🔮 Future Improvements

Possible future features include:

* Real-time notifications
* WebSocket support
* Activity logs
* Advanced reporting
* File attachments
* Comments
* Kanban board
* Drag & Drop task management
* Email notifications
* Audit logs
* Docker deployment
* CI/CD pipeline
* Automated testing
* Advanced permissions
* Dark/Light theme customization

---

## 👨‍💻 Author

**Parham shyasi**

Software Engineering Student
Full-Stack Developer | Linux | DevOps | Networking | Cybersecurity

GitHub:

https://github.com/parham0541

---

## 📄 License

This project is currently intended for educational and portfolio purposes.

---

<p align="center">
  Built with ❤️ by Parham SH
</p>
