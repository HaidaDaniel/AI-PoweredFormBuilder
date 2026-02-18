# AI agent rules (bonus)

Goal: convert a chat instruction into a safe update of FormDefinition.

Must:
- AI output must be parsed and validated (Zod).
- Output format: JSON Patch operations OR full FormDefinition (choose one and document it).
- No direct execution of AI output; apply via controlled patcher.
- If validation fails, return a user-friendly error and do NOT modify form.

Prompting:
- Provide the current FormDefinition to the model.
- Instruct it to only use allowed field types and allowed options.
- Force strict JSON output (no markdown).
