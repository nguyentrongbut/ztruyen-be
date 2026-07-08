---
name: git-create-branch
description: Creates a new git branch following the project's naming convention (feature/<JIRA-ID>, fix/<JIRA-ID>, etc). Trigger when the user asks to "tạo branch", "create branch", "checkout branch mới", or gives a Jira ticket ID and asks to start work on it.
---

## Steps

### 1. Extract inputs
- Get the JIRA ticket ID from the user's message (e.g. ZTRUYEN-3).
- Determine the branch type from context or ask if unclear: feature, fix, chore, refactor.
  - Default to `feature` if the user doesn't specify and the ticket looks like new functionality.

### 1b. (Optional, if Jira MCP available) Validate ticket ID
- Use Jira MCP to verify the ticket ID exists and is not already Done/Closed
- If Jira MCP is not connected, skip this check and proceed with the ID as given

### 2. Confirm branch name
- Build branch name as: `<type>/<JIRA-ID>` (e.g. `feature/ZTRUYEN-3`)
- Do NOT append extra description after the ticket ID.
- Show the proposed branch name to the user and wait for confirmation before creating it.

### 3. Determine base branch
- Default base branch: `dev`
- If the type is `fix` and the user indicates it's a hotfix, use `main` instead.
- Ask if ambiguous.

### 4. Create the branch
- Ensure the base branch is up to date first: `git checkout <base> && git pull`
- Create and switch to the new branch: `git checkout -b <type>/<JIRA-ID>`
- If GitHub MCP is connected and the user wants it pushed immediately, push with: `git push -u origin <type>/<JIRA-ID>`
  - Otherwise, leave it local until the first commit is ready.

### 5. Report result
- Confirm the branch was created and which base branch it came from.
- Do not proceed to committing code unless separately instructed.