# Hudson LP Portal

White-label investor portal for fund managers. LPs view their capital account data, browse fund documents, and ask questions via RAG-powered chat. GPs upload CSV/PDF data and manage LP access through an admin dashboard.

## Stack

- **Framework**: Next.js 14 (App Router, TypeScript strict)
- **Database**: Neon Postgres + pgvector (via Drizzle ORM)
- **AI**: Vercel AI SDK + OpenAI (GPT-4o-mini for chat, text-embedding-3-small for RAG)
- **Storage**: Vercel Blob (PDF/CSV uploads)
- **Email**: Resend (magic link auth, LP invitations)
- **UI**: Tailwind CSS, Recharts, Lucide icons
- **Design**: Dieter Rams principles. Inter + JetBrains Mono. Light mode default, dark via system preference.

## Setup

```bash
cp .env.example .env
# Fill in all values in .env

npm install
npm run db:push    # Create database tables
npm run dev        # Start dev server at localhost:3000
```

## Architecture

### Auth

- **LP auth**: Magic link via email (Resend). 15-minute token, 7-day session.
- **Admin auth**: Single ADMIN_SECRET env var. No user/password.

### Data Isolation

Per-LP data isolation is enforced at three levels:

1. **Middleware**: Session token required for /dashboard, /documents, /chat. Admin session for /admin.
2. **API Route**: `requireAuth()` validates session, returns user with `lp_id`. KPI route filters by `user.lp_id` only -- no query parameter accepted.
3. **Database**: `kpi_data` has unique index on `(lp_id, report_date)`. Conversations scoped to `user_id` FK.

### Pages

| Route | Access | Description |
|-------|--------|-------------|
| `/login` | Public | LP magic link login |
| `/admin/login` | Public | Admin secret login |
| `/dashboard` | LP | KPI cards, NAV chart, fund overview |
| `/documents` | LP | PDF document list with download |
| `/chat` | LP | RAG-powered chat with citations |
| `/admin` | Admin | Tabbed dashboard: Upload, LPs, Questions |

### API Routes

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/magic-link` | POST | Public | Send magic link email |
| `/api/auth/verify` | GET | Public | Verify token, create session |
| `/api/auth/admin` | POST | Public | Admin secret login |
| `/api/auth/logout` | GET | Any | Clear session cookies |
| `/api/kpi` | GET | LP | LP's KPI data (scoped by session) |
| `/api/fund` | GET | LP | Aggregated fund overview |
| `/api/documents` | GET | LP | List PDF documents |
| `/api/documents/[id]` | GET | LP | Download document |
| `/api/chat` | POST | LP | RAG chat with streaming |
| `/api/upload` | POST | Admin | Upload CSV/PDF |
| `/api/admin/lps` | GET | Admin | List all LPs |
| `/api/admin/lps/[id]` | GET/PATCH | Admin | View/update LP email |
| `/api/admin/lps/[id]/invite` | POST | Admin | Send portal invite |
| `/api/admin/questions` | GET | Admin | Recent LP questions |

## Testing

```bash
npm test           # Run all tests
npm run test:watch # Watch mode
```

## White-Label

Set these env vars to customize:

- `FUND_NAME` -- displayed in header, emails, metadata
- `FUND_LOGO_URL` -- sidebar logo image
- `FUND_ACCENT_COLOR` -- hex color for buttons, links, active states
