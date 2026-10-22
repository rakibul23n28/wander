# Blog API

This project contains the standalone NestJS backend for the React blog frontend. It is configured for Supabase PostgreSQL via Prisma and supports the public and owner-facing routes described in the frontend contract.

## Prerequisites

- Node.js 22+
- npm
- A Supabase project with PostgreSQL and Storage enabled
- Optional: Docker Desktop for local compose workflows

## Local setup

1. Copy `.env.example` to `.env` and fill in your values.
2. Install dependencies: `npm install --legacy-peer-deps`
3. Generate Prisma client: `npx prisma generate`
4. Run migrations: `npx prisma migrate dev`
5. Seed the database: `npm run seed`
6. Start the API: `npm run start:dev`

## Environment variables

See `.env.example` for the required settings.

## Scripts

- `npm run start:dev` — development server
- `npm run build` — production build
- `npm run start:prod` — production server
- `npm run migrate` — create/apply migrations
- `npm run migrate:deploy` — deploy migrations in production
- `npm run seed` — seed owner, categories, and starter posts
- `npm run test` — run Vitest unit tests
- `npm run test:e2e` — run e2e tests
- `npm run lint` — lint source and tests

## Swagger

Swagger is available at `/api/v1/docs` when enabled in the environment.

## Docker

This app can be started with Docker Compose:

```bash
docker compose up --build
```

## Connect the frontend

Set the frontend `VITE_API_URL` to the public API root (for example `http://localhost:3000/api/v1`) and use the following routes:

- `GET /posts` for homepage and blog list pages
- `GET /posts/:slug` for individual post pages
- `POST /posts/:id/view` for view tracking
- `POST /contact` for contact submissions
- `POST /subscribers` for the newsletter signup
