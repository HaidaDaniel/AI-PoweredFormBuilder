# Project: React Router v7 Form Builder (Admin + Public + AI helper)

Source of truth: docs/00_REQUIREMENTS.md and docs/01_ARCHITECTURE.md.
Do not invent features beyond requirements.

Tech defaults:
- React Router v7 (Framework) + TypeScript
- TailwindCSS
- Prisma + PostgreSQL
- Auth: session-based (cookie session)
- Validation: Zod
- API: REST endpoints inside React Router v7 (framework) routes

Core entities:
- FormDefinition: JSON describing fields (text|number|textarea only).
- FormResponse: submitted values for a form (optional if implemented).

Hard constraints:
- Field types are ONLY: text, number, textarea.
- Options allowed ONLY from requirements.
- Keep everything strongly typed. No `any`.
