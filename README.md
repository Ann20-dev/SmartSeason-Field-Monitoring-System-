# SmartSeason Field Monitoring System

SmartSeason is a simple full-stack field operations app for tracking crop progress across multiple fields during a growing season. It includes role-based access for admins and field agents, field assignment workflows, stage updates, and a dashboard with operational summaries.

## Stack

- Backend: Node.js, Express, SQLite via `sql.js`
- Frontend: React with Vite
- Auth: JWT-based login with role checks

## Features

- Admin and Field Agent roles
- Authentication with protected API access
- Field creation, editing, and assignment
- Stage tracking across `Planted`, `Growing`, `Ready`, and `Harvested`
- Field agent notes and observations
- Admin dashboard with global overview
- Agent dashboard with assigned fields only
- Computed field status: `Active`, `At Risk`, `Completed`

## Status Logic

Each field status is computed on the backend:

- `Completed`: the field stage is `Harvested`
- `At Risk`: the latest notes contain a risk signal such as pest or disease, there has been no update for more than 7 days, or a field remains in `Planted` for more than 21 days
- `Active`: any field that is not completed and does not meet the risk conditions

This gives admins a quick operational view while still keeping the logic easy to explain and extend.

## Design Decisions

- Monorepo structure: the frontend and backend live in one repository so setup is simpler and the project is easier to review.
- Express API: a lightweight REST API is enough for the scope and keeps the business logic easy to follow.
- React with Vite: chosen for a fast development loop and a straightforward component structure.
- SQLite storage: a small embedded database keeps the project easy to run locally without requiring PostgreSQL or MySQL setup.
- Portable SQLite runtime: `sql.js` was used instead of a native Node SQLite binding so the project works reliably in this Windows environment without extra C++ build tooling.
- JWT authentication: simple, stateless auth with role-based route protection covers the access-control requirement cleanly.
- Server-side computed status: field status is derived on the backend so the rules stay consistent across admin and agent views.

## Assumptions Made

- Users are seeded for demo purposes rather than registered through a public sign-up flow.
- Admins can create and edit all fields and can also submit updates if needed.
- Field agents only see fields assigned to them and can only submit updates for those fields.
- A field has one assigned field agent at a time.
- Notes are free-text observations and are not categorized further.
- Status rules are intentionally simple and explainable rather than agronomically exhaustive.

## Repository Structure

- `client/`: React frontend
- `server/`: Express backend and SQLite persistence
- `server/data/smartseason.db`: generated local database file
- `package.json`: root workspace scripts for running the app

## Setup Instructions

### 1. Install dependencies

Run from the project root:

```bash
npm install
```

### 2. Start the backend server

```bash
npm run dev:server
```

The API will run on `http://localhost:4000`.

### 3. Start the frontend

```bash
npm run dev:client
```

The UI will run on `http://localhost:5173`.

### 4. Build the frontend for production

```bash
npm run build
```

## Demo Credentials

- Admin
  - Email: `admin@smartseason.local`
  - Password: `admin123`
- Field Agent
  - Email: `agent1@smartseason.local`
  - Password: `agent123`
- Additional Agent
  - Email: `agent2@smartseason.local`
  - Password: `agent123`

## API Overview

- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/dashboard/summary`
- `GET /api/fields`
- `POST /api/fields`
- `PUT /api/fields/:id`
- `GET /api/fields/:id/updates`
- `POST /api/fields/:id/updates`
- `GET /api/users/agents`

## Trade-Offs

- I kept the architecture intentionally compact to optimize for readability and reviewability over framework complexity.
- The UI is simple and task-focused rather than heavily componentized because the scope is centered on core workflows.
- Authentication is suitable for a coding exercise, though a production app would need stronger secret management, password policies, refresh-token handling, and audit logging.
- The data model supports the required workflows, but future versions could add multiple updates per day, richer risk rules, attachments, and historical assignment tracking.

## Deployment

- Live deployment link: not included
- The project is ready to be deployed as two services or adapted into a single hosted monorepo workflow

## Notes

- The database is created automatically in `server/data/`.
- The backend seeds demo users, fields, and updates when the database is empty.
- This project is designed for clarity and demonstration, so it keeps API, auth, status logic, and UI concerns separated without overengineering.
