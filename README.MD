# 🎧 Real-Time Expert Support API
A specialized, high-performance backend for connecting Users with Experts in real-time. This system manages the full lifecycle of support tickets, from initial request to secure chat sessions.

---

## 🛠 Tech Stack
* **Language:** TypeScript
* **Database:** PostgreSQL (via Prisma ORM)
* **Real-time:** Socket.io (with JWT Handshake Authentication)
* **Security:** JWT (JSON Web Tokens) & Bcryptjs
* **Validation:** Zod

---

## ⚡ Key Features
* **Handshake Authentication:** Sockets are strictly secured. The connection is rejected if a valid JWT is not provided in the handshake.
* **Presence Tracking:** Automatically updates the `isOnline` status for Users and Experts in the database upon connection or disconnection.
* **Support Request Workflow:** 1. Users create a request (Status: `REQUESTED`).
    2. Once an expert is assigned, status becomes `ACTIVE`.
    3. Secure chat rooms are dynamically created using the `requestId`.
* **Access Control:** The system verifies that only the original requester or the assigned expert can join a specific chat room.
* **Message Persistence:** All real-time messages are saved to PostgreSQL via Prisma to ensure chat history is never lost.

---

## ⚙️ Installation & Setup

### 1. Clone the Repository
```bash
git clone [your-repo-url]
cd [your-folder-name]

---
2. Install Dependencies
    cmd
    npm install

3. Environment Setup 
   Create a .env file in the root directory and add:
   Code snippet

  DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
  JWT_SECRET="your_secret_key"
  PORT=3001

4. Database Initialization (Prisma)
    # Generate Prisma Client
    npx prisma generate

    # Run migrations to create tables in PostgreSQL
    npx prisma migrate dev --name init


5. Run the Project

    # Development mode
    npm run dev


🔌 Socket.io API Documentation
Connection
To connect, the client must pass a JWT token in the auth object:

JavaScript

const socket = io("http://localhost:3001", {
  auth: { token: "YOUR_JWT_TOKEN" }
});


Event,                    Direction,          Payload,                        Description
join-request,             Client → Server,    requestId: string,              Joins the chat room. Only allowed if status is ACTIVE and user is authorized.

Send-message,             Client → Server,    "{ requestId, content }",       Sends a message. Content is saved to DB and broadcasted to the room.

new-message,              Server → Client,     Message Object,                Emitted to the room whenever a new message is sent.

error,                    Server → Client,      string,                       "Emitted when validation fails (e.g., ""Access Denied"")."



Folder Structure

.
├── prisma/                 # Database schema and migrations
│   └── schema.prisma       # Prisma models (User, Expert, SupportRequest)
├── src/
│   ├── config/             # Database & third-party configurations
│   ├── middlewares/        # Authentication & protection filters
│   ├── modules/            # Core Business Logic (Modularized)
│   │   ├── admin/          # Management & Seeding logic
│   │   ├── auth/           # Login, Registration & JWT handling
│   │   ├── matching/       # Logic for assigning Experts to Users
│   │   ├── messages/       # Chat history & message handling
│   │   ├── profiles/       # User & Expert profile management
│   │   ├── requests/       # Ticket lifecycle (Requested -> Active)
│   │   └── reviews/        # Rating and feedback system
│   ├── app.ts              # Express application setup
│   ├── server.ts           # Entry point (HTTP + Socket server)
│   └── socket.ts           # Real-time event handlers
├── .env                    # Environment secrets (DO NOT PUSH)
├── package.json            # Dependencies and scripts
└── tsconfig.json           # TypeScript configuration


### 🧪 Seeding Test Data
To create a pre-configured Expert account for testing, run:
```bash
npx ts-node src/modules/admin/expert.seed.ts

Default Credentials:
Email: expert@marketplace.com
Password: ExpertPassword123