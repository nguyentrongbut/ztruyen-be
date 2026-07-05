# Development Guide

This guide provides instructions for setting up and running the **Ztruyện Backend** development environment locally.

---

## Prerequisites

Ensure you have the following software installed:
- **Node.js**: Version 18.x or higher (recommended to align with NestJS 9 and TypeScript compiler configuration)
- **NPM**: Standard package manager bundled with Node.js
- **MongoDB**: A running instance of MongoDB (either locally via community edition or remote using MongoDB Atlas)
- **External Accounts** (Optional, based on features you want to test):
  - Resend account for email delivery
  - OAuth Applications on Google, Facebook, and Discord for social logins
  - Telegram Bot & Chat ID for media uploading
  - Firebase Project for Cloud Messaging (FCM) notifications

---

## Getting Started

### 1. Clone the repository and install dependencies

Run the following command in your terminal to install the necessary node modules:
```bash
npm install
```

### 2. Environment Variables Configuration

Copy the example configuration file to create your own local `.env` file:
```bash
cp .env.example .env
```

Open the newly created `.env` file and populate the variables with your values:

```env
PORT=4000
MONGO_URL=mongodb://localhost:27017/ztruyen

# CORS Origins
FE_CLIENT_URL=http://localhost:3000
FE_ADMIN_URL=http://localhost:3001
BACKEND_URL=http://localhost:4000

# JWT Secrets & Expiry (ms format or string)
JWT_ACCESS_TOKEN=your_access_token_secret
JWT_ACCESS_TOKEN_EXPIRE=3600s
JWT_REFRESH_TOKEN=your_refresh_token_secret
JWT_REFRESH_TOKEN_EXPIRE=7d
EMAIL_RESET_PASSWORD_EXPIRE=15m

# Resend Mailer
RESEND_API_KEY=re_your_api_key
RESEND_FROM_EMAIL=onboarding@resend.dev

# Social Login Client IDs & Secrets
GOOGLE_CLIENT_ID=google_client_id
GOOGLE_CLIENT_SECRET=google_secret
GOOGLE_CALLBACK_URL=http://localhost:4000/api/v1/auth/google/callback

FACEBOOK_CLIENT_ID=facebook_id
FACEBOOK_CLIENT_SECRET=facebook_secret
FACEBOOK_CALLBACK_URL=http://localhost:4000/api/v1/auth/facebook/callback

DISCORD_CLIENT_ID=discord_id
DISCORD_CLIENT_SECRET=discord_secret
DISCORD_CALLBACK_URL=http://localhost:4000/api/v1/auth/discord/callback

# Firebase Admin SDK credentials
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Telegram Bot configuration for image upload hosting
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id
```

> [!IMPORTANT]
> The `FIREBASE_PRIVATE_KEY` must retain the escaped newline characters (`\n`) so that it can be correctly processed by the backend.

---

## CLI Command Scripts

Below are the development scripts defined in `package.json`:

| Command | Description |
| :--- | :--- |
| `npm run start` | Boots up the compiled NestJS server. |
| `npm run start:dev` | Launches the NestJS compiler in watch mode for local development. |
| `npm run start:debug` | Launches the local server in watch mode with a debugging port opened. |
| `npm run build` | Compiles the TypeScript code into JavaScript under `dist/` and copies email templates. |
| `npm run start:prod` | Runs the compiled server from the distribution directory. |
| `npm run lint` | Runs ESLint and automatically fixes formatting issues. |
| `npm run test` | Executes unit tests via Jest. |
| `npm run test:watch` | Runs Jest tests in interactive watch mode. |
| `npm run test:cov` | Generates Jest code coverage reports. |
| `npm run test:e2e` | Runs end-to-end integration tests. |

---

## Local Development Flow

To start developing features locally:

1. Run the local database: `mongod` (or ensure your remote instance is accessible).
2. Start the hot-reload server:
   ```bash
   npm run start:dev
   ```
3. Access the APIs at `http://localhost:4000/api/v1`.
4. Access the Swagger documentation portal at `http://localhost:4000/api/docs`.

---

## Testing Guidelines

Tests are configured using **Jest**. 
- Unit tests are placed alongside source files with the suffix `*.spec.ts`.
- Integration (E2E) tests are configured in the `test/` directory.

To run tests before committing code:
```bash
npm run test
npm run lint
```
