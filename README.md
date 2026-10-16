# Real-Time Private Chat System (Node.js + Socket.IO + MySQL + React)

A full-stack, enterprise-grade real-time private chat application built with **Node.js (Express & Socket.IO)**, **MySQL**, and **React**.

---

## 🌟 Key Features

1. **Instant Real-Time Messaging (Zero Polling):**
   - Full-duplex WebSocket connection via Socket.IO.
   - Private 1-to-1 rooms (`user_${recipientId}`) ensuring zero delay and zero HTTP API polling.
2. **Automated PII Data Masking:**
   - **Phone Numbers:** First 2 and last 2 digits remain visible, middle digits masked with `*` (e.g. `9876543210` → `98******10`, `+91 98765 43210` → `+91 98******10`).
   - **Email Addresses:** Username/local-part masked, keeping `@` and domain visible (e.g. `john.doe@example.com` → `j******e@example.com`).
3. **Database Persistence:**
   - MySQL database with composite indexes (`conversation_id, created_at DESC`) for fast chronological history loading.
   - Dual-storage of original and masked contents.
4. **Presence & Typing Status:**
   - Real-time online/offline indicators without page reloads.
   - Live "Typing..." indicators.
   - Read receipts (single checkmark `✓` for sent, double checkmark `✓✓` for read).
5. **Security & Validation:**
   - JWT authentication verified at the WebSocket handshake level.
   - Parameterized SQL queries (`mysql2/promise`) preventing SQL injection.
   - XSS sanitization and bcrypt password hashing.

---

## 📁 Project Structure

```text
chatsystem/
├── src/
│   ├── config/
│   │   ├── database.js          # MySQL2 connection pool
│   ├── controllers/             # Auth, User, and Chat controllers
│   ├── middlewares/             # HTTP auth & Socket handshake auth
│   ├── models/                  # User, Conversation, Message queries
│   ├── routes/                  # REST API endpoints (/api)
│   ├── services/
│   │   ├── masking.service.js   # Phone & Email regex masking engine
│   │   ├── chat.service.js      # Message workflow & MySQL persistence
│   │   └── presence.service.js  # Online/Offline user registry
│   ├── sockets/                 # Socket.IO handlers (chat, presence)
│   ├── app.js                   # Express application
│   └── server.js                # Server entry point (HTTP + WebSocket)
├── public/                      # Ready-to-run Single-Page React Chat Client (at http://localhost:5000)
├── client/                      # Modular Vite + React client source code
├── database/
│   ├── migrations/              # SQL DDL migrations
│   └── seeders/                 # Demo test users
├── test_masking.js              # Unit tests for Phone & Email masking
├── .env                         # Server & database environment variables
└── package.json
```

---

## 🚀 How to Run

### Step 1: Install Dependencies
Open terminal in `chatsystem/`:
```bash
npm install
```

### Step 2: Ensure MySQL Database is Running
Make sure MySQL is running (e.g., via XAMPP on port 3306).  
The database `db_chatsystem` has already been migrated. If needed, you can run:
```bash
npm run migrate
```

### Step 3: Seed Demo Accounts
```bash
npm run seed
```
This pre-populates 4 demo accounts:
- **Alice Smith:** `alice@example.com` (password: `password123`)
- **Bob Jones:** `bob@example.com` (password: `password123`)
- **Charlie Brown:** `charlie@example.com` (password: `password123`)
- **Diana Prince:** `diana@example.com` (password: `password123`)

### Step 4: Start the Server
```bash
npm start
```
The server will boot at **`http://localhost:5000`**.

---

## 💻 Testing Real-Time Chat

1. Open **`http://localhost:5000`** in **Browser Window 1** and log in as **Alice Smith** (or click the quick demo button).
2. Open **`http://localhost:5000`** in an **Incognito Window / Browser Window 2** and log in as **Bob Jones**.
3. Notice that Bob appears **Online** with a green badge in Alice's contact list immediately!
4. Send a message containing a phone number or email:
   > *"Hi Bob, call me at 9876543210 or email me at alice.smith@example.com"*
5. Observe the message delivering instantly to Bob's screen with masked PII:
   > *"Hi Bob, call me at 98\*\*\*\*\*\*10 or email me at a\*\*\*\*\*h@example.com"*
