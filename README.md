# DevHayat

### Modern Project Management Platform for Software Teams

DevHayat is a full-stack project management platform designed for software development teams.

It provides a centralized environment for managing projects, team members, tasks, issues, and sprints through a modern web interface.

The project was built as a practical full-stack software engineering project with a real PostgreSQL database, authentication system, REST API routes, role-based access control, and CRUD operations.

---

## Features

### Authentication & Security

* User registration
* User login
* Secure password hashing with bcrypt
* Session-based authentication
* Protected API routes
* Role-based access control
* Admin account management

### Dashboard

* Project statistics
* Task statistics
* Issue statistics
* Team member statistics
* Project progress
* Development overview

### Projects

* Create projects
* Edit projects
* Delete projects
* View project details
* Project status management
* Project progress tracking
* Project owners
* Project members

### Issues

* Create issues
* Edit issues
* Delete issues
* Assign issues to users
* Issue types
* Issue priorities
* Issue status management
* Project-based issue tracking

### Tasks

* Create tasks
* Edit tasks
* Delete tasks
* Assign tasks
* Task priorities
* Task status management
* Due dates
* Project association

### Sprints

* Create sprints
* Edit sprints
* Delete sprints
* Sprint goals
* Sprint status
* Start and end dates
* Sprint task management

### Team Management

* View team members
* User roles
* Project membership
* Assign users to projects
* Manage project members

### Reports

* Project progress
* Task statistics
* Issue statistics
* Development overview

### Settings

* Application settings
* User-related settings
* Account management

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
* REST-style API endpoints

### Database

* PostgreSQL
* Neon PostgreSQL
* Prisma ORM

### Authentication

* Custom authentication system
* bcryptjs
* Database-backed sessions

### Development Tools

* Git
* GitHub
* GitHub Codespaces
* npm
* Prisma CLI

---

## Architecture

```text
┌──────────────────────────────┐
│          Browser             │
│     Desktop / Mobile         │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│          Next.js             │
│        App Router            │
├──────────────────────────────┤
│ Pages                        │
│ Components                   │
│ API Route Handlers           │
│ Authentication               │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│          Prisma              │
│            ORM               │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│       PostgreSQL             │
│          Neon                │
└──────────────────────────────┘
```

---

## Project Structure

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
│   │   │   ├── issues/
│   │   │   ├── projects/
│   │   │   ├── sprints/
│   │   │   ├── tasks/
│   │   │   └── users/
│   │   │
│   │   ├── dashboard/
│   │   ├── issues/
│   │   ├── projects/
│   │   ├── reports/
│   │   ├── settings/
│   │   ├── sprints/
│   │   ├── tasks/
│   │   ├── team/
│   │   ├── login/
│   │   ├── register/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── components/
│   │   └── layout/
│   │
│   ├── generated/
│   │   └── prisma/
│   │
│   └── lib/
│       └── db.ts
│
├── .env.example
├── .gitignore
├── package.json
├── prisma.config.ts
├── README.md
└── LICENSE
```

---

## Database

DevHayat uses PostgreSQL with Prisma ORM.

The main database models include:

```text
User
Project
ProjectMember
Issue
Task
Sprint
Session
```

Relationships between these models allow DevHayat to manage projects, users, tasks, issues, and sprints through a real relational database.

---

## Getting Started

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

ADMIN_NAME="Dev Admin"
ADMIN_EMAIL="admin@devhayat.local"
ADMIN_PASSWORD="your_secure_password"
```

Do not commit `.env` to GitHub.

---

## Database Setup

Apply Prisma migrations:

```bash
npx prisma migrate deploy
```

Generate Prisma Client if necessary:

```bash
npx prisma generate
```

For development, you can also use:

```bash
npx prisma migrate dev
```

---

## Create an Admin Account

DevHayat includes an admin creation script.

Configure the following variables in `.env`:

```env
ADMIN_NAME="Dev Admin"
ADMIN_EMAIL="admin@devhayat.local"
ADMIN_PASSWORD="your_secure_password"
```

Then run:

```bash
npx tsx scripts/create-admin.ts
```

The script will:

* Create an admin account if it does not exist
* Update an existing account if the email already exists
* Hash the password using bcrypt
* Assign the `ADMIN` role

---

## Run in Development

Start the development server:

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

---

## Run in Production

Build the application:

```bash
npm run build
```

Start the production server:

```bash
npm run start
```

For environments such as GitHub Codespaces where external access is required:

```bash
npm run start -- --hostname 0.0.0.0
```

---

## User Roles

DevHayat supports the following roles:

| Role              | Description                     |
| ----------------- | ------------------------------- |
| `ADMIN`           | Full system administration      |
| `PROJECT_MANAGER` | Project and team management     |
| `DEVELOPER`       | Development and task management |
| `DESIGNER`        | Design-related project work     |
| `MEMBER`          | Standard project member         |

---

## API

DevHayat uses Next.js Route Handlers for backend API functionality.

Main API areas include:

```text
/api/auth
/api/projects
/api/projects/[id]/members
/api/issues
/api/tasks
/api/sprints
/api/users
```

The API handles operations such as:

* Authentication
* User management
* Project CRUD
* Issue CRUD
* Task CRUD
* Sprint CRUD
* Project membership
* Authorization

---

## Security

DevHayat implements several security practices:

* Password hashing with bcrypt
* Database-backed sessions
* Protected API endpoints
* Role-based authorization
* Environment variables for secrets
* PostgreSQL constraints
* Prisma ORM
* Cascade and SetNull relationships where appropriate
* `.env` excluded from Git

Secrets such as database credentials and admin passwords must never be committed to the repository.

---

## Prisma

Useful Prisma commands:

```bash
npx prisma generate
```

```bash
npx prisma migrate dev
```

```bash
npx prisma migrate deploy
```

```bash
npx prisma studio
```

---

## Development Workflow

A typical development workflow:

```text
1. Create or modify a feature
        ↓
2. Update Prisma schema if necessary
        ↓
3. Create/apply database migration
        ↓
4. Implement API
        ↓
5. Implement frontend UI
        ↓
6. Test locally
        ↓
7. Run production build
        ↓
8. Commit changes
        ↓
9. Push to GitHub
```

Before pushing major changes:

```bash
npm run build
```

Make sure the production build completes successfully.

---

## Deployment

DevHayat can be deployed to a Node.js-compatible hosting environment.

Recommended production setup:

```text
Client
   ↓
Next.js Application
   ↓
PostgreSQL
   ↓
Neon
```

Environment variables must be configured on the hosting platform.

The database should use a production PostgreSQL connection string and migrations should be applied using:

```bash
npx prisma migrate deploy
```

---

## Future Improvements

Possible future versions may include:

* Real-time notifications
* WebSocket support
* Advanced analytics
* Kanban boards
* Drag and drop task management
* File attachments
* Activity logs
* Email notifications
* Two-factor authentication
* OAuth login
* Advanced permission management
* Search and filtering
* Dark/light theme customization
* Docker support
* CI/CD pipelines
* Automated testing
* Production monitoring

---

## License

DevHayat is distributed under the:

**DevHayat Community License v1.0**

Copyright © 2026 Parham Hayat

This is a custom **Source-Available** license created specifically for DevHayat.

The project is available for free personal, educational, research, and non-commercial use.

Users may:

* View the source code
* Study the project
* Copy the project
* Fork the repository
* Modify the source code
* Improve the project
* Distribute modified versions for non-commercial purposes

Attribution to the original author and project must be retained.

Commercial use, commercial redistribution, selling the original project, or selling substantially unmodified forks requires written permission from the copyright holder.

Modified versions should clearly state that they are based on DevHayat and should not falsely represent themselves as the original DevHayat project.

See the [`LICENSE`](LICENSE) file for the complete terms.

> DevHayat is not released under an OSI-approved Open Source license. It is a Source-Available project under the custom DevHayat Community License v1.0.

---

## Author

### Parham Hayat

Software Engineering Student
Full-Stack Developer
Linux & Networking Enthusiast
Cybersecurity Enthusiast

GitHub:

```text
https://github.com/parham0541
```

---

## Project

**DevHayat**

A practical project management platform built to combine:

```text
Software Development
+
Project Management
+
Database Engineering
+
Authentication
+
Backend Development
+
Modern Web Development
```

---

## Status

**Active Development**

DevHayat is continuously being improved with new features, security improvements, database functionality, and UI enhancements.

---

### Copyright

Copyright © 2026 Parham sh and h.Hayat.

All rights reserved except where explicitly permitted by the DevHayat Community License v1.0.
