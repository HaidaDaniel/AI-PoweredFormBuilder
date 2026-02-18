# Routes Map

## Admin

/admin/login
  - GET: login form (admin-only)
  - POST: authenticate (admin-only)

/admin/forms
  - GET: list forms

/admin/forms/new
  - GET: empty editor
  - POST: create form

/admin/forms/:formId/edit
  - GET: load form
  - POST: update form
  - DELETE: delete form

/api/ai/chat
  - POST: { message, formDefinition }
  - Returns validated patch or new formDefinition

---

## Public

/forms
  - GET: list forms

/forms/:formId
  - GET: render form
  - POST: submit values (show confirmation modal first)
