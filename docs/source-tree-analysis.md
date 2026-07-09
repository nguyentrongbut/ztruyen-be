# ztruyen-be - Source Tree Analysis

**Date:** 2026-07-05T15:02:00+07:00

## Overview

The **ztruyen-be** project is structured as a standard NestJS backend application. It features a module-based architecture where each feature folder encapsulates its own controllers, services, DTOs, and database schemas. The project is implemented in TypeScript and compiles into a Node.js runtime.

---

## Complete Directory Structure

```text
ztruyen-be/
├── .github/                 # GitHub configuration directory
│   └── workflows/           # CI/CD deployment pipelines
├── _bmad/                   # BMad internal configurations and scripts
├── _bmad-output/            # Target output folder for BMad-generated artifacts
├── docs/                    # System documentation and scan reports
├── src/                     # Core NestJS application source directory
│   ├── announcements/       # Global system announcements module
│   ├── auth/                # Authentication, Passport strategies, and guards
│   ├── comics/              # Comic catalog, manga metadata, and importer module
│   ├── comments/            # Commenting engine, nested replies, and moderation module
│   ├── configs/             # Application-wide constants, enums, and messages
│   ├── core/                # Global interceptors, sanitizers, and pipes
│   ├── dashboard-statistics/# Admin dashboard statistics telemetry module
│   ├── decorator/           # Custom decorators (e.g. @Public, @User, @Roles)
│   ├── email/               # Resend mail utility and Pug templates
│   ├── emoji-categories/    # Category groupings for emojis
│   ├── emojis/              # Sticker and emoticon assets catalog module
│   ├── favorites/           # Comic bookmarking and reading progression module
│   ├── firebase/            # Firebase Admin SDK & Push notification modules
│   ├── frames/              # Profile avatar frames customization module
│   ├── guards/              # Role-based guards and middleware
│   ├── guides/              # User guidelines documentation module
│   ├── images/              # Local image resolving and referrer protection module
│   ├── notifications/       # User notification logs with Mongo TTL cleanup
│   ├── upload-telegram/     # File uploading pipeline via Telegram Bot API
│   ├── users/               # User accounts CRUD, profile management, and Excel import/export
│   ├── utils/               # Common helper utilities
│   ├── app.controller.ts    # Main app controller
│   ├── app.module.ts        # App root module wiring all modules together
│   ├── app.service.ts       # App service layer
│   └── main.ts              # Application bootstrap entry point
├── tsconfig.json            # TypeScript configuration
├── package.json             # NPM project manifest
└── README.md                # General readme introduction
```

---

## Critical Directories

### `src/`

Root directory containing the application codebase.

- **Purpose:** Houses all logic, routing, and database integrations.
- **Contains:** Controllers, services, schemas, decorators, modules, and bootstrap files.
- **Entry Points:** `main.ts`

### `src/auth/`

Encapsulates authentication, OAuth2 callbacks, validation guards, and security strategies.

- **Purpose:** Handles user authentication, token generation, Passport strategies, and Turnstile validations.
- **Contains:** Facebook, Google, Discord, Local, and JWT Passport strategies; security decorators and auth guards.

### `src/users/`

Deals with user profiles, admin-level accounts CRUD, role modifications, and importing/exporting Excel files.

- **Purpose:** User account operations and bulk import/export pipelines.
- **Contains:** User schemas, dtos, import templates, ExcelJS scripts, and user controllers/services.

### `src/comics/`

Comic manga metadata storage, public catalog routes, and JSON bulk import tools.

- **Purpose:** Serves information about comics and handles administrative updates/imports.
- **Contains:** Comic Mongoose schema, data transfer objects, controllers, and bulk ingestion utilities.

### `src/comments/`

The commenting platform. Supports replies, nesting, reports, likes, and moderator logs.

- **Purpose:** Handles user interaction comment flows, moderation reports, and likes.
- **Contains:** Comment, comment-like, and comment-report schemas; moderation services.

### `src/dashboard-statistics/`

Admin dashboard telemetry module for retrieving metrics, registration stats, age demographics, and top favorites.

- **Purpose:** Business analytics and administrator dashboards data provider.
- **Contains:** Dashboard statistics controller, service, test suites, and query transfer objects (DTOs).

### `src/notifications/`

Stores recipient alert logs for user interactions (likes, replies). Includes a TTL (Time-To-Live) index to automatically clear notices after 30 days.

- **Purpose:** Personal user notice logs.
- **Contains:** Notification schema, SSE alerts (if present), and push notifications triggers.

### `src/upload-telegram/`

An upload controller that routes file buffers to a Telegram Bot channel to bypass expensive hosting.

- **Purpose:** Asset uploads and file hosting.
- **Contains:** Upload handler and Telegram buffer transmitter service.

---

## Entry Points

- **Main Entry:** `src/main.ts`
  - **Bootstrap:** Initializes NestJS app platform with Express adapter, configures global prefixes (`/api`), enables URI versioning (`/v1`), hooks up cookie parsing middleware, binds global CORS options with credentials, sets up `ValidationPipe` for automatic DTO serialization, and configures Swagger API docs.

---

## File Organization Patterns

Inside each NestJS module in `src/<module-name>/`, files follow a consistent structural pattern:
- **Module definition:** `<name>.module.ts` (wires controllers, services, database schemas, and dependencies).
- **Controllers:** `<name>.controller.ts` (exposes API endpoints, HTTP verbs, paths, Swagger docs, role guards).
- **Services:** `<name>.service.ts` (contains business logic, database queries, exceptions).
- **Schemas:** `schemas/<name>.schema.ts` (declares Mongoose database structures, indexes, pre-save hooks).
- **DTOs:** `dto/create-<name>.dto.ts` and `dto/update-<name>.dto.ts` (validates API incoming payloads).

---

## Key File Types

### NestJS Controllers

- **Pattern:** `*.controller.ts`
- **Purpose:** HTTP request handling and route decoration.
- **Examples:** `src/auth/auth.controller.ts`, `src/comics/comics.controller.ts`

### NestJS Services

- **Pattern:** `*.service.ts`
- **Purpose:** Core business logic and database interactions.
- **Examples:** `src/users/users.service.ts`, `src/comments/comments.service.ts`

### Mongoose Schemas

- **Pattern:** `*.schema.ts` or `*.schemas.ts`
- **Purpose:** Database collections definitions and validation rules.
- **Examples:** `src/users/schemas/user.schema.ts`, `src/comics/schemas/comic.schemas.ts`

---

## Asset Locations

No significant local assets are stored inside the repository since all image files are offloaded to Telegram chat channels (via the `upload-telegram` module) or stored externally. Public routes exist to stream referrer-restricted assets.

---

## Configuration Files

- **`.env` / `.env.example`**: Project environment variables (port, database URLs, JWT keys, Resend tokens, Social login keys, Firebase and Telegram bot tokens).
- **`nest-cli.json`**: NestJS CLI build and project configuration.
- **`tsconfig.json` / `tsconfig.build.json`**: TypeScript compiler compiler settings.
- **`eslint.config.mjs`**: Code styling linter configurations.
- **`package.json`**: Node dependencies, scripts, build steps, and version manifests.

---

## Notes for Development

1. **Email Template Build Hook:** When running `npm run build`, NestJS builds the JS output and then executes a postbuild `copy-templates` script to copy email Pug template structures from `src/email/templates` directly into `dist/email/templates`.
2. **Referer Restriction:** Assets streamed via `/api/v1/image/:slug` perform strict referer matching. If the request does not originate from `FE_CLIENT_URL`, `FE_ADMIN_URL`, or `BACKEND_URL`, access is rejected with `403 Forbidden`.
3. **FCM Private Key:** The Firebase private key loaded in `.env` must keep newline-escaped characters (`\\n`) intact. The code parses this format back to actual newlines before calling `admin.initializeApp()`.

---

_Generated using BMAD Method `document-project` workflow_
