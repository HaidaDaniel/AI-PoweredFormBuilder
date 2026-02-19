# AI-Powered Form Builder

A full-stack Form Builder application built with React Router v7, TypeScript, Prisma, and PostgreSQL.

## Features

- **Form Editor** — Create and edit forms with text, number, and textarea fields
- **Form Preview** — Live preview while editing (50/50 split layout)
- **AI Chat Assistant** — Edit form structure using natural language (supports OpenAI, Ollama, and OpenRouter)
- **Voice Input** — Microphone input for AI assistant (Chrome/Edge/Safari)

## Tech Stack

- **Framework**: React Router v7 (SSR)
- **Language**: TypeScript
- **Styling**: TailwindCSS v4
- **Database**: PostgreSQL 16 + Prisma ORM
- **Auth**: Cookie-based sessions (bcryptjs for password hashing)

## Getting Started

### Quick Start with Docker Compose

The easiest way to run the application in development mode:

```bash
docker compose up
```

This will:
1. Start PostgreSQL database
2. Install npm dependencies
3. Run database migrations
4. Seed an admin user
5. Start the dev server with HMR

Open **http://localhost:5173** in your browser.

**Docker + AI:** The Docker setup defaults to Ollama. Ensure Ollama is running on your host (or override with `LLM_PROVIDER=openai`, `LLM_PROVIDER=openrouter`, and respective API keys).

### Default Admin User

After seeding, you can log in with the default credentials (configurable via environment variables):
- **Email**: `admin@admin.com` (set via `ADMIN_EMAIL`)
- **Password**: `admin123` (set via `ADMIN_PASSWORD`)

### Local Development (without Docker)

1. Copy the environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and set your PostgreSQL connection URL, session secret, and admin credentials:
   ```
   DATABASE_URL=postgresql://aifb:aifb@localhost:5432/aifb
   SESSION_SECRET=your-random-secret-here
   ADMIN_EMAIL=admin@admin.com
   ADMIN_PASSWORD=admin123
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Run migrations and seed:
   ```bash
   npm run db:setup
   ```

5. Start the dev server:
   ```bash
   npm run dev
   ```

### AI Chat Assistant

The form editor includes an AI assistant that edits form fields from natural language (e.g., "Add a required email field", "Make name required").

- **Ollama:** Set `LLM_PROVIDER=ollama`, run `ollama pull llama3.2` (or similar), and optionally set `OLLAMA_BASE_URL`, `OLLAMA_MODEL`
- **OpenAI:** Set `LLM_PROVIDER=openai`, `OPENAI_API_KEY`, and optionally `OPENAI_MODEL` (default: `gpt-4o-mini`)
- **OpenRouter:** Set `LLM_PROVIDER=openrouter`, `OPENROUTER_API_KEY`, and optionally `OPENROUTER_MODEL` (default: `openai/gpt-4o-mini`)

See [docs/06_AI_INTEGRATION.md](docs/06_AI_INTEGRATION.md) for detailed setup and troubleshooting.

## Project Structure

```
app/
  auth/
    session.server.ts      # Cookie session storage
    auth.server.ts         # Auth logic: login, logout, guards
  db/
    db.server.ts           # PrismaClient singleton
  components/
    FormFieldEditor.tsx    # Field editor UI component
    FormPreview.tsx        # Form preview renderer
  routes/
    home.tsx               # / — redirects to /admin/forms (if admin) or /forms (public)
    forms.tsx              # /forms — public list of published forms
    forms.$id.tsx          # /forms/:id — public form fill page
    admin-layout.tsx       # Layout for /admin/* (admin guard)
    admin.login.tsx        # /admin/login — admin sign in page
    admin.forms.tsx        # /admin/forms — admin forms list
    admin.forms.new.tsx    # /admin/forms/new — create new form
    admin.forms.$id.edit.tsx # /admin/forms/:id/edit — form editor
    logout.tsx             # /logout — destroys session
  domain/
    form.schema.ts         # Zod schema generator for form validation
  routes.ts                # Route configuration

prisma/
  schema.prisma            # Database schema (User, Form, FormField, FormResponse)
  seed.ts                  # Seeds admin user
  migrations/              # Database migrations
```

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run db:migrate` | Apply database migrations |
| `npm run db:seed` | Seed admin user |
| `npm run db:push` | Push schema to DB (dev) |
| `npm run db:setup` | Run migrations + seed |

## Environment Variables

| Variable | Description | Default (Docker) |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://aifb:aifb@db:5432/aifb` |
| `SESSION_SECRET` | Secret for signing session cookies | `dev-secret-change-in-production` |
| `ADMIN_EMAIL` | Email for the admin user created during seeding | `admin@admin.com` |
| `ADMIN_PASSWORD` | Password for the admin user created during seeding | `admin123` |
| `LLM_PROVIDER` | AI provider: `openai`, `ollama`, or `openrouter` | `ollama` (Docker) |
| `OPENAI_API_KEY` | OpenAI API key (required if `LLM_PROVIDER=openai`) | — |
| `OPENAI_MODEL` | OpenAI model name | `gpt-4o-mini` |
| `OPENROUTER_API_KEY` | OpenRouter API key (required if `LLM_PROVIDER=openrouter`) | — |
| `OPENROUTER_MODEL` | OpenRouter model ID (e.g. `openai/gpt-4o-mini`) | `openai/gpt-4o-mini` |
| `OLLAMA_BASE_URL` | Ollama API base URL | `http://localhost:11434` |
| `OLLAMA_MODEL` | Ollama model name | `llama3.2` |

## Routes & Access

### Public Routes (No Authentication Required)

| Path | Description |
|---|---|
| `/forms` | List of published forms (title, description, Open button) |
| `/forms/:id` | Fill and submit a published form (with validation and confirmation modal) |

### Admin Routes (Admin Authentication Required)

| Path | Description |
|---|---|
| `/admin/login` | Admin sign in page (admin-only) |
| `/admin/forms` | List all forms (create, edit, delete) |
| `/admin/forms/new` | Create new form (empty editor) |
| `/admin/forms/:id/edit` | Form editor with live preview and AI Assistant |
| `/admin/results` | View form responses/submissions |

**Authentication & Redirects:**
- Unauthorized access to `/admin/*` → redirect to `/admin/login`
- After successful login → redirect to `/admin/forms`
- Public users access forms directly without authentication
