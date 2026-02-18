# Architecture

## Layered Design

Routes:
- Handle HTTP requests
- Call services
- Return JSON or UI

Services (*.server.ts):
- DB access
- Auth logic
- AI logic
- Business rules

Domain:
- Types
- Zod schemas
- Patch helpers

---

## Folder Structure

app/
  routes/
  services/
  domain/
  components/
  utils/

prisma/
docs/
.cursor/

---

## Route Structure

Routes are organized into two areas:

**Admin Area (`/admin/*`):**
- Protected by session authentication
- Admin-only access
- Includes: login, forms list, form editor

**Public Area:**
- No authentication required
- Includes: forms list, form fill pages

All admin routes use `/admin/*` prefix. No `/app/*` routes exist.

---

## Data Flow

Admin Edit:
UI → action → service → DB

Public Submit:
UI → action → Zod validate → confirm modal → save

AI:
Chat UI → api.ai.chat → ai.service → validate → return patch
