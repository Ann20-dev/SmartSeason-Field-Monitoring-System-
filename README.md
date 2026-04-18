# SmartSeason Field Monitoring System

SmartSeason is a simple full-stack field operations app for tracking crop progress across multiple fields during a growing season. It includes role-based access for admins and field agents, field assignment workflows, stage updates, and a dashboard with operational summaries.

## Reviewer Summary

- Clean monorepo with separate frontend and backend workspaces
- Role-based access for `Admin` and `Field Agent`
- Core workflows implemented: authentication, field management, assignment, stage updates, notes, dashboards
- Seeded demo data for immediate testing
- Simple backend-computed status logic: `Active`, `At Risk`, `Completed`

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

## Architecture

```text
React client (Vite)
  -> REST API calls with JWT
Express API
  -> Auth middleware
  -> Role-based route protection
  -> Field and dashboard business logic
SQLite database (persisted locally via sql.js)
```

## Status Logic

Each field status is computed on the backend:

- `Completed`: the field stage is `Harvested`
- `At Risk`: the latest notes contain a risk signal such as pest or disease, there has been no update for more than 7 days, or a field remains in `Planted` for more than 21 days
- `Active`: any field that is not completed and does not meet the risk conditions

This gives admins a quick operational view while still keeping the logic easy to explain and extend.

## Core Workflows

### Admin

- Log in and view an overview of all fields
- Create a new field with crop type, planting date, stage, and assigned agent
- Edit an existing field
- Monitor status counts and stage breakdowns
- Review the latest notes and progress for each field

### Field Agent

- Log in and view only assigned fields
- Update the current stage of a field
- Add observations or notes from the field
- See latest status and field-level details

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

### Alternative: start both services with one command

```bash
npm run dev
```

This starts both the backend and frontend together from the project root.

### 4. Build the frontend for production

```bash
npm run build
```

## Quick Demo Flow

1. Sign in as Admin.
2. Review the dashboard totals and status breakdown.
3. Create a new field and assign it to an agent.
4. Sign out and sign in as `agent1@smartseason.local`.
5. Open an assigned field and submit a stage update with notes.
6. Sign back in as Admin to see the updated field state reflected in the overview.

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

## Sample Field Object

```json
{
  "id": 1,
  "name": "North Plot",
  "cropType": "Maize",
  "plantingDate": "2026-03-10",
  "currentStage": "Growing",
  "assignedAgentId": 2,
  "assignedAgentName": "Daniel Field Agent",
  "latestNotes": "Plants are healthy and irrigation is consistent.",
  "lastUpdateAt": "2026-04-15 09:00:00",
  "status": "Active"
}
```

## Trade-Offs

- I kept the architecture intentionally compact to optimize for readability and reviewability over framework complexity.
- The UI is simple and task-focused rather than heavily componentized because the scope is centered on core workflows.
- Authentication is suitable for a coding exercise, though a production app would need stronger secret management, password policies, refresh-token handling, and audit logging.
- The data model supports the required workflows, but future versions could add multiple updates per day, richer risk rules, attachments, and historical assignment tracking.

## Deployment

- Live deployment link: not included
- The project is ready to be deployed as two services from the same repository

### Recommended Deployment Setup

- Frontend: Render Static Site or Vercel
- Backend: Render Web Service
- Current repository support: `render.yaml` is included for an easier Render deployment flow

### Render Deployment Steps

1. Push the repository to GitHub.
2. In Render, create a new Blueprint and connect this repository.
3. Render will detect [render.yaml](</c:/Users/Anastacia/OneDrive/Desktop/SmartSeason Field Monitoring System/render.yaml>) and create:
   - `smartseason-api`
   - `smartseason-client`
4. After Render generates the frontend URL, set:
   - `CLIENT_URL` on the backend to your frontend URL
   - `VITE_API_URL` on the frontend to `https://your-backend-url/api`
5. Redeploy both services after setting those environment variables.

### Vercel + Render Alternative

- Deploy the `client/` folder to Vercel as a Vite app
- Deploy the `server/` folder to Render as a Node web service
- Set:
  - `VITE_API_URL` in Vercel to your Render backend URL plus `/api`
  - `CLIENT_URL` in Render to your Vercel frontend URL

### Hosted Data Note

- Render web services use an ephemeral filesystem by default, so the current SQLite file in `server/data/` should be treated as demo-only in hosted environments.
- In practice, this means seeded/demo data may reset after redeploys or restarts unless you move to a managed database or add persistent storage.
- For this assessment, the local SQLite approach keeps setup simple, but a production deployment should move persistence to Postgres, MySQL, or a persistent disk-backed solution.

## Possible Next Improvements

- Add registration and user management screens
- Add richer field history and timeline views
- Support image attachments for field observations
- Replace hardcoded JWT secret handling with environment-based secrets
- Add automated API and UI tests

## Notes

- The database is created automatically in `server/data/`.
- The backend seeds demo users, fields, and updates when the database is empty.
- This project is designed for clarity and demonstration, so it keeps API, auth, status logic, and UI concerns separated without overengineering.
