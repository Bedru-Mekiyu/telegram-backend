# Telegram Backend API

A feature-rich RESTful API and real-time backend service modeled after Telegram, built with **Node.js**, **Express**, **MongoDB**, and **Socket.IO**. This application provides instant messaging capabilities, real-time typing indicators and notifications, robust authentication with JWT access and refresh tokens, group and channel chat management, message reactions, file upload handling, and user profile management.

---

## 🌟 Key Features

* **Authentication & Authorization**:
  * User Registration & Login with hashed passwords (`bcrypt`).
  * JWT Authentication with short-lived access tokens and long-lived refresh tokens.
  * Logout and Token Refresh endpoints.
  * Password Reset flow with email token verification (`nodemailer`).

* **Real-Time Messaging (Socket.IO)**:
  * Instant messaging delivery and real-time room handling.
  * Real-time typing indicators (`typing`, `stop_typing`).
  * Live user online/offline status updates.

* **Chat & Channel Management**:
  * Private Direct Messaging between users.
  * Group Chat creation, member addition/removal, and group renaming.
  * Channel creation and subscription system.
  * Pin and Unpin messages within chats.

* **Advanced Messaging Capabilities**:
  * Text messages, media/document attachments (up to 50MB using `multer`).
  * Message Edit and Soft Delete functionality.
  * Message Reactions (like, heart, fire, etc.).
  * Message Replies and Message Forwarding.
  * Search messages within a specific chat.

* **User Management**:
  * Search users by name or email.
  * Profile updates with custom avatar image uploads.

---

## 🛠️ Technology Stack

* **Runtime Environment**: Node.js
* **Web Framework**: Express.js (v5)
* **Database & ODM**: MongoDB & Mongoose
* **Real-Time Engine**: Socket.IO
* **Authentication**: JSON Web Tokens (`jsonwebtoken`), `bcrypt`
* **File Uploads**: `multer`
* **Email Service**: `nodemailer`

---

## 📁 Repository Structure

```
├── .github/
│   └── workflows/          # GitHub Actions CI workflow definitions
├── scripts/
│   └── verify-email.js     # Script for testing email configuration
├── src/
│   ├── config/             # Database and Email configuration modules
│   │   ├── db.js
│   │   └── emailconfig.js
│   ├── controllers/        # Express route request handlers
│   │   ├── auth.controller.js
│   │   ├── chat.controller.js
│   │   ├── message.controller.js
│   │   └── user.controller.js
│   ├── middlewares/        # Custom middlewares (e.g. JWT Auth)
│   │   └── auth.middleware.js
│   ├── models/             # Mongoose schemas & models (User, Chat, Message)
│   │   ├── Chat.js
│   │   ├── Message.js
│   │   └── User.js
│   ├── routes/             # Express API route declarations
│   │   ├── auth.routes.js
│   │   ├── chat.routes.js
│   │   ├── message.routes.js
│   │   └── user.routes.js
│   ├── services/           # Service abstractions (e.g., email service)
│   │   └── email.js
│   ├── sockets/            # Socket.IO connection and event handlers
│   │   └── socket.js
│   ├── utils/              # Utility classes and custom errors
│   │   └── customError.js
│   └── app.js              # Application entry point and Express server setup
├── uploads/                # Directory for uploaded media and user avatars
├── .env.example            # Environment variable template file
├── package.json            # Node.js dependencies and script definitions
└── README.md               # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
* [Node.js](https://nodejs.org/) (v18+ recommended)
* [MongoDB](https://www.mongodb.com/) running locally or a cloud MongoDB connection string (e.g., MongoDB Atlas)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/bedru-m/telegram-backend.git
   cd telegram-backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy the `.env.example` file to create your own `.env` file and adjust the settings:
   ```bash
   cp .env.example .env
   ```
   Provide suitable secrets and values for:
   * `PORT`: Port on which the HTTP/Socket server runs (default: `5000`)
   * `MONGO_URI`: MongoDB connection string
   * `JWT_SECRET` & `JWT_REFRESH_SECRET`: Cryptographic secrets for JWT tokens
   * `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`: SMTP configuration for sending email notifications and password resets

### Running the Application

* **Development Mode** (with auto-reload using Nodemon):
  ```bash
  npm run dev
  ```

* **Production Mode**:
  ```bash
  npm start
  ```

---

## 📡 API Reference Overview

### Base Route: `/api`

#### **Authentication (`/api/auth`)**
* `POST /register` - Register a new user account
* `POST /login` - Authenticate user & return Access + Refresh JWT tokens
* `POST /refresh` - Generate new Access Token using Refresh Token
* `POST /logout` - Invalidate Refresh Token and log out user
* `POST /forgot-password` - Request password reset email
* `POST /reset-password` - Reset password using received token

#### **Chats (`/api/chats`)**
* `POST /private` - Create or retrieve direct message chat with a user
* `POST /group` - Create a group chat
* `PUT /group/add` - Add member to group chat
* `PUT /group/remove` - Remove member from group chat
* `PUT /group/rename` - Rename group chat
* `POST /channel` - Create a broadcast channel
* `POST /channel/subscribe` - Subscribe to a channel
* `GET /` - Retrieve all chats for authenticated user
* `POST /pin` - Pin a message in chat
* `POST /unpin` - Unpin a message in chat

#### **Messages (`/api/messages`)**
* `POST /` - Send message (supports optional file attachments)
* `GET /:chatId` - Retrieve messages for a specific chat
* `PUT /seen/:chatId` - Mark messages as read
* `PUT /:messageId` - Edit message text
* `DELETE /:messageId` - Soft delete message
* `POST /:messageId/reaction` - Add or update emoji reaction
* `POST /:messageId/reply` - Reply to a message
* `POST /:messageId/forward` - Forward message to another chat
* `GET /search/:chatId` - Search messages within a chat

#### **Users (`/api/users`)**
* `GET /?query=` - Search users by name/email
* `PUT /` - Update user profile & upload avatar picture

---

## ⚡ Socket.IO Events

The Socket.IO connection authenticates client connections and manages the following real-time events:

* **Connection / Authentication**: Socket authenticates using `token` query param or auth header.
* **`typing`**: Emits typing notification to target chat room.
* **`stop_typing`**: Emits stop typing notification to target chat room.
* **`send_message`**: Emits real-time message payload to participants.
* **`message_seen`**: Emits read-receipt update to participants.

---

## 🧪 Testing & Validation

To test code syntax and verify JavaScript integrity:

```bash
npm test
```

---

## 📄 License

This project is open-source and available under the [ISC License](LICENSE).
