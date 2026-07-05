# API Contracts (Backend)

This document catalogs the REST API endpoints provided by **Ztruyện Backend**. 

## Global Prefix & Versioning

All API endpoints are versioned and share a common prefix:
```
/api/v1
```

For instance, the login endpoint is accessed at: `POST http://localhost:4000/api/v1/auth/login`

## Authentication & Authorization

- **Global Guard:** Most endpoints are protected globally by a `JwtAuthGuard` unless decorated with `@Public()`.
- **RBAC (Role-Based Access Control):** Admin-only endpoints are guarded by a `RolesGuard` and require the `@Roles(RoleType.ADMIN)` decorator.
- **Access Token:** Passed in the `Authorization` header as a Bearer token: `Authorization: Bearer <access-token>`.
- **Refresh Token:** Stored in an HTTP-only, secure, `sameSite: 'none'` cookie named `ZTC_token`.

---

## Endpoint Catalog

### 1. Authentication (`/api/v1/auth`)

Endpoints for registration, login, social authentication login callbacks, token refreshing, and password recovery.

| Method | Path | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | Public | Log in with credentials and Cloudflare Turnstile token (`cfToken`). Sets `ZTC_token` cookie. |
| `POST` | `/auth/register` | Public | Register a new user account (requires `cfToken` verification). |
| `GET` | `/auth/refresh` | Public | Request a new Access Token using the `ZTC_token` cookie. |
| `POST` | `/auth/logout` | User | Terminate session and clear `ZTC_token` cookie. |
| `POST` | `/auth/forgot-password` | Public | Request a password reset link email (requires `cfToken` verification). |
| `POST` | `/auth/reset-password` | Public | Reset password using a valid token sent via email. |
| `GET` | `/auth/google` | Public | Initiates Google OAuth2 login flow. |
| `GET` | `/auth/google/callback`| Public (OAuth) | Google OAuth callback handler. Redirects to client. |
| `GET` | `/auth/facebook` | Public | Initiates Facebook OAuth login flow. |
| `GET` | `/auth/facebook/callback`| Public (OAuth) | Facebook OAuth callback handler. Redirects to client. |
| `GET` | `/auth/discord` | Public | Initiates Discord OAuth login flow. |
| `GET` | `/auth/discord/callback`| Public (OAuth) | Discord OAuth callback handler. Redirects to client. |

---

### 2. User Management (`/api/v1/user`)

Endpoints for users to manage their profiles, and for administrators to perform CRUD operations, import/export Excel files, and handle FCM tokens.

| Method | Path | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/user/profile` | User | Get current logged-in user profile details. |
| `PATCH`| `/user/profile` | User | Update own profile info (name, bio, cover, avatar, age, gender, birthday). |
| `DELETE`| `/user/profile` | User | Self-delete account (clears cookie). |
| `PATCH`| `/user/change-password` | User | Change account password. |
| `POST` | `/user/fcm-token` | User | Register a new FCM device token. |
| `PATCH`| `/user/fcm-token/remove` | User | Unregister/remove an FCM device token. |
| `POST` | `/user/fcm-token/subscribe-topic` | User | Subscribe device token to an FCM topic. |
| `POST` | `/user/fcm-token/unsubscribe-topic`| User | Unsubscribe device token from an FCM topic. |
| `POST` | `/user` | Admin | Create a new user account. |
| `GET` | `/user` | Admin | Query users list (supports dynamic filters, sorting, and pagination). |
| `GET` | `/user/detail/:id` | Admin | View detailed information of a specific user. |
| `PATCH`| `/user/update/:id` | Admin | Update details of a user account. |
| `PATCH`| `/user/frame/:id` | Admin | Equip/update a user's avatar frame. |
| `PATCH`| `/user/change-password/:id` | Admin | Force update a user's password. |
| `DELETE`| `/user/delete/:id` | Admin | Soft-delete a user. |
| `DELETE`| `/user/delete-multi` | Admin | Soft-delete multiple users. |
| `GET` | `/user/trash` | Admin | List all soft-deleted users. |
| `GET` | `/user/trash/:id` | Admin | View details of a soft-deleted user. |
| `DELETE`| `/user/trash/delete/:id` | Admin | Hard-delete a user permanently. |
| `DELETE`| `/user/trash/delete-multi` | Admin | Hard-delete multiple users permanently. |
| `PATCH`| `/user/restore/:id` | Admin | Restore a soft-deleted user. |
| `PATCH`| `/user/restore-multi` | Admin | Restore multiple soft-deleted users. |
| `GET` | `/user/export` | Admin | Export queried user list into an Excel `.xlsx` sheet. |
| `POST` | `/user/import` | Admin | Import user list from an Excel spreadsheet. |
| `GET` | `/user/template` | Admin | Download import Excel template. |

---

### 3. Comics (`/api/v1/comic`)

Endpoints to fetch comics public lists/rankings and administrator CRUD controls.

| Method | Path | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/comic` | Public | List and search comics (supports pagination and queries). |
| `GET` | `/comic/admin` | Admin | List all comics with administrative fields. |
| `GET` | `/comic/admin/:id` | Admin | View detailed comic metadata. |
| `POST` | `/comic/admin` | Admin | Create a new comic. |
| `PATCH`| `/comic/admin/:id` | Admin | Update comic metadata. |
| `DELETE`| `/comic/admin/:id` | Admin | Delete a comic. |
| `DELETE`| `/comic/admin/delete-multi` | Admin | Delete multiple comics. |
| `POST` | `/comic/admin/import` | Admin | Import/bulk-create multiple comics via a JSON array payload. |

---

### 4. Favorites (`/api/v1/favorite`)

Endpoints for users to bookmark and manage their favorite comics.

| Method | Path | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/favorite/toggle` | User | Toggle (bookmark/unbookmark) a comic. |
| `GET` | `/favorite` | User | List current user's favorite comics (supports query filters). |
| `GET` | `/favorite/check/:slug` | User | Check if a comic is favorited by the current user. |
| `DELETE`| `/favorite/delete/:id` | User | Remove a specific favorite entry. |
| `DELETE`| `/favorite/delete-multi` | User | Bulk-remove favorite entries. |

---

### 5. Comments (`/api/v1/comment`)

Endpoints for creating, reading, liking, reporting, and managing comments and replies.

| Method | Path | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/comment` | Public | List comments filtered by `comicSlug`, `chapterId` or `userId`. |
| `POST` | `/comment` | User | Post a new top-level comment. |
| `POST` | `/comment/reply` | User | Post a reply comment. |
| `POST` | `/comment/like` | User | Like or unlike a comment. |
| `POST` | `/comment/report` | User | Report a comment for moderation review. |
| `GET` | `/comment/replies/:id` | Public | Fetch nested replies under a parent comment. |
| `GET` | `/comment/page-of-reply/:replyId`| Public | Fetch which page index a nested reply appears on. |
| `GET` | `/comment/:id` | Public/User | View comment detail. |
| `DELETE`| `/comment/:id` | User | Delete own comment. |
| `GET` | `/comment/admin` | Admin | Admin list and audit all comments. |
| `DELETE`| `/comment/admin/:id` | Admin | Admin hard-delete a comment. |
| `DELETE`| `/comment/admin/delete-multi` | Admin | Admin bulk-delete comments. |
| `GET` | `/comment/admin/reports` | Admin | List moderation reports (status: pending, resolved, rejected). |
| `PATCH`| `/comment/admin/reports/:id/resolve`| Admin | Resolve a comment moderation report. |

---

### 6. Emoji Picker (`/api/v1/emoji` & `/api/v1/emoji-category`)

Endpoints for retrieving emojis, organizing them by categories, and managing them.

| Method | Path | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/emoji` | User | Fetch emojis list for picker. |
| `GET` | `/emoji/admin` | Admin | Fetch all emojis including deactivated ones. |
| `GET` | `/emoji/admin/:id` | Admin | View detailed emoji metadata. |
| `POST` | `/emoji/admin` | Admin | Create a new emoji. |
| `PATCH`| `/emoji/admin/:id` | Admin | Update emoji properties. |
| `PATCH`| `/emoji/admin/:id/toggle` | Admin | Toggle emoji `isActive` flag. |
| `DELETE`| `/emoji/admin/:id` | Admin | Delete an emoji. |
| `DELETE`| `/emoji/admin/delete-multi` | Admin | Bulk-delete emojis. |
| `GET` | `/emoji-category` | User | Fetch active categories for the picker component. |
| `GET` | `/emoji-category/admin` | Admin | Fetch all emoji categories. |
| `POST` | `/emoji-category/admin` | Admin | Create a new emoji category. |
| `GET` | `/emoji-category/admin/:id` | Admin | View detailed emoji category. |
| `PATCH`| `/emoji-category/admin/:id` | Admin | Update emoji category properties. |
| `PATCH`| `/emoji-category/admin/:id/toggle`| Admin | Toggle emoji category `isActive` flag. |
| `PATCH`| `/emoji-category/admin/reorder` | Admin | Adjust display order coordinates for categories. |
| `DELETE`| `/emoji-category/admin/:id` | Admin | Delete a category (only possible if no emojis remain in it). |

---

### 7. Avatar Frames (`/api/v1/frame`)

Endpoints for creating and retrieving cosmetic avatar border frames.

| Method | Path | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/frame` | User | List all active avatar frames. |
| `POST` | `/frame` | Admin | Create a new avatar frame. |
| `GET` | `/frame/detail/:id` | Admin | Get avatar frame details. |
| `PATCH`| `/frame/:id` | Admin | Update avatar frame info. |
| `DELETE`| `/frame/delete/:id` | Admin | Delete an avatar frame. |
| `DELETE`| `/frame/delete-multi` | Admin | Bulk-delete avatar frames. |

---

### 8. Notifications (`/api/v1/notification`)

Personal inbox alerts for logged-in users.

| Method | Path | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/notification` | User | Fetch recipient notifications by recency. |
| `PATCH`| `/notification/read-all` | User | Mark all notifications as read. |
| `PATCH`| `/notification/:id` | User | Mark a notification as read. |
| `DELETE`| `/notification/all` | User | Delete all personal notifications. |
| `DELETE`| `/notification/:id` | User | Delete a single notification. |

---

### 9. System Announcements (`/api/v1/announcement`)

Global broadcast alerts.

| Method | Path | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/announcement/active` | Public | Retrieve the active announcement, if any. |
| `POST` | `/announcement` | Admin | Create a global announcement. |
| `GET` | `/announcement` | Admin | Fetch all announcements (pagination/search support). |
| `GET` | `/announcement/:id` | Admin | View details of an announcement. |
| `PATCH`| `/announcement/:id` | Admin | Update announcement details. |
| `PATCH`| `/announcement/:id/toggle` | Admin | Toggle announcement `isActive` flag. |
| `DELETE`| `/announcement/:id` | Admin | Delete an announcement. |
| `DELETE`| `/announcement` | Admin | Bulk-delete announcements. |

---

### 10. Images & Uploads (`/api/v1/image` & `/api/v1/upload`)

Static image resolving and file uploading.

| Method | Path | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/image/:slug` | Public (Referer) | Returns the image asset stream. Access restricted via Referer validation headers (`FE_CLIENT_URL`, `FE_ADMIN_URL`, `BACKEND_URL`). |
| `POST` | `/upload` | User | Upload a single image (limits file size to 2MB). Uploads file via Telegram Bot channel. |
| `POST` | `/upload/upload-multiple` | User | Upload up to 10 images simultaneously (limits total size to 50MB). |
