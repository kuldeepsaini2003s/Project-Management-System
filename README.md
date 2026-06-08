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

```bash
cd backend
npm install
cp .env.example .env           # set your DATABASE_URL
npm run prisma:migrate         # creates tables (prompts for migration name)
npm run db:seed                # optional sample data
npm run dev                    # http://localhost:5000
```

## Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev                    # http://localhost:5173
```

## API Endpoints

| Method | Endpoint        | Description    |
|--------|-----------------|----------------|
| GET    | /api/users      | List users     |
| GET    | /api/users/:id  | Get user       |
| POST   | /api/users      | Create user    |
| PUT    | /api/users/:id  | Update user    |
| DELETE | /api/users/:id  | Delete user    |
| GET    | /health         | Health check   |
