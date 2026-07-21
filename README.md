# Fullstack App — Vite + React | Node + Express + PostgreSQL + Prisma

## Structure

```
fullstack-app/
├── frontend/                  # Vite + React (JavaScript)
│   ├── index.html
│   ├── vite.config.js         # @ alias + /api proxy to backend
│   └── src/
│       ├── main.jsx           # Entry point
│       ├── App.jsx            # Routes
│       ├── components/
│       │   ├── common/        # Button, Loader, ErrorMessage
│       │   └── layout/        # Header, Footer
│       ├── pages/             # Home, Users, NotFound
│       ├── hooks/             # useFetch
│       ├── services/          # axios instance + userService
│       ├── constants/
│       ├── utils/
│       └── styles/
└── backend/                   # Node.js + Express + Prisma
    ├── prisma/
    │   ├── schema.prisma      # User & Post models (PostgreSQL)
    │   └── seed.js
    └── src/
        ├── server.js          # Entry point
        ├── app.js             # Express app + middlewares
        ├── config/db.js       # Prisma client
        ├── routes/
        ├── controllers/
        ├── services/
        ├── middlewares/       # errorHandler, notFound
        └── utils/             # asyncHandler, ApiError
```

## Backend Setup

# Prisma Database Commands

> This project uses **Prisma DB Push** (no migrations).

## Generate Prisma Client

Run this whenever you update `schema.prisma`.

```bash
npm run prisma:generate
```

or

```bash
npx prisma generate
```

---

## Apply Schema Changes

After modifying `prisma/schema.prisma`, apply the changes to the database:

```bash
npm run prisma:push
```

or

```bash
npx prisma db push
```

Then regenerate the Prisma Client:

```bash
npm run prisma:generate
```

---

## Reset Database

This will:

- Delete all tables and data
- Recreate the database from `schema.prisma`
- Keep your schema file unchanged

```bash
npx prisma db push --force-reset
```

Then regenerate the Prisma Client:

```bash
npx prisma generate
```

If you have a seed file:

```bash
npm run db:seed
```

---

## Creating a New Model

Example:

```prisma
model Project {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
}
```

After adding the model:

```bash
npx prisma db push
npx prisma generate
```

---

## Updating an Existing Model

Example:

```prisma
model User {
  id    String @id @default(cuid())
  name  String
  email String @unique
  age   Int?
}
```

Apply the changes:

```bash
npx prisma db push
npx prisma generate
```

---

## Updating Environment Variables

If you change your PostgreSQL database or `DATABASE_URL`:

1. Update `.env`
2. Apply the schema:

```bash
npx prisma db push
```

3. Generate the client:

```bash
npx prisma generate
```

---

## Opening Prisma Studio

```bash
npx prisma studio
```

Default URL:

```
http://localhost:5555
```

---

## Validate Prisma Schema

```bash
npx prisma validate
```

---

## Format Prisma Schema

```bash
npx prisma format
```

---

## Check Database Connection

```bash
npx prisma db pull
```

This pulls the current database schema into `schema.prisma`.

---

## Typical Workflows

### 1. Added a new model

```bash
npx prisma db push
npx prisma generate
```

---

### 2. Updated existing schema

```bash
npx prisma db push
npx prisma generate
```

---

### 3. Want a fresh database

```bash
npx prisma db push --force-reset
npx prisma generate
npm run db:seed   # Optional
```

---

### 4. Pulled latest code

```bash
npm install
npx prisma db push
npx prisma generate
npm run dev
```

---

### 5. New Developer Setup

```bash
npm install
cp .env.example .env

# Configure DATABASE_URL

npx prisma db push
npx prisma generate
npm run db:seed    # Optional
npm run dev
```