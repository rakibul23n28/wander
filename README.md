<div align="center">

# wander.

### A journal of places, people, and little things.

**A full-stack travel blog built with React, Vite, NestJS, Prisma, and Supabase.**

[Explore the app](#-getting-started) · [Frontend](#-frontend) · [API](#-api)

</div>

<p align="center">
  <img src="./public/home.jpeg" alt="Wander Journal home page with a blue tile-wall layout and travel stories" width="100%">
</p>

## The idea

Wander is a personal journal for thoughtful travel stories and everyday discoveries. Its tile-wall interface brings editorial content to life, while an owner workspace supports drafting and publishing stories.

The repository contains the React frontend and a separate NestJS API in `blog-api/`.

## At a glance

| Public journal | Owner workspace | Full-stack |
|:---:|:---:|:---:|
| Story discovery, categories, and search | Login, drafts, editing, and publishing | REST API, PostgreSQL, and media services |

## Screens from the journal

<table>
  <tr>
    <td width="50%">
      <img src="./public/home.jpeg" alt="Wander Journal home page" width="100%">
      <p align="center"><strong>Discover stories</strong></p>
    </td>
    <td width="50%">
      <img src="./public/blog-details.jpeg" alt="A Wander Journal story page" width="100%">
      <p align="center"><strong>Read the journey</strong></p>
    </td>
  </tr>
  <tr>
    <td colspan="2">
      <img src="./public/create-edit.jpeg" alt="Wander Journal story editor" width="100%">
      <p align="center"><strong>Write and manage posts</strong></p>
    </td>
  </tr>
</table>

## Built with

**Frontend**  
React · TypeScript · Vite · Tailwind CSS · React Router · TipTap

**Backend**  
NestJS · Prisma · PostgreSQL · Supabase

## Features

- Tile-wall home page and responsive editorial layouts
- Blog search, categories, sorting, and post pages
- Owner login with protected writing and management routes
- Draft and publish workflows, featured stories, and view counts
- Image and video upload integration
- Contact form and newsletter signup
- API URL configurable through `VITE_API_URL`

## Getting started

### Requirements

- Node.js 22 or newer
- npm
- A configured PostgreSQL/Supabase database for the API
- Backend environment values (keep secrets private)

### 1. Configure the frontend

In the repository root, create a `.env` file with the API URL:

```env
VITE_API_URL=http://localhost:3000/api/v1
```

The frontend defaults to this URL if `VITE_API_URL` is not set.

### 2. Configure and start the API

Add the required environment values to `blog-api/.env`. Use `blog-api/.env.example` as a guide; do not commit actual credentials or secret keys.

```bash
cd blog-api
npm install --legacy-peer-deps
npm run db:generate
npm run migrate
npm run start:dev
```

The API is served at `http://localhost:3000/api/v1`. For local development, configure `CORS_ORIGINS` to include the frontend origin if it is not already allowed, for example:

```env
CORS_ORIGINS="http://localhost:5173,http://localhost:8443"
```

### 3. Start the frontend

From the repository root, in another terminal:

```bash
npm install
npm run dev
```

Open the Vite URL shown in the terminal. In this workspace the development server is commonly available at `http://localhost:8443`.

## Handy commands

Run from the repository root for the frontend:

```bash
npm run dev
npm run build
```

Run from `blog-api/` for the backend:

```bash
npm run start:dev
npm run build
npm run migrate
npm run seed
npm run test
```

## Project layout

```text
.
├── public/             # App assets and README screenshots
├── src/                # React frontend
│   ├── components/     # Shared layout, tiles, and UI
│   ├── hooks/          # React data hooks
│   ├── lib/            # API and shared utilities
│   ├── pages/          # Home, blog, post, login, and editor pages
│   └── services/       # API-backed services
└── blog-api/           # NestJS API and Prisma schema
```

## Security note

Never place backend secrets in frontend environment variables or commit `.env` files. Only the public API base URL belongs in the frontend configuration.

---

<div align="center">
Made for the moments in between.
</div>
