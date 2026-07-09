# ztruyen-be - Project Overview

**Date:** 2026-07-09T10:20:00+07:00
**Type:** Backend (API Server)
**Architecture:** NestJS MVC / Module-based Dependency Injection

---

## Executive Summary

**Ztruyện Backend** acts as the core API service engine that powers the **Ztruyện** online comic manga-reading platform. Built with **NestJS 9**, **TypeScript**, and **MongoDB** (with Mongoose ODM), it hosts the business logic, OAuth2 social and local login authentications, comment sections, notification managers, image pipelines, and admin CRUD panels.

---

## Project Classification

- **Repository Type:** Monolith (Single cohesive repository)
- **Project Type(s):** Backend (API Server)
- **Primary Language(s):** TypeScript / Node.js
- **Architecture Pattern:** NestJS Modular dependency injection (Controller-Service-Model)

---

## Technology Stack Summary

| Category | Technology | Version | Description |
| :--- | :--- | :--- | :--- |
| **Framework** | NestJS | 9.4.0 | Modular enterprise-ready Node.js server framework |
| **Language** | TypeScript | 4.9.5 | Strongly typed language compiling to JavaScript |
| **Database** | MongoDB | - | NoSQL document storage database |
| **ODM** | Mongoose | 7.1.0 | Object Data Modeling (ODM) library for MongoDB |
| **Authentication** | Passport | 0.6.0 | Authentication middleware supporting social and local strategies |
| **Security** | Turnstile / JWT | - | Cloudflare anti-bot turnstile verification and JWT tokens |
| **Mail Delivery** | Resend / Nodemailer | 6.6.0 | Modern transactional mailing platform with Pug engines |
| **File Upload** | Telegram Bot API | - | Multi-file streams uploaded via custom bot buffers to Telegram channels |
| **Image processing**| Sharp | 0.34.4 | High-performance Node.js image compression |
| **Push Alerts** | Firebase Admin SDK | 13.7.0 | Cloud Messaging (FCM) alerts dispatch engine |
| **Testing** | Jest | 29.5.0 | Testing framework for unit and integration testing |

---

## Key Features

1. **Robust Authentication:** Social OAuth integrations (Google, Facebook, Discord) and credentials login. Session security is enforced with JWT Access tokens and secure HTTP-Only cookie Refresh tokens.
2. **Cloudflare Turnstile Guard:** Integrates Cloudflare Turnstile token verification on login, registration, and forgot-password operations to mitigate malicious bots.
3. **Interactive Commenting Engine:** Supports comment writing, liked comment counters, replies thread resolution, comment flagging, and administrative dashboards.
4. **Excel Import/Export Pipeline:** Enables administrators to import and export user rosters from/to Excel spreadsheets (`.xlsx`) using ExcelJS and sheet parsing tools.
5. **Referer-Shielded Image Loader:** Restricts static image loads to requests originating from allowed CORS sites (`FE_CLIENT_URL`, `FE_ADMIN_URL`, `BACKEND_URL`).
6. **Push Alerts System:** Dispatches notification signals using Firebase Admin SDK to user client devices on comments activity.
7. **TTL-indexed Alerts Log:** Clears user notification records automatically after 30 days via a MongoDB expire index.
8. **Admin Dashboard Telemetry:** Exposes telemetry endpoints retrieving registration growth overview, registrations counts graphs grouped by day/month/year, age demographics distribution, and top favorited genres/comics.

---

## Architecture Highlights

- **Separation of Concerns:** Each domain context (e.g., users, comments, auth) is isolated into a self-contained module containing controllers, services, DTO validation schemes, and Mongoose tables.
- **Unified Interceptor Pipeline:** Employs global NestJS response interceptors to guarantee that all API endpoints output a standardized, predictable wrapper payload shape.
- **DTO validation:** Hooks NestJS `ValidationPipe` globally to filter, validate, and serialize incoming request payloads before they reach business logic components.

---

## Development Overview

### Prerequisites
- Node.js (version 18.x or higher)
- NPM
- Running MongoDB instance

### Getting Started Summary
1. Clone the repository and install dependencies: `npm install`
2. Create your `.env` configuration file from `.env.example`
3. Launch local watch compilation: `npm run start:dev`

### Key Commands
- **Install:** `npm install`
- **Dev:** `npm run start:dev`
- **Build:** `npm run build`
- **Test:** `npm run test`

---

## Repository Structure

The main codebase is contained under the `src/` directory. All subfolders represent a functional NestJS module:
- `src/auth/` — Handles credentials login, OAuth callbacks, and JWT tokens.
- `src/users/` — User management, profile configs, and Excel scripts.
- `src/comics/` — Comic listings, ratings, and bulk data loaders.
- `src/comments/` — Comment, like, and flag schemas and controllers.
- `src/dashboard-statistics/` — Telemetry statistics module for administrator dashboards.
- `src/notifications/` — Log of notice events with TTL expiry.
- `src/upload-telegram/` — Image uploads pipeline using Telegram bots.
- `src/email/` — Reset passwords emailing.

---

## Documentation Map

For detailed information, see:

- [index.md](./index.md) - Master documentation index
- [architecture.md](./architecture.md) - Detailed architecture
- [source-tree-analysis.md](./source-tree-analysis.md) - Directory structure
- [development-guide.md](./development-guide.md) - Development workflow
- [deployment-guide.md](./deployment-guide.md) - Deployments and CI/CD pipelines
- [api-contracts-backend.md](./api-contracts-backend.md) - API endpoints contract mapping
- [data-models-backend.md](./data-models-backend.md) - Database collections schema mapping

---

_Generated using BMAD Method `document-project` workflow_
