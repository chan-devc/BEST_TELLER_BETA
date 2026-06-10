# BCEL Best Teller Award 2026 — Admin Dashboard

Next.js 14 TypeScript admin panel with PostgreSQL backend.

---

## Prerequisites

- Node.js 18+
- PostgreSQL running at `localhost:5432`
- Database `RewardTeller` already created

```sql
-- Run once in psql to create the database:
CREATE DATABASE "RewardTeller";
```

---

## Quick Start

### 1. Install dependencies

```bash
cd bcel-admin-nextjs
npm install
```

### 2. Configure environment

Edit `.env.local` (already configured for your setup):

```env
DATABASE_URL=postgresql://myuser:mypassword@localhost:5432/RewardTeller
JWT_SECRET=bcel-best-teller-jwt-secret-2026-change-in-production
NEXT_PUBLIC_APP_NAME=BCEL Admin
```

> ⚠️ Change `JWT_SECRET` to a strong random string before going live.

### 3. Run database migration + seed

```bash
# Apply schema (creates all tables, indexes, triggers)
npm run db:migrate

# Seed initial data (users, categories, tellers, announcements)
npm run db:seed
```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to `/admin`.

---

## Default Login Credentials

| Username     | Password      | Role        |
|--------------|---------------|-------------|
| `superadmin` | `bcel@SA2026` | Super Admin |
| `editor1`    | `bcel@Ed2026` | Editor      |
| `editor2`    | `bcel@Ed2026` | Editor      |

> ⚠️ Change all passwords after first login via Settings page.

---

## Production Build

```bash
# Build
npm run build

# Start production server
npm run start
```

For production with PM2:

```bash
npm install -g pm2
npm run build
pm2 start npm --name "bcel-admin" -- start
pm2 save
pm2 startup
```

---

## Project Structure

```
bcel-admin-nextjs/
├── app/
│   ├── globals.css          # Global styles + BCEL CSS variables
│   ├── layout.tsx           # Root layout (Kanit + Sarabun fonts)
│   ├── page.tsx             # Root page (redirects to /admin)
│   ├── admin/
│   │   └── page.tsx         # Admin SPA shell
│   └── api/
│       ├── auth/
│       │   ├── login/       # POST /api/auth/login
│       │   ├── logout/      # POST /api/auth/logout
│       │   └── me/          # GET /api/auth/me
│       ├── tellers/         # GET/POST + /[id] GET/PUT/DELETE
│       ├── categories/      # GET all categories
│       ├── announcements/   # GET/POST + /[id] PUT/DELETE
│       ├── users/           # GET/POST + /[id] PUT/DELETE
│       ├── dashboard/       # GET KPIs, charts, top tellers
│       ├── upload/          # POST bulk upsert + GET history
│       └── settings/        # GET/PUT/DELETE settings
├── components/
│   ├── AdminApp.tsx         # Root client component, page routing
│   ├── LoginForm.tsx        # Login UI
│   ├── Sidebar.tsx          # Navigation sidebar
│   ├── Topbar.tsx           # Page header + action buttons
│   ├── Toast.tsx            # Toast notification stack
│   └── pages/
│       ├── Dashboard.tsx    # KPI cards + charts
│       ├── TellersPage.tsx  # Teller CRUD table
│       ├── WinnersPage.tsx  # Winners by category
│       ├── AnnouncementsPage.tsx
│       ├── UploadPage.tsx   # Excel drag-drop upload
│       ├── ExportPage.tsx   # CSV + print export
│       ├── UsersPage.tsx    # User management (superadmin)
│       └── SettingsPage.tsx # Toggles, password, clear data
├── lib/
│   ├── db.ts                # PostgreSQL pool + query helpers
│   ├── auth.ts              # JWT create/verify, RBAC permissions
│   └── types.ts             # TypeScript interfaces
├── scripts/
│   ├── migrate.sql          # Full schema DDL
│   └── seed.ts              # Seed users, categories, tellers
├── middleware.ts            # Redirects / → /admin
└── .env.local               # Environment variables
```

---

## API Reference

### Auth
| Method | Path                | Body / Notes                    |
|--------|---------------------|---------------------------------|
| POST   | `/api/auth/login`   | `{ username, password }`        |
| POST   | `/api/auth/logout`  | Clears cookie                   |
| GET    | `/api/auth/me`      | Returns current session         |

### Tellers
| Method | Path                 | Notes                            |
|--------|----------------------|----------------------------------|
| GET    | `/api/tellers`       | `?search=&category_id=&page=`    |
| POST   | `/api/tellers`       | Add teller (editor+)             |
| GET    | `/api/tellers/:id`   |                                  |
| PUT    | `/api/tellers/:id`   | Update (editor+)                 |
| DELETE | `/api/tellers/:id`   | Delete (superadmin only)         |

### Upload (Excel)
| Method | Path           | Notes                                    |
|--------|----------------|------------------------------------------|
| POST   | `/api/upload`  | `{ rows: TellerRow[] }` — bulk upsert    |
| GET    | `/api/upload`  | Upload history                           |

### Settings
| Method | Path             | Notes                               |
|--------|------------------|-------------------------------------|
| GET    | `/api/settings`  | All key/value settings              |
| PUT    | `/api/settings`  | `{ key, value }` — upsert           |
| DELETE | `/api/settings`  | Clear ALL tellers (superadmin only) |

---

## Roles & Permissions

| Permission      | superadmin | editor |
|-----------------|:----------:|:------:|
| teller.add      | ✅          | ✅      |
| teller.edit     | ✅          | ✅      |
| teller.delete   | ✅          | ❌      |
| ann.add         | ✅          | ✅      |
| ann.edit        | ✅          | ✅      |
| ann.delete      | ✅          | ❌      |
| user.manage     | ✅          | ❌      |
| settings.clear  | ✅          | ❌      |
| export          | ✅          | ✅      |

---

## Database Schema

5 tables: `admin_users`, `categories`, `tellers`, `announcements`, `app_settings`
Plus `upload_history` for tracking Excel imports.

Key constraints:
- `UNIQUE(user_code, category_id)` on `tellers` — allows same person in multiple categories
- Enum CHECK constraints on `status`, `role`, `tag` columns
- `updated_at` auto-updates via PostgreSQL trigger

---

## Excel Upload Format

The Upload page accepts `.xlsx` files. Sheets must be named exactly as the category `sheet_key` values:

```
1.1.Top_Unit18b
1.2.Top_Service18b
1.3.Top_Cash18b
2.1.Top_Unit3VTE
2.2.Top_Service3VTE
3.3.Top_Cash3VTE
4.1.Top_Cash HQV
5.1.Top_Clearing OPC
5.2.Top_Product OPC
5.3.Top_Aftersale OPC
5.4.Top_Deposit OPC
5.5.Top_Open N Ac OPC
5.6.Top_Transfer
```

Each sheet requires columns: `RANK`, `USER CODE`, `NAME`, `UNIT`, `BRANCH`, `SCORE`

---

## Security Notes for Production

1. Set a strong `JWT_SECRET` (32+ random characters)
2. Change all default passwords immediately
3. Use HTTPS (configure in your reverse proxy / Nginx)
4. Set `ssl: { rejectUnauthorized: true }` in `lib/db.ts` for SSL-enabled PostgreSQL
5. Consider rate limiting on `/api/auth/login`

---

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL via `pg` (node-postgres)
- **Auth**: JWT via `jose`, stored in httpOnly cookies
- **Passwords**: `bcryptjs` (12 salt rounds)
- **Excel parsing**: `xlsx` (client-side)
- **Styling**: Tailwind CSS + inline CSS variables
- **Fonts**: Kanit (headings), Sarabun (body), IBM Plex Mono (code)
