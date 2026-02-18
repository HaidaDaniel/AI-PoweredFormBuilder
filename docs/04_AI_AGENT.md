# AI Agent Contract

Input:
{
  message: string,
  formDefinition: FormDefinition
}

Output (Option A - Recommended):
{
  type: "patch",
  operations: JSONPatch[]
}

OR

Output (Option B):
{
  type: "replace",
  formDefinition: FormDefinition
}

Strict Rules:
- Must return valid JSON only
- Must not introduce unknown field types
- Must respect allowed schema

Server:
- Parse
- Validate with Zod
- Apply patch safely
- Reject if invalid
