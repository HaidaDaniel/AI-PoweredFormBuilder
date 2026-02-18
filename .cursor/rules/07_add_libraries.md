# Rule: Use latest library versions by default (verify online)

## Goal
Always prefer the newest stable (latest) versions of libraries, frameworks, and tools, unless the project explicitly pins versions.

## Requirements
- When adding any dependency (npm/pnpm/yarn), use the latest stable release by default.
- Before choosing a version, ALWAYS verify the current latest version online:
  - Check official docs or the package registry (npmjs.com) and/or GitHub releases/tags.
  - Prefer sources in this order: official docs → npm registry → GitHub releases.
- If the project already pins versions (package.json/lockfile), do not upgrade silently.
  - Instead: propose an upgrade plan and list breaking-change risks.
- Avoid outdated tutorials/versions:
  - If you see a guide using older major versions, search for the current equivalent approach for the latest major.
- When you propose installing packages, include the exact install command using the package manager detected in the repo (prefer the one already used).
- For major version bumps, quickly scan release notes / migration guide and call out any required code changes.

## Output format (when dependencies are involved)
- "Chosen versions" section with exact versions and where they were verified (e.g., npm page / GitHub release).
- "Install commands" section.
- "Breaking changes" section (only if major bump or migration is needed).

## Allowed exceptions
- Security/compatibility constraints (Node version, framework constraints).
- Explicit project requirement to stay on a specific major version.
- Known ecosystem issues (if latest is broken, choose latest stable previous and explain why).

## Default assumptions
- Node: latest LTS unless repo specifies otherwise.
- TypeScript: latest stable.
- React/Next/Remix/React Router: latest stable that matches the repo framework.

## Do not
- Do not invent version numbers.
- Do not assume "latest" without checking online.
- Do not upgrade half the stack without a clear reason and migration notes.
