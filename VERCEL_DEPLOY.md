# Vercel Deployment

## Prerequisites

- External PostgreSQL instance (your existing connection string)
- Git repository connected to Vercel

## Steps

1. **Create project in Vercel**
   - Import your Git repo
   - Vercel will auto-detect React Router

2. **Set environment variables** (Project Settings > Environment Variables)

   | Variable         | Description                             |
   | ---------------- | --------------------------------------- |
   | `DATABASE_URL`   | Your external Postgres connection string |
   | `SESSION_SECRET` | Random string for sessions (e.g. `openssl rand -hex 32`) |
   | `ADMIN_EMAIL`    | Admin login email                        |
   | `ADMIN_PASSWORD` | Admin login password                     |
   | `LLM_PROVIDER`   | `openai` or `openrouter` (Ollama won't work on Vercel) |
   | `OPENAI_API_KEY` | If using OpenAI                          |
   | `OPENROUTER_API_KEY` | If using OpenRouter                  |

3. **Run migrations** against your production DB before first deploy:

   ```bash
   DATABASE_URL="your-production-url" npx prisma migrate deploy
   ```

4. **Deploy**
   - Push to your main branch or trigger deploy from Vercel dashboard

## Build

- **Build command**: `npm run build` (default)
- **Output directory**: handled by `@vercel/react-router` preset
- `postinstall` runs `prisma generate` automatically during build
