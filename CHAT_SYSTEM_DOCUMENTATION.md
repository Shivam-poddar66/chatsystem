# Full-Stack Real-Time Private Chat System
## Architecture & Technical Design Document (React + Node.js + MySQL)

**Stack:**
- **Frontend:** React (Vite / SPA), Socket.IO Client, Tailwind CSS, Lucide Icons
- **Backend:** Node.js, Express.js, Socket.IO Server, JWT Auth
- **Database:** MySQL 8.x (with connection pooling via `mysql2/promise`)
- **Core Features:** 1-on-1 Real-time Messaging (Zero Polling), Live Online/Offline Presence, Automated Phone & Email Masking, Paginated Message History, Read Receipts & Typing Indicators.

---

## 1. System Architecture & Real-Time Flow

```text
+-------------------------------------------------------------+
|               React Single Page Application                 |
|  - ChatLayout (Sidebar + Active ChatWindow)                 |
|  - AuthContext (JWT State & LocalStorage)                   |
|  - SocketContext (Persistent WebSocket Connection)          |
|  - useChat & usePresence Custom Hooks                       |
+------------------------------+------------------------------+
                               |
                WebSocket (Socket.io) / REST (Axios)
                               |
+------------------------------v------------------------------+
|                    Node.js + Express Gateway                 |
|  - JWT Handshake & HTTP Auth Middleware                     |
|  - REST Endpoints (/api/auth, /api/users, /api/messages)    |
|  - Socket.IO Event Engine & Presence Registry               |
|  - PII Masking Engine (Phone & Email Regex Sanitizer)        |
+------------------------------+------------------------------+
                               |
                     mysql2/promise (Pool)
                               |
+------------------------------v------------------------------+
|                    MySQL Database Engine                     |
|  - users (id, name, email, phone, password, status, etc.)   |
|  - conversations (id, type, updated_at)                     |
|  - conversation_participants (conversation_id, user_id)     |
|  - messages (id, conversation_id, sender_id, masked_content)|
+-------------------------------------------------------------+
```

### Event-Driven Message Lifecycle (Zero Polling)
1. **WebSocket Handshake:**
   - React mounts `SocketProvider`, connecting to Node.js passing `{ auth: { token: 'JWT_TOKEN' } }`.
   - Node.js verifies JWT during handshake. On success, socket joins private room `user_${userId}`.
2. **Presence Broadcast:**
   - Server marks user status as `online` in memory/DB and broadcasts `user:status_changed` to all connected clients.
3. **1-to-1 Message Dispatch:**
   - Sender types message in React and clicks send.
   - React emits `message:send` with `{ recipientId, content, tempId }`.
   - Node.js receives event -> **Masking Engine** masks phone numbers & emails -> Saves to MySQL -> Emits `message:receive` to `user_${recipientId}` room -> Returns ACK `message:sent` to sender with database ID.
4. **Read Receipts:**
   - When recipient has the chat open, React emits `message:seen`.
   - Server updates status in DB and notifies sender via `message:status_update`.

---

## 2. Recommended Full-Stack Project Structure

Clean separation between the Node.js backend API/WebSocket server and the React frontend client:

```text
chatsystem/
├── server/                          # Backend: Node.js + Express + Socket.IO + MySQL
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js          # MySQL2 connection pool with promises
│   │   │   ├── jwt.js               # JWT secret & expiration rules
│   │   │   └── websocket.js         # Socket.IO options & CORS
│   │   ├── controllers/
│   │   │   ├── auth.controller.js   # Register, Login, Current User (/me)
│   │   │   ├── user.controller.js   # Get contacts, profile, search
│   │   │   └── chat.controller.js   # Paginated message history, conversation list
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.js   # HTTP Bearer token verification
│   │   │   ├── socketAuth.js        # Socket.IO handshake JWT authentication
│   │   │   ├── validate.js          # Request schema validation
│   │   │   └── errorHandler.js      # Global error handling middleware
│   │   ├── models/                  # Direct MySQL prepared statements
│   │   │   ├── User.js
│   │   │   ├── Conversation.js
│   │   │   └── Message.js
│   │   ├── routes/
│   │   │   ├── index.js             # Master API router (/api)
│   │   │   ├── auth.routes.js       # /api/auth/*
│   │   │   ├── user.routes.js       # /api/users/*
│   │   │   └── chat.routes.js       # /api/conversations/*
│   │   ├── services/
│   │   │   ├── auth.service.js      # Password hashing & token generation
│   │   │   ├── chat.service.js      # 1-to-1 room lookup, saving & fetching messages
│   │   │   ├── masking.service.js   # Phone & Email masking engine (Regex)
│   │   │   └── presence.service.js  # Online/Offline user registry & socket map
│   │   ├── sockets/
│   │   │   ├── index.js             # Socket server setup & lifecycle routing
│   │   │   ├── chat.handler.js      # message:send, message:typing, message:seen
│   │   │   └── presence.handler.js  # user:online, user:disconnect
│   │   ├── utils/
│   │   │   ├── response.js          # Standardized API response format
│   │   │   └── logger.js            # Logging helper
│   │   ├── app.js                   # Express application setup
│   │   └── server.js                # Combined HTTP & WebSocket bootstrap
│   ├── database/
│   │   ├── migrations/
│   │   │   └── 001_initial_schema.sql # DDL for tables & indexes
│   │   ├── migrate.js               # Auto-migration runner script
│   │   └── seed.js                  # Demo seed users & mock conversations
│   ├── .env.example
│   └── package.json
│
├── client/                          # Frontend: React (Vite) + Tailwind CSS
│   ├── src/
│   │   ├── assets/                  # Sounds (message-ping.mp3), logos
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   ├── LoginForm.jsx
│   │   │   │   └── RegisterForm.jsx
│   │   │   ├── chat/
│   │   │   │   ├── ChatLayout.jsx   # Split-pane container (Sidebar + ChatArea)
│   │   │   │   ├── Sidebar.jsx      # Header, search, user tabs
│   │   │   │   ├── UserList.jsx     # Scrollable contact list with badges
│   │   │   │   ├── UserItem.jsx     # Single user row (avatar, online dot, last msg)
│   │   │   │   ├── ChatWindow.jsx   # Active chat container
│   │   │   │   ├── ChatHeader.jsx   # Selected user info, status, call actions
│   │   │   │   ├── MessageList.jsx  # Scrollable message bubbles with timestamps
│   │   │   │   ├── MessageBubble.jsx# Bubble styling (sent vs received, checkmarks)
│   │   │   │   ├── MessageInput.jsx # Input field, emoji button, send button
│   │   │   │   └── TypingIndicator.jsx # Animated 3-dots indicator
│   │   │   └── common/
│   │   │       ├── Avatar.jsx       # Avatar with status dot
│   │   │       └── Badge.jsx        # Unread message badge
│   │   ├── context/
│   │   │   ├── AuthContext.jsx      # User state, login, logout, token persistence
│   │   │   └── SocketContext.jsx    # Socket.IO connection & global event listener
│   │   ├── hooks/
│   │   │   ├── useChat.js           # Messages state, sendMsg, typing indicators
│   │   │   └── usePresence.js       # Live online/offline user map
│   │   ├── services/
│   │   │   ├── api.js               # Axios instance with auth interceptor
│   │   │   ├── auth.service.js      # Auth API calls
│   │   │   └── chat.service.js      # Fetch conversations & historical messages
│   │   ├── App.jsx                  # Route switcher (Auth vs Chat)
│   │   ├── main.jsx                 # React root render
│   │   └── index.css                # Tailwind styling
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── CHAT_SYSTEM_DOCUMENTATION.md     # Full architectural documentation
```

---

## 3. Database Schema Design (MySQL)

```sql
CREATE DATABASE IF NOT EXISTS `db_chatsystem` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `db_chatsystem`;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS `users` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(150) NOT NULL UNIQUE,
    `phone` VARCHAR(25) NULL,
    `password` VARCHAR(255) NOT NULL,
    `status` ENUM('online', 'offline') NOT NULL DEFAULT 'offline',
    `last_seen_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_users_email` (`email`),
    INDEX `idx_users_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Conversations Table
CREATE TABLE IF NOT EXISTS `conversations` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `type` ENUM('private', 'group') NOT NULL DEFAULT 'private',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_conversations_updated_at` (`updated_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Conversation Participants
CREATE TABLE IF NOT EXISTS `conversation_participants` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `conversation_id` BIGINT UNSIGNED NOT NULL,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `last_read_message_id` BIGINT UNSIGNED NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_convo_user` (`conversation_id`, `user_id`),
    INDEX `idx_participant_user` (`user_id`),
    CONSTRAINT `fk_cp_convo` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_cp_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Messages Table
CREATE TABLE IF NOT EXISTS `messages` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `conversation_id` BIGINT UNSIGNED NOT NULL,
    `sender_id` BIGINT UNSIGNED NOT NULL,
    `original_content` TEXT NOT NULL,
    `masked_content` TEXT NOT NULL,
    `status` ENUM('sent', 'delivered', 'read') NOT NULL DEFAULT 'sent',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    -- Composite index for fast history paging:
    INDEX `idx_convo_history` (`conversation_id`, `created_at` DESC),
    CONSTRAINT `fk_msg_convo` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_msg_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 4. Sensitive PII Masking Engine (Phone & Email)

### Masking Rules
* **Phone numbers:** First 2 digits and last 2 digits remain visible; all intermediate digits are replaced with asterisks (`*`). Handles spaces, dashes, parentheses, and international prefixes `+`.
  * `9876543210` -> `98******10`
  * `+91 98765 43210` -> `+91 98******10`
  * `(555) 123-4567` -> `55******67`
* **Email addresses:** First character visible, last character of local part visible (if length >= 3), middle replaced with `*`, with `@` and full domain untouched.
  * `john.doe@example.com` -> `j******e@example.com`
  * `me@domain.com` -> `**@domain.com`

### Node.js Implementation (`server/src/services/masking.service.js`)

```javascript
class MaskingService {
    /**
     * Masks email local part, preserves @ and domain.
     */
    static maskEmail(text) {
        if (!text) return '';
        const emailRegex = /([a-zA-Z0-9_.+-]+)@([a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)/g;
        return text.replace(emailRegex, (match, user, domain) => {
            if (user.length <= 2) {
                return `${'*'.repeat(user.length)}@${domain}`;
            }
            const first = user[0];
            const last = user[user.length - 1];
            const middle = '*'.repeat(user.length - 2);
            return `${first}${middle}${last}@${domain}`;
        });
    }

    /**
     * Masks phone numbers: keeps first 2 and last 2 digits, masks middle with *.
     */
    static maskPhone(text) {
        if (!text) return '';
        const phoneRegex = /(?:\+?\d{1,3}[\s-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/g;

        return text.replace(phoneRegex, (match) => {
            const digitsOnly = match.replace(/\D/g, '');
            if (digitsOnly.length < 7) return match; // Skip short numbers

            const prefix = digitsOnly.slice(0, 2);
            const suffix = digitsOnly.slice(-2);
            const maskedMiddle = '*'.repeat(digitsOnly.length - 4);
            const hasPlus = match.trim().startsWith('+');

            return `${hasPlus ? '+' : ''}${prefix}${maskedMiddle}${suffix}`;
        });
    }

    /**
     * Pipeline sanitizer: Masks both emails and phone numbers.
     */
    static maskMessage(content) {
        if (!content || typeof content !== 'string') return '';
        let result = this.maskEmail(content);
        result = this.maskPhone(result);
        return result;
    }
}

module.exports = MaskingService;
```

---

## 5. WebSocket Event Protocol (Client <-> Server)

| Event Name | Direction | Payload | Purpose |
| :--- | :--- | :--- | :--- |
| `connection` | Client -> Server | `{ auth: { token } }` | Authenticates socket during handshake |
| `user:status_changed` | Server -> Client | `{ userId, status, lastSeen }` | Broadcasts user online/offline status |
| `message:send` | Client -> Server | `{ recipientId, content, tempId }` | Sends 1-on-1 private message |
| `message:receive` | Server -> Recipient | `{ id, tempId, conversationId, senderId, content, createdAt }` | Delivers instant masked message to recipient |
| `message:typing` | Client -> Server | `{ recipientId, isTyping }` | Sends real-time typing status |
| `user:typing` | Server -> Recipient | `{ senderId, isTyping }` | Displays "Typing..." indicator in chat header |
| `message:seen` | Client -> Server | `{ conversationId, messageIds, senderId }` | Marks messages as read |
| `message:status_update` | Server -> Sender | `{ conversationId, messageIds, status: 'read' }` | Updates double checkmark on sender's UI |

---

## 6. Frontend React Architecture & Components

### 1. State Management & Hooks
* **`SocketContext.jsx`:** Holds the single persistent Socket.IO connection. Subscribes to `user:status_changed` and `message:receive`.
* **`useChat.js` Hook:**
  * Maintains `messages` array for the currently selected contact.
  * Handles sending messages with optimistic UI updates (renders pending bubble immediately with `tempId`, then replaces with server ACK).
  * Automatically plays a subtle incoming audio notification.
* **`usePresence.js` Hook:**
  * Maintains a `Map<userId, status>` updated dynamically via `user:status_changed`.

### 2. React UI Component Hierarchy

```text
<App>
  ├── <AuthView> (if not authenticated)
  │     ├── <LoginForm />
  │     └── <RegisterForm />
  │
  └── <ChatLayout> (if authenticated)
        ├── <Sidebar>
        │     ├── <ProfileHeader /> (User avatar, my status, logout button)
        │     ├── <SearchBar />
        │     └── <UserList>
        │           └── <UserItem /> (Avatar + Online badge, name, last message snippet, unread counter)
        │
        └── <ChatWindow> (if a user is selected)
              ├── <ChatHeader>
              │     ├── <Avatar /> (Contact avatar with green/gray badge)
              │     ├── <UserInfo /> (Contact name, "Online" or "Last seen at 02:15 PM")
              │     └── <TypingIndicator /> ("John is typing...")
              │
              ├── <MessageList>
              │     └── <MessageBubble /> (Sent: Right & Blue | Received: Left & Gray, Time, Read Status Checkmarks)
              │
              └── <MessageInput>
                    ├── <TextInput /> (onChange triggers message:typing event)
                    └── <SendButton />
```

---

## 7. Security, Privacy & Validation Checklist

1. **Handshake Authentication:** Socket connections without valid JWT are immediately terminated at the handshake layer.
2. **Prepared SQL Statements:** All queries use `mysql2/promise` parameterized inputs `[?]` to eliminate SQL injection risks.
3. **Double-layer XSS Prevention:**
   - Server strips executable scripts.
   - React escapes rendered strings automatically in JSX.
4. **Data Isolation:** Masking occurs before emitting over WebSockets. Recipients never receive unmasked PII.
5. **Rate Limiting:** Protects socket endpoints from spam (e.g. max 5 messages per second per user).
6. **Cursor Pagination:** Messages are loaded in reverse batches (`WHERE id < :lastMessageId ORDER BY id DESC LIMIT 30`) preventing server memory exhaustion.
