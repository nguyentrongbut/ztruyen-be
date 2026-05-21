# Ztruyện Backend

<div align="center">
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB">
  <img src="https://img.shields.io/badge/Mongoose-880000?style=for-the-badge&logo=mongoose&logoColor=white" alt="Mongoose">
  <img src="https://img.shields.io/badge/Passport-34E27A?style=for-the-badge&logo=passport&logoColor=000000" alt="Passport">
  <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=000000" alt="Firebase">
  <img src="https://img.shields.io/badge/Swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=000000" alt="Swagger">
</div>

## 🚀 Giới thiệu

**Ztruyện Backend** là API server cho nền tảng đọc truyện tranh online **Ztruyện**, được xây dựng bằng **NestJS**, **TypeScript**, **MongoDB** và **Mongoose**.

Dự án cung cấp hệ thống API cho frontend người dùng và trang quản trị, bao gồm xác thực tài khoản, đăng nhập mạng xã hội, quản lý người dùng, truyện, bình luận, yêu thích, khung avatar, emoji, thông báo, popup thông báo, upload ảnh, gửi email đặt lại mật khẩu và Firebase Cloud Messaging.

Frontend repository: [ztruyen-v1.1.0](https://github.com/Cloly1941/ztruyen-v1.1.0)

Frontend admin repository: [ztruyen-admin](https://github.com/Cloly1941/ztruyen-admin)

---

## ✨ Tính năng chính

- Xác thực người dùng bằng JWT access token và refresh token lưu qua cookie HTTP-only.
- Đăng ký, đăng nhập, đăng xuất, refresh token, quên mật khẩu và đặt lại mật khẩu.
- Đăng nhập mạng xã hội với Google, Facebook và Discord qua Passport strategy.
- Xác minh Cloudflare Turnstile cho luồng đăng nhập, đăng ký và quên mật khẩu.
- Quản lý người dùng cho admin: tạo, cập nhật, xoá mềm, khôi phục, xoá vĩnh viễn, import/export Excel và tải template import.
- Quản lý hồ sơ người dùng: thông tin cá nhân, đổi mật khẩu, xoá tài khoản, avatar frame và FCM token.
- Quản lý truyện/BXH truyện: danh sách public, CRUD admin, xoá nhiều và import nhiều truyện từ JSON.
- Quản lý yêu thích và tiến độ đọc truyện.
- Bình luận, phản hồi bình luận, like/unlike, báo cáo bình luận và quản trị report.
- Quản lý emoji và danh mục emoji cho emoji picker.
- Quản lý khung avatar, popup thông báo và thông báo người dùng.
- Gửi push notification qua Firebase Admin SDK cho web, Android và iOS/APNs.
- Upload ảnh lên Telegram và xử lý ảnh qua `sharp`.
- Phục vụ ảnh qua endpoint backend và cấu hình CORS theo frontend/client admin.
- Chuẩn hoá response bằng interceptor global và validate DTO bằng `ValidationPipe`.
- Tài liệu API tự động bằng Swagger tại `/api/docs`.

---

## 🛠️ Tech Stack

- [NestJS 9](https://nestjs.com/) – Framework Node.js để xây dựng API backend có cấu trúc module rõ ràng.
- [TypeScript](https://www.typescriptlang.org/) – Static typing giúp code an toàn và dễ bảo trì hơn.
- [MongoDB](https://www.mongodb.com/) – Database NoSQL lưu trữ dữ liệu người dùng, truyện, bình luận và thông báo.
- [Mongoose](https://mongoosejs.com/) – ODM cho MongoDB.
- [soft-delete-plugin-mongoose](https://www.npmjs.com/package/soft-delete-plugin-mongoose) – Hỗ trợ xoá mềm dữ liệu.
- [Passport](https://www.passportjs.org/) – Xác thực local, JWT và social login.
- [JWT](https://jwt.io/) – Access token và refresh token cho phiên đăng nhập.
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup) – Gửi Firebase Cloud Messaging.
- [Swagger / OpenAPI](https://swagger.io/) – Sinh tài liệu API.
- [Resend](https://resend.com/) + [Pug](https://pugjs.org/) – Gửi email và render template email.
- [ExcelJS](https://github.com/exceljs/exceljs) + [xlsx](https://www.npmjs.com/package/xlsx) – Import/export dữ liệu Excel.
- [Sharp](https://sharp.pixelplumbing.com/) – Xử lý ảnh.
- [Jest](https://jestjs.io/) – Unit/e2e testing.

---

## 📂 Cấu trúc thư mục

```text
src/
├── announcements/       # Popup/banner thông báo
├── auth/                # Xác thực, JWT, local/social strategy và Turnstile
├── comics/              # API truyện, BXH truyện và import truyện
├── comments/            # Bình luận, reply, like và report comment
├── configs/             # Enum và message dùng chung
├── core/                # Global interceptor chuẩn hoá response
├── decorator/           # Custom decorators như Public, User, Roles
├── email/               # Gửi email và template reset password
├── emoji-categories/    # Danh mục emoji
├── emojis/              # Emoji picker
├── favorites/           # Truyện yêu thích và tiến độ đọc
├── firebase/            # Firebase Admin và push notification
├── frames/              # Khung avatar
├── images/              # Phục vụ và xử lý ảnh
├── notifications/       # Thông báo người dùng
├── upload-telegram/     # Upload ảnh qua Telegram bot
├── users/               # Người dùng, profile, import/export và FCM token
├── app.module.ts        # Root module, MongoDB và module wiring
└── main.ts              # Bootstrap app, CORS, versioning, Swagger và global pipes
```

---

## 🧭 Các API chính

API dùng global prefix và URI versioning:

```text
/api/v1
```

Swagger document:

```text
/api/docs
```

| Endpoint group           | Mô tả                                                             |
| ------------------------ | ----------------------------------------------------------------- |
| `/api/v1/auth`           | Đăng nhập, đăng ký, social login, token và mật khẩu               |
| `/api/v1/user`           | Người dùng, profile, phân quyền admin, import/export và FCM token |
| `/api/v1/comic`          | Danh sách truyện public và quản trị truyện                        |
| `/api/v1/comment`        | Bình luận, reply, like, report và quản trị comment                |
| `/api/v1/favorite`       | Truyện yêu thích và trạng thái yêu thích                          |
| `/api/v1/frame`          | Quản lý khung avatar                                              |
| `/api/v1/emoji`          | Quản lý emoji                                                     |
| `/api/v1/emoji-category` | Quản lý danh mục emoji                                            |
| `/api/v1/notification`   | Thông báo người dùng, đọc/xoá thông báo                           |
| `/api/v1/announcement`   | Popup/banner thông báo                                            |
| `/api/v1/image`          | Lấy và xử lý ảnh                                                  |
| `/api/v1/upload`         | Upload một hoặc nhiều ảnh                                         |

---

## ⚙️ Cài đặt & chạy dự án

### Yêu cầu

- Node.js phiên bản tương thích với NestJS 9
- npm
- MongoDB connection string
- Frontend client URL và frontend admin URL
- Firebase project nếu bật push notification
- Telegram bot nếu dùng upload ảnh qua Telegram
- Resend API key nếu dùng email reset password
- OAuth app cho Google, Facebook và Discord nếu bật social login

### Cài đặt dependencies

```bash
npm install
```

### Chạy development

```bash
npm run start:dev
```

API mặc định chạy tại:

```bash
http://localhost:4000/api/v1
```

Swagger chạy tại:

```bash
http://localhost:4000/api/docs
```

### Build production

```bash
npm run build
```

### Chạy production

```bash
npm run start:prod
```

---

## 🔧 Environment Variables

Tạo file `.env` ở thư mục gốc và cấu hình các biến môi trường cần thiết:

```env
PORT=4000
MONGO_URL=
BACKEND_URL=
FE_CLIENT_URL=
FE_ADMIN_URL=

JWT_ACCESS_TOKEN=
JWT_ACCESS_TOKEN_EXPIRE=
JWT_REFRESH_TOKEN=
JWT_REFRESH_TOKEN_EXPIRE=
EMAIL_RESET_PASSWORD_EXPIRE=

RESEND_API_KEY=
RESEND_FROM_EMAIL=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=

FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=
FACEBOOK_CALLBACK_URL=

DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_CALLBACK_URL=

FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

---

## 📜 Scripts

| Script                | Mô tả                                    |
| --------------------- | ---------------------------------------- |
| `npm run start`       | Chạy NestJS server                       |
| `npm run start:dev`   | Chạy development server ở watch mode     |
| `npm run start:debug` | Chạy debug server ở watch mode           |
| `npm run build`       | Build production và copy email templates |
| `npm run start:prod`  | Chạy server từ thư mục `dist`            |
| `npm run lint`        | Chạy ESLint và tự động fix               |

---

## 📝 Ghi chú triển khai

- `main.ts` cấu hình global prefix là `/api` và version mặc định là `/v1`.
- CORS chỉ cho phép `FE_CLIENT_URL` và `FE_ADMIN_URL`, đồng thời bật `credentials` để dùng cookie refresh token.
- Refresh token được lưu trong cookie `ZTC_token` với `httpOnly`, `sameSite: 'none'` và `secure: true`.
- API dùng `JwtAuthGuard` global, các route public được mở bằng custom decorator.
- DTO được validate global với `whitelist`, `forbidNonWhitelisted` và `transform`.
- MongoDB được cấu hình qua `MONGO_URL` và dùng soft-delete plugin toàn cục.
- Swagger được cấu hình tại `/api/docs` với Bearer Auth tên `access-token`.
- Script build sẽ copy template email từ `src/email/templates` sang `dist/email/templates`.
- Firebase private key trong `.env` cần giữ định dạng newline escaped (`\\n`) để service thay thế khi khởi tạo.

---

## 📄 License

Dự án được phát triển với mục đích học tập, nghiên cứu và thực hành xây dựng backend cho nền tảng đọc truyện tranh online.
