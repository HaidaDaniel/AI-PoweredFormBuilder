# Architecture rules

Layers:
- routes/: only request handling + composing UI. Minimal logic.
- services/*.server.ts: business logic, DB, auth, AI calls.
- domain/: pure types, zod schemas, helpers. No React Router imports.

Data flow:
- DB stores form JSON as one column (json/jsonb) + metadata.
- UI editor works on FormDefinition in memory and persists via actions.

Always:
- Use Zod schemas for parsing any untrusted input (forms, params, AI output).
- Validate route params like formId.
