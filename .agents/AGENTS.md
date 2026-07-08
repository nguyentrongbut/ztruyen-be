# Project Rules

## Git Commit & Pull Request Rules

### Commit Message

- Follow Conventional Commits format: `<type>(<scope>): <description>`
- Allowed types: feat, fix, refactor, chore, docs, style, test, perf
- Description in lowercase, no period at the end, imperative mood (e.g. "add", not "added")
- Include Jira ticket ID at the start of description when applicable:
  `feat(account-menu): ZTRUYEN-3 sync dropdown avatar sidebar/header`
- Body (optional, only for non-trivial changes): explain WHY, not WHAT
- Never commit directly to `main`/`dev` — always via feature branch + PR
- Never include secrets, API keys, or .env files in a commit
- Run lint/typecheck before committing; do not commit code that fails these checks

### Branch Naming

- Format: `<type>/<JIRA-ID>`
- Example: `feature/ZTRUYEN-3`
- Types: feature, fix, chore, refactor
- Do not append extra description after the ticket ID — ticket details live in Jira, not in the branch name

### Pull Request

- Title format: `[<JIRA-ID>] <short description>`
  Example: `[ZTRUYEN-3] Sync account dropdown between sidebar and header`
- If Jira MCP is connected, fetch ticket summary/description automatically to fill the "Why" section and include a real Jira link; otherwise ask the user for this info.
- PR description must include:
  1. **What** — summary of the change
  2. **Why** — link to Jira ticket / reason
  3. **How to test** — steps to verify manually
  4. **Screenshots/recordings** — for any UI change
- Target branch: always `dev` unless hotfix (then `main`)
- Do not open a PR with failing CI checks
- Keep PR scope limited to one story/ticket — do not bundle unrelated changes
- Request review from at least 1 reviewer before merge
- Squash merge only, commit message on merge = PR title

### Agent Behavior

- Before committing, show the diff summary and proposed commit message for user confirmation — do not auto-commit without approval
- Before opening a PR, show the proposed PR title + description for user confirmation
- Never force-push to shared branches (`main`, `dev`) under any circumstance
- If GitHub MCP and/or Jira MCP are connected, use them to create branch, commit, push, open PR, and fetch ticket details — but always pause for confirmation before push and PR creation steps

> These rules are enforced by the `git-create-branch`, `git-commit`, and `git-create-pr` skills.

---
