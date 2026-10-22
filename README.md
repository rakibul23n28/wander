# Wander Journal

A full-stack blog application with a React + Vite frontend and a NestJS + Prisma + Supabase backend. It supports public reading, post management, protected owner-only routes, media uploads, contact, and newsletter subscriptions.

## Project structure

- `src/` — React frontend application
- `blog-api/` — NestJS API backend
- `public/` — static assets
- `.env.example` — frontend API URL example
- `blog-api/.env` — backend environment configuration

## Stack

- Frontend: React, Vite, TypeScript, Tailwind CSS
- Backend: NestJS, Prisma, PostgreSQL/Supabase
- Auth: JWT-based owner login
- Media: API-backed image/video uploads

## Prerequisites

- Node.js 22+
- npm
- A working Supabase/PostgreSQL database
- Access to the project `.env` values for the backend

## Environment setup

### Frontend

Copy the example env file if needed:

```bash
cp .env.example .env
```

Set the API base URL:

```env
VITE_API_URL=http://localhost:3000/api/v1
```

### Backend

The backend environment file lives in `blog-api/.env` and contains the required runtime values, including:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `SUPABASE_JWKS_URL`
- `DATABASE_URL`
- `SECRET_KEY`
- `GOOGLE_APP_EMAIL`
- `GOOGLE_APP_PASSWORD`

Do not commit secret values to version control.

## Install dependencies

### Frontend

```bash
npm install
```

### Backend

```bash
cd blog-api
npm install --legacy-peer-deps
```

## Run the app

### Backend

```bash
cd blog-api
npm run start:dev
```

The API runs on:

```text
http://localhost:3000/api/v1
```

### Frontend

In the project root:

```bash
npm run dev
```

The frontend typically runs on the local Vite dev server (default port 5173 unless configured otherwise).

## Useful backend commands

```bash
cd blog-api
npm run build
npm run start:prod
npm run migrate
npm run seed
npm run test
```

## Features

- Public blog home and article pages
- Search, category filtering, and sorting
- Featured stories and popular views
- Owner login and protected author routes
- Post drafting and publishing workflow
- Media preview images and video uploads
- Contact form and newsletter signup
- API-driven data fetching instead of local mock data

## Notes

- The frontend expects the API at `VITE_API_URL` and will redirect unauthenticated users to `/login` when owner-only routes are accessed.
- The backend and frontend are intended to run together for the full application experience.
- This repository is structured as a monorepo-style app with a separate API project under `blog-api/`.
