# React Router v7 Form Builder — Requirements

## Overview

Application consists of:

1. Admin area (protected)
2. Public area (form listing + form fill)
3. Bonus: AI chat assistant for editing form structure

Stack:
- React Router v7 (Framework)
- TypeScript
- Prisma + PostgreSQL
- Zod validation
- TailwindCSS

---

# 1. Admin Area

Protected by session authentication.

Routes:
- All admin routes are under `/admin/*` prefix
- Login is admin-only (no public user registration)
- Public users access forms directly without authentication

Authentication & Redirects:
- Unauthorized access to `/admin/*` → redirect to `/admin/login`
- After successful login → redirect to `/admin/forms`

## 1.1 Forms List Page

Admin can:
- View all forms
- Create new form
- Edit existing form
- Delete form

Each form:
- id (uuid)
- title
- description (optional)
- schemaJson (JSON structure)
- createdAt
- updatedAt

---

## 1.2 Form Editor

Layout:
- Left: Form preview
- Right: Field settings sidebar

Form consists of fields.

Allowed field types:
- text
- number
- textarea

---

## Field Structure

Each field has:

Common:
- id (string)
- type (text | number | textarea)
- label (string)
- required (boolean)
- placeholder (optional string)

text:
- minLength (optional number)
- maxLength (optional number)

number:
- min (optional number)
- max (optional number)

textarea:
- minLength (optional number)
- maxLength (optional number)
- rows (optional number)

---

Admin must be able to:
- Add field
- Remove field
- Reorder fields
- Edit field options
- Save form

Validation must be enforced using Zod on the server.

---

# 2. Public Area

## 2.1 Forms List

Page displays list of available forms.

Each form:
- Title
- Description
- Button "Open"

---

## 2.2 Fill Form Page

User:
- Sees dynamic form generated from schemaJson
- Submits values

After submission:
- Modal shows entered data
- User confirms
- After confirmation → success message

No authentication required for public area.

---

# 3. Data Storage

Database stores:

Form:
- id
- title
- description
- schemaJson (JSON)
- createdAt
- updatedAt

Optional:
FormResponse:
- id
- formId
- valuesJson
- createdAt

---

# 4. Bonus: AI Chat Assistant

Admin can type instructions like:

"Add required phone field"
"Make email required"
"Add textarea for comments"

AI must:
- Receive current FormDefinition
- Return JSON Patch OR full FormDefinition
- Use ONLY allowed field types
- Follow schema constraints strictly

Server must:
- Validate AI output with Zod
- Reject invalid structures
- Apply patch safely
