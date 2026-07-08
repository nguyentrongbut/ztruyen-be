---
name: git-commit
description: Stages changes and creates a git commit following Conventional Commits format with Jira ticket reference. Trigger when the user asks to "commit", "commit code", "commit thay đổi này", or similar.
---

## Steps

### 1. Review changes
- Run `git status` and `git diff` to see staged/unstaged changes.
- Summarize what changed in plain language before proposing a commit message.

### 1b. (Optional, if Jira MCP available) Validate ticket ID
- Use Jira MCP to verify the ticket ID exists and is not already Done/Closed
- If Jira MCP is not connected, skip this check and proceed with the ID as given

### 2. Determine commit type and scope
- type: feat, fix, refactor, chore, docs, style, test, perf — infer from the diff content.
- scope: short identifier of the affected area (e.g. account-menu, auth, api).

### 3. Build commit message
- Format: `<type>(<scope>): <JIRA-ID> <description>`
- Description: lowercase, imperative mood, no trailing period.
- Example: `feat(account-menu): ZTRUYEN-3 sync dropdown avatar sidebar/header`
- If the JIRA ID isn't in the current branch name or conversation, ask the user for it before finalizing.
- Add a body only for non-trivial changes, explaining WHY not WHAT.

### 4. Pre-commit checks
- Run lint and typecheck if configured in the project (check package.json scripts or equivalent).
- If checks fail, stop and report the failure — do not commit broken code.
- Confirm no secrets, .env files, or credentials are being staged.

### 5. Confirm before committing
- Show the exact commit message to the user.
- Wait for explicit confirmation before running `git commit`.
- Never commit directly to `main` or `dev` — verify current branch first; if on a shared branch, warn the user and stop.

### 6. After commit
- Report the commit hash and message.
- Ask if the user wants to push now, or wait until more commits are ready.