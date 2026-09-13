# DevHayat

> A modern project management platform for software development teams.

DevHayat is a full-stack project management platform designed for software development teams. It provides project tracking, task management, issue tracking, sprint management, team management, reports, authentication, role-based access control, and a Progressive Web App experience.

The project is built with modern web technologies and uses a real PostgreSQL database through Prisma ORM.

---

## Features

* 📊 Modern project management dashboard
* 📁 Project management
* ✅ Task management
* 🐞 Issue and bug tracking
* 🏃 Sprint management
* 👥 Team and project member management
* 📈 Reports and project progress
* 🔐 Authentication system
* 🛡️ Role-based access control
* 🔑 Secure password hashing with bcrypt
* 🍪 Database-backed sessions
* 📱 Progressive Web App (PWA)
* 🌙 Responsive modern UI
* 🗄️ PostgreSQL database
* ⚡ Prisma ORM
* ☁️ Neon PostgreSQL support
* 🔌 REST API routes
* 🧩 Modular application architecture

---

## Tech Stack

### Frontend

* Next.js 16
* React 19
* TypeScript
* Tailwind CSS
* Lucide React

### Backend

* Next.js App Router
* Next.js Route Handlers
* Prisma ORM
* PostgreSQL
* bcryptjs

### Database

* PostgreSQL
* Neon PostgreSQL
* Prisma Migrations

### Development

* Git
* GitHub
* GitHub Codespaces
* npm
* ESLint

---

## Architecture

DevHayat follows a modern full-stack architecture using the Next.js App Router.

```text
Client
   │
   ▼
Next.js App Router
   │
   ├── Pages
   ├── Components
   └── API Routes
          │
          ▼
      Authentication
          │
          ▼
        Prisma
          │
          ▼
      PostgreSQL
          │
          ▼
         Neon
```

---

## Project Structure

```text
DevHayat/
├── prisma/
│   ├── migrations/
│   └── schema.prisma
│
├── public/
│   └── icons/
│       ├── devhayat-logo.svg
│       ├── icon-192.png
│       └── icon-512.png
│
├── scripts/
│   └── create-admin.ts
│
├── src/
│   ├── app/
│   │   ├── (dashboard)/
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
│   │   ├── team/
│   │   ├── manifest.ts
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── components/
│   ├── generated/
│   │   └── prisma/
│   │
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── db.ts
│   │   └── utils.ts
│   │
│   └── types/
│
├── .env.example
├── .gitignore
├── next.config.ts
├── package.json
├── prisma.config.ts
├── tsconfig.json
└── README.md
```

---

## Main Modules

### Dashboard

Provides an overview of:

* Projects
* Tasks
* Issues
* Team members
* Project progress
* Recent activity

### Projects

Users can manage software projects and their:

* Name
* Project key
* Description
* Status
* Progress
* Owner
* Members

### Tasks

Tasks support:

* Title
* Description
* Status
* Priority
* Assignee
* Project
* Sprint
* Due date

### Issues

Issues support:

* Tasks
* Bugs
* Stories
* Priority
* Status
* Reporter
* Assignee
* Project

### Sprints

Sprint management includes:

* Sprint name
* Sprint goal
* Project
* Status
* Start date
* End date
* Tasks

### Team

Project members and users can be managed through the team management system.

### Reports

The reports section provides project and task progress information for monitoring development activity.

---

## Authentication

DevHayat includes its own authentication system.

Authentication features include:

* User registration
* User login
* User logout
* Session management
* Current-user endpoint
* Password hashing
* Protected API routes
* Role-based authorization

Passwords are never stored as plain text.

Passwords are hashed using `bcryptjs`.

Sessions are stored in PostgreSQL using the `Session` model.

---

## User Roles

DevHayat supports the following roles:

| Role              | Description                 |
| ----------------- | --------------------------- |
| `ADMIN`           | Full system administration  |
| `PROJECT_MANAGER` | Project and team management |
| `DEVELOPER`       | Development-related access  |
| `DESIGNER`        | Design-related access       |
| `MEMBER`          | Standard project member     |

---

## Database

DevHayat uses PostgreSQL as its primary database.

Prisma is used as the ORM and database management layer.

The current database models include:

```text
User
Project
ProjectMember
Issue
Task
Sprint
Session
```

Relationships between these models allow DevHayat to operate as a real database-driven application rather than a static frontend project.

---

## Environment Variables

Create a `.env` file in the project root.

Example:

```env
DATABASE_URL="your_postgresql_connection_string"

ADMIN_NAME="Dev Admin"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="your_secure_password"
```

Never commit your real `.env` file to GitHub.

Use `.env.example` when sharing the project configuration structure.

---

## Installation

Clone the repository:

```bash
git clone https://github.com/parham0541/DevHayat.git
```

Enter the project:

```bash
cd DevHayat
```

Install dependencies:

```bash
npm install
```

Create your environment file:

```bash
cp .env.example .env
```

Configure your PostgreSQL database in `.env`.

---

## Database Setup

Generate the Prisma client:

```bash
npx prisma generate
```

Apply existing migrations:

```bash
npx prisma migrate deploy
```

For development environments, you can create a new migration with:

```bash
npx prisma migrate dev
```

You can also inspect the database using Prisma Studio:

```bash
npx prisma studio
```

---

## Create an Admin Account

The project includes an admin creation script.

Configure these variables in `.env`:

```env
ADMIN_NAME="Dev Admin"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="your_secure_password"
```

Then run:

```bash
npx tsx scripts/create-admin.ts
```

The script creates a new administrator or updates an existing account with the specified email.

---

## Development

Start the development server:

```bash
npm run dev
```

The application will normally be available at:

```text
http://localhost:3000
```

---

## Production

Build the application:

```bash
npm run build
```

Start the production server:

```bash
npm run start
```

For environments where external access to the server is required:

```bash
npm run start -- --hostname 0.0.0.0
```

---

## API

DevHayat uses Next.js Route Handlers for its backend API.

### Authentication

```text
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/register
GET  /api/auth/me
```

### Projects

```text
GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PATCH  /api/projects/:id
DELETE /api/projects/:id
```

### Project Members

```text
GET    /api/projects/:id/members
POST   /api/projects/:id/members
DELETE /api/projects/:id/members/:userId
```

### Tasks

```text
GET    /api/tasks
POST   /api/tasks
GET    /api/tasks/:id
PATCH  /api/tasks/:id
DELETE /api/tasks/:id
```

### Issues

```text
GET    /api/issues
POST   /api/issues
GET    /api/issues/:id
PATCH  /api/issues/:id
DELETE /api/issues/:id
```

### Sprints

```text
GET    /api/sprints
POST   /api/sprints
GET    /api/sprints/:id
PATCH  /api/sprints/:id
DELETE /api/sprints/:id
```

### Users

```text
GET   /api/users
GET   /api/users/:id
PATCH /api/users/:id
PATCH /api/users/:id/password
```

---

## Progressive Web App

DevHayat includes native PWA functionality using Next.js.

The application provides:

* Web App Manifest
* Standalone application mode
* Custom application icons
* Mobile-friendly interface
* Installable web application experience
* PWA theme configuration

The manifest is generated through:

```text
src/app/manifest.ts
```

Application icons are located in:

```text
public/icons/
```

The PWA allows DevHayat to behave more like a native application when installed on supported devices and browsers.

---

## Security

DevHayat implements several security practices:

* Password hashing with bcrypt
* Database-backed sessions
* Authentication-protected API endpoints
* Role-based authorization
* Server-side authentication checks
* Unique email constraints
* Prisma ORM for database access
* Environment variables for secrets
* Cascade and SetNull database relationships where appropriate

Sensitive environment variables should never be committed to the repository.

---

## Development Workflow

A typical development workflow:

```text
Create Feature
      ↓
Develop Locally
      ↓
Test
      ↓
Run Build
      ↓
Git Commit
      ↓
Git Push
      ↓
GitHub
```

Before pushing major changes, verify the production build:

```bash
npm run build
```

---

## Deployment

DevHayat can be deployed to platforms that support Next.js and PostgreSQL.

Recommended database provider:

```text
Neon PostgreSQL
```

Possible application hosting options include:

```text
Vercel
GitHub Codespaces
Self-hosted Linux server
Other Node.js-compatible hosting platforms
```

The application requires the appropriate environment variables and a reachable PostgreSQL database.

---

## Current Status

DevHayat is currently an active development project.

Implemented:

* Authentication
* User registration and login
* Session management
* Role-based access control
* Dashboard
* Projects
* Project members
* Tasks
* Issues
* Sprints
* Team management
* Reports
* Settings
* PostgreSQL database
* Prisma ORM
* API routes
* Admin management
* PWA manifest
* Application icons
* Responsive UI

---

## Future Improvements

Planned improvements may include:

* Real-time notifications
* Activity logs
* Advanced reporting
* File attachments
* Comments
* Team chat
* Advanced search
* Filtering and sorting
* Email notifications
* Real-time updates
* Automated testing
* CI/CD pipeline
* Docker support
* Production deployment
* Advanced permission management

---

## License

DevHayat is distributed under the **DevHayat Community License v1.0**.

This is a custom source-available license created specifically for the DevHayat project.

The license permits:

* Personal use
* Educational use
* Research use
* Non-commercial use
* Modification
* Non-commercial redistribution
* Creation of non-commercial forks

Commercial use, resale, or commercial distribution requires written permission from the copyright holder.

Modified versions must clearly state that they are based on DevHayat.

See the project license file for the complete terms.

---

## Author

**Parham Sh**

Software Engineering Student
Full-Stack Developer
Linux & DevOps Enthusiast
Network & Security Learner

GitHub:

https://github.com/parham0541

---

## Repository

**DevHayat**

https://github.com/parham0541/DevHayat

---

## Project Goal

DevHayat was created as a practical full-stack software project to combine:

```text
Frontend
+
Backend
+
Database
+
Authentication
+
API
+
Project Management
+
Linux
+
DevOps
```

The goal is to build a realistic software project rather than a simple demo application.

## Parham.SH and H.Hayat ❤️
