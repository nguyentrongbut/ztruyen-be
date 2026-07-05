# Data Models (Backend)

This document provides a detailed overview of the database models used in the **Ztruyện Backend** application. The project uses **MongoDB** as the database and **Mongoose** as the Object Data Modeling (ODM) library.

All models utilize Mongoose schemas with auto-generated `_id` (`ObjectId`) and automatic `createdAt` / `updatedAt` timestamps enabled unless specified otherwise.

---

## Entity Relationship Overview

The database structure consists of several interconnected collections. Below is a summary of the relationships:
- **User** references `Image` (avatar, cover) and `Frame` (avatar_frame).
- **Emoji** references `Image` (image) and `EmojiCategory` (category).
- **EmojiCategory** references `Image` (image).
- **Frame** references `Image` (image).
- **Notification** references `User` (recipientId, senderId) and `Comment` (commentId, replyId).
- **Favorite** references `User` (userId) and implicitly links to `Comic` via `comic_slug`.
- **Comment** references `User` (userId, replyTo) and self-references `Comment` (parent).
- **CommentLike** references `User` (userId) and `Comment` (commentId).
- **CommentReport** references `User` (userId) and `Comment` (commentId).

---

## Schema Catalog

### 1. User
Stores user accounts, credentials, profile information, authentication provider metadata, and push notification tokens.

- **Collection Name:** `users`
- **Soft Delete:** Enabled (using `soft-delete-plugin-mongoose`)

#### Fields
| Field Name | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `email` | `String` | Required, Unique | User's email address (login credential) |
| `password` | `String` | Optional, Default: `null` | Hashed password (null for social login users) |
| `name` | `String` | Required, Unique | User's display name |
| `name_unsigned` | `String` | Indexed | Normalised version of the name without Vietnamese tones (for search) |
| `cover` | `ObjectId` | Ref: `Image` | Profile background cover image reference |
| `bio` | `String` | - | Brief biography/description |
| `avatar` | `ObjectId` | Ref: `Image` | Avatar image reference |
| `avatar_frame` | `ObjectId` | Ref: `Frame` | Equipped avatar frame reference |
| `age` | `Number` | - | User's age |
| `gender` | `String` (Enum) | Default: `OTHER` | Options: `MALE`, `FEMALE`, `OTHER` |
| `birthday` | `Date` | - | User's birthdate |
| `role` | `String` (Enum) | Default: `USER` | Options: `USER`, `ADMIN` |
| `provider` | `String` (Enum) | Default: `LOCAL` | Options: `LOCAL`, `GOOGLE`, `FACEBOOK`, `DISCORD` |
| `resetToken` | `String` | Optional | Token used for password resets |
| `resetTokenExpiry`| `Date` | Optional | Expiration time of the password reset token |
| `refreshToken` | `String` | - | Session refresh token stored securely |
| `fcmTokens` | `String[]` | Default: `[]` | List of registered Firebase Cloud Messaging tokens |
| `deletedAt` | `Date` | - | Timestamp when the user was soft-deleted |
| `isDeleted` | `Boolean` | - | Soft-deleted flag |

#### Indexes
- `name_unsigned: 1` (Single index)
- `email: 1` (Unique index)
- `name: 1` (Unique index)

---

### 2. Comic
Stores metadata about comic books, manga, or webtoons.

- **Collection Name:** `comics`

#### Fields
| Field Name | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `name` | `String` | Required | Title of the comic |
| `name_unsigned` | `String` | Indexed | Normalised comic title without Vietnamese tones |
| `slug` | `String` | Required, Unique | URL-friendly unique identifier of the comic |
| `thumb_url` | `String` | - | URL of the comic thumbnail image |
| `authors` | `String[]` | Default: `[]` | Authors/artists of the comic |
| `status` | `String` | Default: `'ongoing'` | Comic status (e.g., ongoing, completed) |
| `genres` | `String[]` | Default: `[]` | Genres or tags associated with the comic |
| `latest_chapter` | `String` | - | Latest chapter title/number |
| `chapter_api_data`| `String` | - | External API endpoint/data for chapters |
| `country` | `String` | - | Origin country of the comic |
| `rank` | `Number` | Indexed | View or popular rank |

#### Indexes
- `slug: 1` (Unique index)
- `rank: 1` (Single index)
- `country: 1, rank: 1` (Compound index)
- `genres: 1` (Multikey index)

---

### 3. Comment
Stores comments submitted by users under specific comics, chapters, or pages.

- **Collection Name:** `comments`
- **Soft Delete:** Custom boolean `isDeleted`

#### Fields
| Field Name | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `userId` | `ObjectId` | Ref: `User`, Indexed | Reference to the author of the comment |
| `comicSlug` | `String` | Indexed | Slug of the commented comic |
| `comicName` | `String` | Indexed | Name of the commented comic |
| `comicName_unsigned` | `String` | Indexed | Unsigned name of the commented comic |
| `chapterName` | `String` | Default: `null` | Chapter name, if commented inside a chapter |
| `chapterId` | `String` | Default: `null`, Indexed | Chapter identifier |
| `page` | `Number` | Default: `null`, Indexed | Page number inside the chapter, if applicable |
| `parent` | `ObjectId` | Ref: `Comment`, Indexed | Reference to parent comment (for nested replies) |
| `replyTo` | `ObjectId` | Ref: `User` | Target user ID that this comment is replying to |
| `content` | `String` | Required | Content of the comment |
| `likeCount` | `Number` | Default: `0`, Indexed | Number of likes received |
| `replyCount` | `Number` | Default: `0` | Number of direct replies |
| `isDeleted` | `Boolean` | Default: `false`, Indexed | Flag indicating whether the comment is deleted |

#### Indexes
- `comicSlug: 1, chapterId: 1, parent: 1, createdAt: -1` (Compound index for fetching thread root comments)
- `comicSlug: 1, chapterId: 1, likeCount: -1` (Compound index for top comments sorting)
- `comicSlug: 1, chapterId: 1, page: 1, parent: 1` (Compound index for page-specific comments)
- `comicName_unsigned: 1, createdAt: -1` (Compound index for dashboard/search)

---

### 4. CommentLike
Tracks which users have liked which comments.

- **Collection Name:** `commentlikes`

#### Fields
| Field Name | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `userId` | `ObjectId` | Ref: `User`, Indexed | The user who liked the comment |
| `commentId` | `ObjectId` | Ref: `Comment` (aliased as CommentLike in ref), Indexed | The liked comment |

#### Indexes
- `userId: 1, commentId: 1` (Unique compound index, prevents duplicate likes)

---

### 5. CommentReport
Stores user reports/flags against comments for moderation purposes.

- **Collection Name:** `commentreports`

#### Fields
| Field Name | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `userId` | `ObjectId` | Ref: `User` | The user who created the report |
| `commentId` | `ObjectId` | Ref: `Comment` | The reported comment |
| `reason` | `String` | Required | Moderation reason (e.g. spam, abuse) |
| `status` | `String` (Enum) | Default: `PENDING`, Indexed | Options: `PENDING`, `RESOLVED`, `REJECTED` |

#### Indexes
- `userId: 1, commentId: 1` (Unique compound index, prevents multiple reports on same comment by same user)
- `status: 1, createdAt: -1` (Compound index for moderation dashboards)

---

### 6. Favorite
Maintains lists of bookmarked/favorite comics for each user.

- **Collection Name:** `favorites`

#### Fields
| Field Name | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `userId` | `ObjectId` | Ref: `User`, Required | Owner of the favorite entry |
| `comic_slug` | `String` | Required | Slug of the favorited comic |
| `comic_name` | `String` | - | Title of the comic |
| `comic_name_unsigned`| `String` | Indexed | Normalised title of the comic |
| `comic_cover` | `String` | - | Cover image URL of the comic |

#### Indexes
- `userId: 1, comic_slug: 1` (Unique compound index, prevents duplicate bookmarks)
- `userId: 1, comic_name_unsigned: 1` (Compound index for search inside user bookmarks)

---

### 7. Notification
Stores notifications generated for users (such as comment likes or replies). It features an automatic TTL (Time-To-Live) index for cleanup.

- **Collection Name:** `notifications`

#### Fields
| Field Name | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `recipientId` | `ObjectId` | Ref: `User`, Required, Indexed | Receiver of the notification |
| `senderId` | `ObjectId` | Ref: `User`, Required | Creator of the notification |
| `type` | `String` (Enum) | Required | Options defined in NotificationType enum |
| `commentId` | `ObjectId` | Ref: `Comment`, Optional | Reference to the associated comment |
| `replyId` | `ObjectId` | Ref: `Comment`, Optional | Reference to the associated reply comment |
| `isRead` | `Boolean` | Default: `false`, Indexed | Read status of the notification |
| `meta` | `Object` | - | Metadata object containing snapshot values: `senderName`, `senderAvatar`, `comicName`, `comicSlug`, `chapterId`, `contentPreview` |

#### Indexes
- `createdAt: 1` (TTL index: expires after 30 days — `expireAfterSeconds: 2592000`)
- `recipientId: 1, createdAt: -1` (Compound index for fetching notifications by recency)
- `recipientId: 1, isRead: 1` (Compound index for quick retrieval of unread count)

---

### 8. Announcement
Contains system-wide messages displayed to all users upon entering the application.

- **Collection Name:** `announcements`

#### Fields
| Field Name | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `title` | `String` | Required | Headline of the announcement |
| `content` | `String` | Required | Content of the announcement |
| `type` | `String` (Enum) | Default: `INFO` | Options: `info`, `warning`, `maintenance`, `event` |
| `isActive` | `Boolean` | Default: `false`, Indexed | Flag to toggle activation of the announcement |

#### Indexes
- `isActive: 1` (Single index)

---

### 9. Image
Stores metadata for uploaded image assets.

- **Collection Name:** `images`

#### Fields
| Field Name | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `slug` | `String` | Required, Unique | Short unique slug used to retrieve the image |
| `fileId` | `String` | - | Identifier from the storage provider (e.g. Telegram message ID) |
| `url` | `String` | Required | Destination URL of the image |

#### Indexes
- `slug: 1` (Unique index)

---

### 10. Frame
Stores avatar frame items that users can equip to decorate their profile picture.

- **Collection Name:** `frames`
- **Soft Delete:** Custom fields `deletedAt` and `isDeleted`

#### Fields
| Field Name | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `image` | `ObjectId` | Ref: `Image` | The image containing the frame artwork |
| `name` | `String` | Required, Unique | Name of the frame |
| `name_unsigned` | `String` | Indexed | Normalised unsigned name |
| `isDeleted` | `Boolean` | - | Soft-deleted flag |
| `deletedAt` | `Date` | - | Timestamp when deleted |

#### Indexes
- `name: 1` (Unique index)
- `name_unsigned: 1` (Single index)

---

### 11. Emoji Category
Groups emojis together for organization in the emoji picker component.

- **Collection Name:** `emojicategories`

#### Fields
| Field Name | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `name` | `String` | Required, Unique | Category name (e.g., Pepe, Gifs) |
| `name_unsigned` | `String` | Indexed | Normalised category name |
| `image` | `ObjectId` | Ref: `Image`, Required | Representative icon image for the category |
| `order` | `Number` | Default: `0`, Indexed | Display sorting order |
| `isActive` | `Boolean` | Default: `true` | Activation status |

#### Indexes
- `name: 1` (Unique index)
- `name_unsigned: 1` (Single index)
- `order: 1` (Single index)

---

### 12. Emoji
Individual stickers/emojis that users can send in comments.

- **Collection Name:** `emojis`

#### Fields
| Field Name | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `name` | `String` | Required, Unique | Emoji name code (e.g. `:pepe_ok:`) |
| `name_unsigned` | `String` | Indexed | Normalised name |
| `type` | `String` (Enum) | Default: `IMAGE`, Indexed | Options: `IMAGE`, `TEXT` |
| `image` | `ObjectId` | Ref: `Image`, Optional | Reference to the actual image asset (for image emojis) |
| `text` | `String` | Optional | Plain text string (for text emojis/unicode emoticons) |
| `category` | `ObjectId` | Ref: `EmojiCategory`, Required, Indexed | Reference to parent category |
| `isActive` | `Boolean` | Default: `true` | Activation status |
| `isGif` | `Boolean` | Default: `false` | Indicates if the emoji is an animated GIF |

#### Indexes
- `name: 1` (Unique index)
- `category: 1` (Single index)
- `type: 1` (Single index)
